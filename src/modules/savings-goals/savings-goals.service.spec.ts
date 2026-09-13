import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { SavingsGoalsService } from './savings-goals.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { SavingsGoalNotFoundError } from '../../common/errors/app-errors.js';

describe('SavingsGoalsService', () => {
    let service: SavingsGoalsService;
    let prisma: {
        savingsGoal: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    };

    beforeEach(async () => {
        prisma = {
            savingsGoal: { findUnique: vi.fn(), update: vi.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SavingsGoalsService,
                { provide: PrismaService, useValue: prisma },
                { provide: AccountsService, useValue: {} },
            ],
        }).compile();

        service = module.get<SavingsGoalsService>(SavingsGoalsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('throws SavingsGoalNotFoundError when the goal belongs to another user', async () => {
        prisma.savingsGoal.findUnique.mockResolvedValue({ id: 1, account: { userId: 99 } });

        await expect(service.contribute(10, 1, 500)).rejects.toBeInstanceOf(SavingsGoalNotFoundError);
    });

    it('adds the contribution on top of the existing actualAmount', async () => {
        prisma.savingsGoal.findUnique.mockResolvedValue({
            id: 1,
            account: { userId: 10 },
            actualAmount: new Prisma.Decimal(42000),
        });
        prisma.savingsGoal.update.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

        const updated = await service.contribute(10, 1, 1000);

        expect(updated.actualAmount.toNumber()).toBe(43000);
    });
});
