import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { BudgetsService } from './budgets.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { BudgetNotFoundError } from '../../common/errors/app-errors.js';

describe('BudgetsService', () => {
    let service: BudgetsService;
    let prisma: {
        budget: { findUnique: ReturnType<typeof vi.fn> };
        bankTransaction: { aggregate: ReturnType<typeof vi.fn> };
    };

    beforeEach(async () => {
        prisma = {
            budget: { findUnique: vi.fn() },
            bankTransaction: { aggregate: vi.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BudgetsService,
                { provide: PrismaService, useValue: prisma },
                { provide: AccountsService, useValue: {} },
            ],
        }).compile();

        service = module.get<BudgetsService>(BudgetsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('throws BudgetNotFoundError when the budget belongs to another user', async () => {
        prisma.budget.findUnique.mockResolvedValue({ id: 1, account: { userId: 99 } });

        await expect(service.getStatus(10, 1)).rejects.toBeInstanceOf(BudgetNotFoundError);
    });

    it('computes spent, remaining and percentage against the tracked category', async () => {
        prisma.budget.findUnique.mockResolvedValue({
            id: 1,
            accountId: 1,
            categoryId: 2,
            userId: 10,
            account: { userId: 10 },
            limitAmount: new Prisma.Decimal(1000),
            startPeriod: new Date('2026-01-01'),
            endPeriod: new Date('2026-01-31'),
        });
        prisma.bankTransaction.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(250) } });

        const status = await service.getStatus(10, 1);

        expect(status).toEqual({
            limitAmount: 1000,
            spent: 250,
            remaining: 750,
            percentage: 25,
        });
    });

    it('returns 0% when the limit is zero, without dividing by zero', async () => {
        prisma.budget.findUnique.mockResolvedValue({
            id: 1,
            accountId: 1,
            categoryId: 2,
            account: { userId: 10 },
            limitAmount: new Prisma.Decimal(0),
            startPeriod: new Date('2026-01-01'),
            endPeriod: new Date('2026-01-31'),
        });
        prisma.bankTransaction.aggregate.mockResolvedValue({ _sum: { amount: null } });

        const status = await service.getStatus(10, 1);

        expect(status.percentage).toBe(0);
    });
});
