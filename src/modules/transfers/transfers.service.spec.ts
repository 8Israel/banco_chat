import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { TransfersService } from './transfers.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { InsufficientBalanceError, ValidationFailedError } from '../../common/errors/app-errors.js';

describe('TransfersService', () => {
    let service: TransfersService;
    let prisma: {
        account: { update: ReturnType<typeof vi.fn> };
        transfer: { create: ReturnType<typeof vi.fn> };
        $transaction: ReturnType<typeof vi.fn>;
    };
    let accountsService: { findOwnedAccount: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
        prisma = {
            account: { update: vi.fn() },
            transfer: { create: vi.fn() },
            $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
        };
        accountsService = { findOwnedAccount: vi.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransfersService,
                { provide: PrismaService, useValue: prisma },
                { provide: AccountsService, useValue: accountsService },
            ],
        }).compile();

        service = module.get<TransfersService>(TransfersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('rejects a transfer to the same account', async () => {
        await expect(
            service.create(1, { fromAccountId: 5, toAccountId: 5, amount: 100 }),
        ).rejects.toBeInstanceOf(ValidationFailedError);
    });

    it('throws InsufficientBalanceError when the source account cannot cover the amount', async () => {
        accountsService.findOwnedAccount
            .mockResolvedValueOnce({ id: 1, currentBalance: new Prisma.Decimal(50) })
            .mockResolvedValueOnce({ id: 2, currentBalance: new Prisma.Decimal(0) });

        await expect(
            service.create(1, { fromAccountId: 1, toAccountId: 2, amount: 100 }),
        ).rejects.toBeInstanceOf(InsufficientBalanceError);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('moves the balance atomically and creates the transfer when funds are sufficient', async () => {
        accountsService.findOwnedAccount
            .mockResolvedValueOnce({ id: 1, currentBalance: new Prisma.Decimal(500) })
            .mockResolvedValueOnce({ id: 2, currentBalance: new Prisma.Decimal(0) });
        prisma.account.update.mockResolvedValue({});
        const createdTransfer = { id: 1, fromAccountId: 1, toAccountId: 2, amount: new Prisma.Decimal(100) };
        prisma.transfer.create.mockResolvedValue(createdTransfer);

        const result = await service.create(1, { fromAccountId: 1, toAccountId: 2, amount: 100 });

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(result).toEqual(createdTransfer);
    });
});
