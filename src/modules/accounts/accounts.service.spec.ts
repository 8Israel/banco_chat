import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AccountsService } from './accounts.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AccountNotFoundError } from '../../common/errors/app-errors.js';

describe('AccountsService', () => {
    let service: AccountsService;
    let prisma: {
        account: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
    };

    beforeEach(async () => {
        prisma = {
            account: {
                findUnique: vi.fn(),
                update: vi.fn(),
                create: vi.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [AccountsService, { provide: PrismaService, useValue: prisma }],
        }).compile();

        service = module.get<AccountsService>(AccountsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('returns the account when it belongs to the user', async () => {
        prisma.account.findUnique.mockResolvedValue({ id: 1, userId: 10 });

        const account = await service.findOwnedAccount(10, 1);

        expect(account).toEqual({ id: 1, userId: 10 });
    });

    it('throws AccountNotFoundError when the account belongs to another user', async () => {
        prisma.account.findUnique.mockResolvedValue({ id: 1, userId: 99 });

        await expect(service.findOwnedAccount(10, 1)).rejects.toBeInstanceOf(AccountNotFoundError);
    });

    it('throws AccountNotFoundError when the account does not exist', async () => {
        prisma.account.findUnique.mockResolvedValue(null);

        await expect(service.findOwnedAccount(10, 1)).rejects.toBeInstanceOf(AccountNotFoundError);
    });

    it('creates a new account for the user, defaulting currentBalance to 0', async () => {
        prisma.account.create.mockImplementation(({ data }) => Promise.resolve({ id: 30, ...data }));

        const account = await service.create(10, { typeAccount: 'DEBIT' as never, alias: 'Nueva cuenta' });

        expect(prisma.account.create).toHaveBeenCalledWith({
            data: {
                userId: 10,
                typeAccount: 'DEBIT',
                alias: 'Nueva cuenta',
                last4Digits: undefined,
                currentBalance: 0,
            },
        });
        expect(account).toMatchObject({ id: 30, userId: 10, currentBalance: 0 });
    });
});
