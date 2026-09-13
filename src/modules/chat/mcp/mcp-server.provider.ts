import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AccountsService } from '../../accounts/accounts.service.js';
import { SavingsGoalsService } from '../../savings-goals/savings-goals.service.js';
import { TransactionsService } from '../../transactions/transactions.service.js';
import { BudgetsService } from '../../budgets/budgets.service.js';
import { TransfersService } from '../../transfers/transfers.service.js';
import { CategoriesService } from '../../categories/categories.service.js';
import { AccountType } from '../../../generated/prisma/enums.js';
import { AccountNotFoundError } from '../../../common/errors/app-errors.js';
import type { Account, BankTransaction, Budget, SavingsGoal, Transfer } from '../../../generated/prisma/client.js';
import type {
    AccountCardProps,
    BudgetCardProps,
    SavingsGoalCardProps,
    TransactionCardProps,
    TransferCardProps,
    UiComponent,
} from '../ui/ui-component.types.js';

// El campo `userId` viaja en el inputSchema real de cada tool (así el server
// sabe de quién es la llamada), pero McpClientService lo quita antes de
// mostrarle el schema al LLM: el modelo nunca lo ve ni lo rellena.
const userIdField = { userId: z.number().int() };

function toAccountCard(account: Account): AccountCardProps {
    return {
        id: account.id,
        typeAccount: account.typeAccount,
        alias: account.alias,
        currentBalance: account.currentBalance.toNumber(),
    };
}

function toSavingsGoalCard(goal: SavingsGoal): SavingsGoalCardProps {
    const targetAmount = goal.targetAmount.toNumber();
    const actualAmount = goal.actualAmount.toNumber();
    return {
        id: goal.id,
        name: goal.name,
        targetAmount,
        actualAmount,
        progressPercent: targetAmount === 0 ? 0 : Math.round((actualAmount / targetAmount) * 10000) / 100,
    };
}

function toTransactionCard(transaction: BankTransaction, categoryName: string): TransactionCardProps {
    return {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount.toNumber(),
        description: transaction.description,
        date: transaction.date.toISOString(),
        categoryName,
    };
}

function toBudgetCard(budget: Budget, categoryName: string): BudgetCardProps {
    return {
        id: budget.id,
        categoryName,
        limitAmount: budget.limitAmount.toNumber(),
        startPeriod: budget.startPeriod.toISOString(),
        endPeriod: budget.endPeriod.toISOString(),
    };
}

function toTransferCard(transfer: Transfer): TransferCardProps {
    return {
        id: transfer.id,
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        amount: transfer.amount.toNumber(),
        description: transfer.description,
        date: transfer.date.toISOString(),
    };
}

function textResult(payload: unknown, ui?: UiComponent) {
    return {
        content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
        ...(ui ? { structuredContent: ui as unknown as Record<string, unknown> } : {}),
    };
}

/**
 * Construye el McpServer real (SDK oficial) con las tools que el chat expone
 * al LLM. Las tools llaman directo a los services de Nest ya probados en la
 * capa bancaria (Accounts/SavingsGoals/Transactions/Budgets/Transfers) - no
 * hay lógica de negocio nueva acá, solo el mapeo tool -> service + la forma
 * A2UI de la respuesta.
 */
@Injectable()
export class McpServerProvider {
    readonly server: McpServer;

    constructor(
        private readonly accountsService: AccountsService,
        private readonly savingsGoalsService: SavingsGoalsService,
        private readonly transactionsService: TransactionsService,
        private readonly budgetsService: BudgetsService,
        private readonly transfersService: TransfersService,
        private readonly categoriesService: CategoriesService,
    ) {
        this.server = new McpServer({ name: 'banco-chat-mcp', version: '1.0.0' });
        this.registerTools();
    }

    // Cuenta por defecto para el dominio de ahorro cuando el LLM no especifica
    // accountId: la primera cuenta de ahorro activa del usuario, o si no
    // tiene, su primera cuenta activa. Usada solo por las tools de savings.
    private async resolveSavingsAccountId(userId: number, accountId?: number): Promise<number> {
        if (accountId !== undefined) {
            const account = await this.accountsService.findOwnedAccount(userId, accountId);
            return account.id;
        }

        const accounts = await this.accountsService.findAllForUser(userId);
        const chosen =
            accounts.find((a) => a.typeAccount === AccountType.SAVINGS && a.isActive) ??
            accounts.find((a) => a.isActive) ??
            accounts[0];

        if (!chosen) {
            throw new AccountNotFoundError('El usuario no tiene ninguna cuenta registrada');
        }
        return chosen.id;
    }

