import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';
import { AccountNotFoundError } from '../../common/errors/app-errors.js';

@Injectable()
export class AccountsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: number, dto: CreateAccountDto) {
        return this.prisma.account.create({
            data: {
                userId,
                typeAccount: dto.typeAccount,
                alias: dto.alias,
                last4Digits: dto.last4Digits,
                currentBalance: dto.currentBalance ?? 0,
            },
        });
    }

    async findAllForUser(userId: number) {
        return this.prisma.account.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    // Punto de entrada de ownership que reutilizan transactions/transfers/budgets/savings-goals:
    // si la cuenta no existe o es de otro usuario, se lanza NotFoundError (nunca ForbiddenError)
    // para no confirmarle a nadie que el recurso existe pero no es suyo.
    async findOwnedAccount(userId: number, accountId: number) {
        const account = await this.prisma.account.findUnique({ where: { id: accountId } });
        if (!account || account.userId !== userId) {
            throw new AccountNotFoundError();
        }
        return account;
    }

    async update(userId: number, accountId: number, dto: UpdateAccountDto) {
        await this.findOwnedAccount(userId, accountId);
        return this.prisma.account.update({
            where: { id: accountId },
            data: dto,
        });
    }
}
