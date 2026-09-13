import { Test, TestingModule } from '@nestjs/testing';
import { McpClientService } from './mcp-client.service.js';
import { McpServerProvider } from './mcp-server.provider.js';
import { AccountsService } from '../../accounts/accounts.service.js';
import { SavingsGoalsService } from '../../savings-goals/savings-goals.service.js';
import { TransactionsService } from '../../transactions/transactions.service.js';
import { BudgetsService } from '../../budgets/budgets.service.js';
import { TransfersService } from '../../transfers/transfers.service.js';
import { CategoriesService } from '../../categories/categories.service.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { AccountType } from '../../../generated/prisma/enums.js';

describe('McpClientService (real MCP server, in-memory transport)', () => {
    let mcpClient: McpClientService;
    let accountsService: {
        findAllForUser: ReturnType<typeof vi.fn>;
        findOwnedAccount: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
    };
    let budgetsService: { findOwnedBudget: ReturnType<typeof vi.fn>; getStatus: ReturnType<typeof vi.fn> };
    let transfersService: { create: ReturnType<typeof vi.fn> };
    let categoriesService: { findAll: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
        accountsService = {
            findAllForUser: vi.fn(),
            findOwnedAccount: vi.fn(),
            create: vi.fn(),
        };
        budgetsService = {
            findOwnedBudget: vi.fn(),
            getStatus: vi.fn(),
        };
        transfersService = {
            create: vi.fn(),
        };
        categoriesService = {
            findAll: vi.fn().mockResolvedValue([]),
            findById: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                McpServerProvider,
                McpClientService,
                { provide: AccountsService, useValue: accountsService },
                { provide: SavingsGoalsService, useValue: {} },
                { provide: TransactionsService, useValue: {} },
                { provide: BudgetsService, useValue: budgetsService },
                { provide: TransfersService, useValue: transfersService },
                { provide: CategoriesService, useValue: categoriesService },
            ],
        }).compile();

        mcpClient = module.get(McpClientService);
        await mcpClient.onModuleInit();
    });

    it('lists the registered tools without leaking the internal userId field', async () => {
        const tools = await mcpClient.listToolDefinitions();

        expect(tools.map((t) => t.name)).toEqual(
            expect.arrayContaining([
                'get_accounts',
                'get_categories',
                'get_savings_goals',
                'simulate_savings_plan',
                'create_savings_goal',
                'contribute_savings_goal',
                'get_transactions',
                'create_transaction',
                'get_monthly_summary',
                'get_spending_by_category',
                'get_budgets',
                'get_budget_status',
                'create_budget',
                'get_transfers',
                'create_transfer',
            ]),
        );
        for (const tool of tools) {
            expect(tool.parameters.properties).not.toHaveProperty('userId');
            expect(tool.parameters.required ?? []).not.toContain('userId');
        }
    });

    it('injects userId server-side and returns the real account data', async () => {
        accountsService.findAllForUser.mockResolvedValue([
            {
                id: 1,
                typeAccount: AccountType.DEBIT,
                alias: 'Cuenta Nómina',
                currentBalance: new Prisma.Decimal(1000),
            },
        ]);

        const result = await mcpClient.callTool('get_accounts', {}, 42);

        expect(accountsService.findAllForUser).toHaveBeenCalledWith(42);
        expect(result.isError).toBe(false);
        expect(JSON.parse(result.text)).toEqual([
            { id: 1, typeAccount: 'DEBIT', alias: 'Cuenta Nómina', currentBalance: 1000 },
        ]);
        expect(result.ui).toEqual({
            component: 'AccountsList',
            props: { accounts: [{ id: 1, typeAccount: 'DEBIT', alias: 'Cuenta Nómina', currentBalance: 1000 }] },
        });
    });

    it('computes savings plan options and returns the A2UI component', async () => {
        const result = await mcpClient.callTool(
            'simulate_savings_plan',
            { targetAmount: 24000, months: 12 },
            1,
        );

        expect(result.ui).toEqual({
            component: 'SavingsPlanSimulator',
            props: {
                targetAmount: 24000,
                options: [
                    { months: 12, monthlyContribution: 2000 },
                    { months: 18, monthlyContribution: 1333.33 },
                    { months: 24, monthlyContribution: 1000 },
                ],
            },
        });
    });

    it('combines budget + category data into a BudgetStatusCard', async () => {
        budgetsService.findOwnedBudget.mockResolvedValue({ id: 7, categoryId: 32 });
        budgetsService.getStatus.mockResolvedValue({ limitAmount: 6000, spent: 3378.41, remaining: 2621.59, percentage: 56.31 });
        categoriesService.findById.mockResolvedValue({ id: 32, name: 'Alimentación' });

        const result = await mcpClient.callTool('get_budget_status', { budgetId: 7 }, 10);

        expect(budgetsService.findOwnedBudget).toHaveBeenCalledWith(10, 7);
        expect(result.ui).toEqual({
            component: 'BudgetStatusCard',
            props: {
                id: 7,
                categoryName: 'Alimentación',
                limitAmount: 6000,
                spent: 3378.41,
                remaining: 2621.59,
                percentage: 56.31,
            },
        });
    });

    it('creates a real transfer between the user own accounts', async () => {
        transfersService.create.mockResolvedValue({
            id: 3,
            fromAccountId: 1,
            toAccountId: 2,
            amount: new Prisma.Decimal(500),
            description: 'Ahorro mensual',
            date: new Date('2026-01-15T00:00:00.000Z'),
        });

        const result = await mcpClient.callTool(
            'create_transfer',
            { fromAccountId: 1, toAccountId: 2, amount: 500, description: 'Ahorro mensual' },
            10,
        );

        expect(transfersService.create).toHaveBeenCalledWith(10, {
            fromAccountId: 1,
            toAccountId: 2,
            amount: 500,
            description: 'Ahorro mensual',
        });
        expect(result.ui).toEqual({
            component: 'TransferCard',
            props: {
                id: 3,
                fromAccountId: 1,
                toAccountId: 2,
                amount: 500,
                description: 'Ahorro mensual',
                date: '2026-01-15T00:00:00.000Z',
            },
        });
    });

    it('turns a thrown business error into an MCP tool error instead of rejecting', async () => {
        accountsService.findAllForUser.mockResolvedValue([]);
        accountsService.findOwnedAccount.mockRejectedValue(new Error('cuenta ajena'));

        const result = await mcpClient.callTool('get_savings_goals', { accountId: 999 }, 1);

        expect(result.isError).toBe(true);
        expect(result.text).toContain('cuenta ajena');
    });
});
