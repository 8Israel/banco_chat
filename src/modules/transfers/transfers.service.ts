import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { CreateTransferDto } from './dto/create-transfer.dto.js';
import { Prisma } from '../../generated/prisma/client.js';
import {
    InsufficientBalanceError,
    TransferNotFoundError,
    ValidationFailedError,
} from '../../common/errors/app-errors.js';

@Injectable()
export class TransfersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly accountsService: AccountsService,
    ) { }

    async create(userId: number, dto: CreateTransferDto) {
        if (dto.fromAccountId === dto.toAccountId) {
            throw new ValidationFailedError('La cuenta de origen y destino no pueden ser la misma');
        }

        const fromAccount = await this.accountsService.findOwnedAccount(userId, dto.fromAccountId);
        await this.accountsService.findOwnedAccount(userId, dto.toAccountId);

        const amount = new Prisma.Decimal(dto.amount);
        if (fromAccount.currentBalance.lessThan(amount)) {
            throw new InsufficientBalanceError();
        }

        const [, , transfer] = await this.prisma.$transaction([
            this.prisma.account.update({
                where: { id: dto.fromAccountId },
                data: { currentBalance: { decrement: amount } },
            }),
            this.prisma.account.update({
                where: { id: dto.toAccountId },
                data: { currentBalance: { increment: amount } },
            }),
            this.prisma.transfer.create({
                data: {
                    fromAccountId: dto.fromAccountId,
                    toAccountId: dto.toAccountId,
                    amount,
                    description: dto.description,
                    date: new Date(),
                },
            }),
        ]);

        return transfer;
    }

    async findAllForUser(userId: number) {
        return this.prisma.transfer.findMany({
            where: {
                OR: [{ fromAccount: { userId } }, { toAccount: { userId } }],
            },
            orderBy: { date: 'desc' },
        });
    }

    async findOne(userId: number, id: number) {
        const transfer = await this.prisma.transfer.findUnique({
            where: { id },
            include: { fromAccount: true, toAccount: true },
        });
        if (!transfer || (transfer.fromAccount.userId !== userId && transfer.toAccount.userId !== userId)) {
            throw new TransferNotFoundError();
        }
        return transfer;
    }
}
