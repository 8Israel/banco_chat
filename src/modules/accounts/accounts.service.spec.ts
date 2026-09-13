import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AccountsService } from './accounts.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AccountNotFoundError } from '../../common/errors/app-errors.js';

describe('AccountsService', () => {
    let service: AccountsService;
    let prisma: { account: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> } };

    beforeEach(async () => {
        prisma = {
            account: {
                findUnique: vi.fn(),
                update: vi.fn(),
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
});