    // Cuenta por defecto para tools de solo lectura de otros dominios
    // (transacciones, presupuestos): sin preferencia de tipo, solo la primera
    // cuenta activa. Las tools que escriben dinero (crear transacción,
    // presupuesto o transferencia) piden accountId explícito, sin default.
    private async resolveAnyAccountId(userId: number, accountId?: number): Promise<number> {
        if (accountId !== undefined) {
            const account = await this.accountsService.findOwnedAccount(userId, accountId);
            return account.id;
        }

        const accounts = await this.accountsService.findAllForUser(userId);
        const chosen = accounts.find((a) => a.isActive) ?? accounts[0];

        if (!chosen) {
            throw new AccountNotFoundError('El usuario no tiene ninguna cuenta registrada');
        }
        return chosen.id;
    }

    private async buildCategoryNameMap(): Promise<Map<number, string>> {
        const categories = await this.categoriesService.findAll();
        return new Map(categories.map((c) => [c.id, c.name]));
    }

    private registerTools() {
        this.registerAccountTools();
        this.registerCategoryTools();
        this.registerSavingsGoalTools();
        this.registerTransactionTools();
        this.registerBudgetTools();
        this.registerTransferTools();
    }

    private registerAccountTools() {
        this.server.registerTool(
            'get_accounts',
            {
                description: 'Lista las cuentas bancarias del usuario autenticado (tipo, alias, saldo actual).',
                inputSchema: { ...userIdField },
            },
            async ({ userId }) => {
                const accounts = await this.accountsService.findAllForUser(userId);
                const cards = accounts.map(toAccountCard);
                return textResult(cards, { component: 'AccountsList', props: { accounts: cards } });
            },
        );

        this.server.registerTool(
            'create_account',
            {
                description:
                    'Da de alta una cuenta bancaria real y nueva para el usuario (débito, crédito, efectivo o ahorro). Requiere confirmación previa del usuario antes de ejecutarse.',
                inputSchema: {
                    ...userIdField,
                    typeAccount: z.enum(['DEBIT', 'CREDIT', 'CASH', 'SAVINGS']),
                    alias: z.string().max(100).optional(),
                    last4Digits: z.string().max(4).optional(),
                    currentBalance: z.number().optional(),
                },
            },
            async ({ userId, typeAccount, alias, last4Digits, currentBalance }) => {
                const account = await this.accountsService.create(userId, {
                    typeAccount,
                    alias,
                    last4Digits,
                    currentBalance,
                });
                const card = toAccountCard(account);
                return textResult(card, { component: 'AccountCard', props: card });
            },
        );
    }

    private registerCategoryTools() {
        this.server.registerTool(
            'get_categories',
            {
                description:
                    'Lista el catálogo de categorías (id, nombre, icono) usado por transacciones y presupuestos. Úsala para resolver el categoryId antes de llamar create_transaction o create_budget cuando la persona solo menciona el nombre de la categoría.',
                inputSchema: { ...userIdField },
            },
            async () => {
                const categories = await this.categoriesService.findAll();
                return textResult(categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })));
            },
        );
    }

    private registerSavingsGoalTools() {
        this.server.registerTool(
            'get_savings_goals',
            {
                description:
                    'Lista las metas de ahorro de una cuenta del usuario. Si no se indica accountId, usa la cuenta de ahorro por defecto del usuario.',
                inputSchema: { ...userIdField, accountId: z.number().int().optional() },
            },
            async ({ userId, accountId }) => {
                const resolvedAccountId = await this.resolveSavingsAccountId(userId, accountId);
                const goals = await this.savingsGoalsService.findAllForAccount(userId, resolvedAccountId);
                const cards = goals.map(toSavingsGoalCard);
                return textResult(cards, { component: 'SavingsGoalsList', props: { goals: cards } });
            },
        );

        this.server.registerTool(
            'simulate_savings_plan',
            {
                description:
                    'Calcula 3 opciones de plan de ahorro (distintos plazos en meses y su aportación mensual) para llegar a un monto objetivo. No guarda nada, es solo una simulación para mostrarle opciones al usuario antes de crear la meta.',
                inputSchema: {
                    ...userIdField,
                    targetAmount: z.number().positive(),
                    months: z.number().int().positive().optional(),
                },
            },
            async ({ targetAmount, months }) => {
                const baseMonths = months && months > 0 ? months : 12;
                const terms = Array.from(new Set([baseMonths, baseMonths + 6, baseMonths + 12])).sort(
                    (a, b) => a - b,
                );
                const options = terms.map((term) => ({
                    months: term,
                    monthlyContribution: Math.round((targetAmount / term) * 100) / 100,
                }));
                return textResult(options, {
                    component: 'SavingsPlanSimulator',
                    props: { targetAmount, options },
                });
            },
        );

        this.server.registerTool(
            'create_savings_goal',
            {
                description:
                    'Crea una meta de ahorro real para el usuario. Solo debe llamarse después de que el usuario confirmó explícitamente el plan (por ejemplo, tras usar simulate_savings_plan).',
                inputSchema: {
                    ...userIdField,
                    accountId: z.number().int().optional(),
                    name: z.string().min(1).max(300),
                    targetAmount: z.number().positive(),
                },
            },
            async ({ userId, accountId, name, targetAmount }) => {
                const resolvedAccountId = await this.resolveSavingsAccountId(userId, accountId);
                const goal = await this.savingsGoalsService.create(userId, resolvedAccountId, {
                    name,
                    targetAmount,
                });
                const card = toSavingsGoalCard(goal);
                return textResult(card, { component: 'SavingsGoalCard', props: card });
            },
        );

        this.server.registerTool(
            'contribute_savings_goal',
            {
                description:
                    'Registra una aportación real a una meta de ahorro existente del usuario. Solo debe llamarse tras confirmación explícita del usuario.',
                inputSchema: {
                    ...userIdField,
                    goalId: z.number().int(),
                    amount: z.number().positive(),
                },
            },
            async ({ userId, goalId, amount }) => {
                const goal = await this.savingsGoalsService.contribute(userId, goalId, amount);
                const card = toSavingsGoalCard(goal);
                return textResult(card, { component: 'SavingsGoalCard', props: card });
            },
        );
    }

    private registerTransactionTools() {
        this.server.registerTool(
            'get_transactions',
            {
                description:
                    'Lista los movimientos (ingresos/gastos) de una cuenta del usuario, con filtros opcionales de fecha, categoría y tipo. Si no se indica accountId, usa la primera cuenta activa del usuario.',
                inputSchema: {
                    ...userIdField,
                    accountId: z.number().int().optional(),
                    from: z.string().optional(),
                    to: z.string().optional(),
                    categoryId: z.number().int().optional(),
                    type: z.enum(['INCOME', 'EXPENSE']).optional(),
                    limit: z.number().int().positive().optional(),
                },
            },
            async ({ userId, accountId, from, to, categoryId, type, limit }) => {
                const resolvedAccountId = await this.resolveAnyAccountId(userId, accountId);
                const transactions = await this.transactionsService.findAllForAccount(userId, resolvedAccountId, {
                    from,
                    to,
                    categoryId,
                    type,
                    page: 1,
                    limit: limit ?? 20,
                });
                const categoryNames = await this.buildCategoryNameMap();
                const cards = transactions.map((t) =>
                    toTransactionCard(t, categoryNames.get(t.categoryId) ?? 'Desconocida'),
                );
                return textResult(cards, { component: 'TransactionsList', props: { transactions: cards } });
            },
        );

        this.server.registerTool(
            'create_transaction',
            {
                description:
                    'Registra un movimiento real (ingreso o gasto) en una cuenta del usuario y actualiza su saldo. Requiere accountId explícito.',
                inputSchema: {
                    ...userIdField,
                    accountId: z.number().int(),
                    categoryId: z.number().int(),
                    type: z.enum(['INCOME', 'EXPENSE']),
                    amount: z.number().positive(),
                    description: z.string().max(300).optional(),
                    date: z.string().optional(),
                },
            },
            async ({ userId, accountId, categoryId, type, amount, description, date }) => {
                const transaction = await this.transactionsService.create(userId, accountId, {
                    categoryId,
                    type,
                    amount,
                    description,
                    date,
                });
                const category = await this.categoriesService.findById(categoryId);
                const card = toTransactionCard(transaction, category.name);
                return textResult(card, { component: 'TransactionCard', props: card });
            },
        );

        this.server.registerTool(
            'get_monthly_summary',
            {
                description:
                    'Devuelve ingresos, gastos y ahorro neto de una cuenta para un mes dado (formato YYYY-MM). Si no se indica accountId, usa la primera cuenta activa del usuario.',
                inputSchema: {
                    ...userIdField,
                    accountId: z.number().int().optional(),
                    month: z.string(),
                },
            },
            async ({ userId, accountId, month }) => {
                const resolvedAccountId = await this.resolveAnyAccountId(userId, accountId);
                const summary = await this.transactionsService.getMonthlySummary(userId, resolvedAccountId, month);
                return textResult(summary, { component: 'MonthlySummaryCard', props: summary });
            },
        );

        this.server.registerTool(
            'get_spending_by_category',
            {
                description:
                    'Suma los gastos de una cuenta agrupados por categoría, en un rango de fechas opcional. Si no se indica accountId, usa la primera cuenta activa del usuario.',
                inputSchema: {
                    ...userIdField,
                    accountId: z.number().int().optional(),
                    from: z.string().optional(),
                    to: z.string().optional(),
                },
            },
            async ({ userId, accountId, from, to }) => {
                const resolvedAccountId = await this.resolveAnyAccountId(userId, accountId);
                const items = await this.transactionsService.getSpendingByCategory(
                    userId,
                    resolvedAccountId,
                    from,
                    to,
                );
                const mapped = items.map((i) => ({ categoryName: i.categoryName, total: i.total }));
                return textResult(mapped, { component: 'SpendingByCategoryList', props: { items: mapped } });
            },
        );
    }

    private registerBudgetTools() {
        this.server.registerTool(
            'get_budgets',
            {
                description:
                    'Lista los presupuestos de una cuenta del usuario. Si no se indica accountId, usa la primera cuenta activa del usuario.',
                inputSchema: { ...userIdField, accountId: z.number().int().optional() },
            },
            async ({ userId, accountId }) => {
                const resolvedAccountId = await this.resolveAnyAccountId(userId, accountId);
                const budgets = await this.budgetsService.findAllForAccount(userId, resolvedAccountId);
                const categoryNames = await this.buildCategoryNameMap();
                const cards = budgets.map((b) => toBudgetCard(b, categoryNames.get(b.categoryId) ?? 'Desconocida'));
                return textResult(cards, { component: 'BudgetsList', props: { budgets: cards } });
            },
        );

        this.server.registerTool(
            'get_budget_status',
            {
                description:
                    'Devuelve cuánto se ha gastado contra un presupuesto específico del usuario (limitAmount, spent, remaining, percentage).',
                inputSchema: { ...userIdField, budgetId: z.number().int() },
            },
            async ({ userId, budgetId }) => {
                const budget = await this.budgetsService.findOwnedBudget(userId, budgetId);
                const status = await this.budgetsService.getStatus(userId, budgetId);
                const category = await this.categoriesService.findById(budget.categoryId);
                const card = { id: budget.id, categoryName: category.name, ...status };
                return textResult(card, { component: 'BudgetStatusCard', props: card });
            },
        );

        this.server.registerTool(
            'create_budget',
            {
                description: 'Crea un presupuesto real (límite de gasto por categoría y periodo) para una cuenta del usuario. Requiere accountId explícito.',
                inputSchema: {
                    ...userIdField,
                    accountId: z.number().int(),
                    categoryId: z.number().int(),
                    limitAmount: z.number().positive(),
                    startPeriod: z.string(),
                    endPeriod: z.string(),
                },
            },
            async ({ userId, accountId, categoryId, limitAmount, startPeriod, endPeriod }) => {
                const budget = await this.budgetsService.create(userId, accountId, {
                    categoryId,
                    limitAmount,
                    startPeriod,
                    endPeriod,
                });
                const category = await this.categoriesService.findById(categoryId);
                const card = toBudgetCard(budget, category.name);
                return textResult(card, { component: 'BudgetCard', props: card });
            },
        );
    }

    private registerTransferTools() {
        this.server.registerTool(
            'get_transfers',
            {
                description: 'Lista las transferencias entre cuentas del usuario.',
                inputSchema: { ...userIdField },
            },
            async ({ userId }) => {
                const transfers = await this.transfersService.findAllForUser(userId);
                const cards = transfers.map(toTransferCard);
                return textResult(cards, { component: 'TransfersList', props: { transfers: cards } });
            },
        );

        this.server.registerTool(
            'create_transfer',
            {
                description:
                    'Mueve dinero real entre dos cuentas del propio usuario. Requiere fromAccountId y toAccountId explícitos y confirmación previa del usuario.',
                inputSchema: {
                    ...userIdField,
                    fromAccountId: z.number().int(),
                    toAccountId: z.number().int(),
                    amount: z.number().positive(),
                    description: z.string().max(300).optional(),
                },
            },
            async ({ userId, fromAccountId, toAccountId, amount, description }) => {
                const transfer = await this.transfersService.create(userId, {
                    fromAccountId,
                    toAccountId,
                    amount,
                    description,
                });
                const card = toTransferCard(transfer);
                return textResult(card, { component: 'TransferCard', props: card });
            },
        );
    }
}
