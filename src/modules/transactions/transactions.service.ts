import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { QueryTransactionsDto } from './dto/query-transactions.dto.js';
import { TransactionType } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { CategoryNotFoundError, TransactionNotFoundError, ValidationFailedError } from '../../common/errors/app-errors.js';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly accountsService: AccountsService,
    ) { }

    async findAllForAccount(userId: number, accountId: number, query: QueryTransactionsDto) {
        await this.accountsService.findOwnedAccount(userId, accountId);

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        return this.prisma.bankTransaction.findMany({
            where: {
                accountId,
                ...(query.categoryId ? { categoryId: query.categoryId } : {}),
                ...(query.type ? { type: query.type } : {}),
                ...(query.from || query.to
                    ? {
                        date: {
                            ...(query.from ? { gte: new Date(query.from) } : {}),
                            ...(query.to ? { lte: new Date(query.to) } : {}),
                        },
                    }
                    : {}),
            },
            orderBy: { date: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    async findOne(userId: number, id: number) {
        const transaction = await this.prisma.bankTransaction.findUnique({
            where: { id },
            include: { account: true },
        });
        if (!transaction || transaction.account.userId !== userId) {
            throw new TransactionNotFoundError();
        }
        return transaction;
    }

    async create(userId: number, accountId: number, dto: CreateTransactionDto) {
        await this.accountsService.findOwnedAccount(userId, accountId);

        const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
        if (!category) {
            throw new CategoryNotFoundError();
        }

        const amount = new Prisma.Decimal(dto.amount);
        const balanceDelta = dto.type === TransactionType.INCOME ? amount : amount.negated();

        const [transaction] = await this.prisma.$transaction([
            this.prisma.bankTransaction.create({
                data: {
                    accountId,
                    categoryId: dto.categoryId,
                    type: dto.type,
                    amount,
                    description: dto.description,
                    date: dto.date ? new Date(dto.date) : new Date(),
                },
            }),
            this.prisma.account.update({
                where: { id: accountId },
                data: { currentBalance: { increment: balanceDelta } },
            }),
        ]);

        return transaction;
    }

    async getSpendingByCategory(userId: number, accountId: number, from?: string, to?: string) {
        await this.accountsService.findOwnedAccount(userId, accountId);

        const grouped = await this.prisma.bankTransaction.groupBy({
            by: ['categoryId'],
            where: {
                accountId,
                type: TransactionType.EXPENSE,
                ...(from || to
                    ? {
                        date: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(to) } : {}),
                        },
                    }
                    : {}),
            },
            _sum: { amount: true },
        });

        const categories = await this.prisma.category.findMany({
            where: { id: { in: grouped.map((g) => g.categoryId) } },
        });
        const categoryById = new Map(categories.map((c) => [c.id, c]));

        return grouped.map((g) => ({
            categoryId: g.categoryId,
            categoryName: categoryById.get(g.categoryId)?.name ?? 'Desconocida',
            total: (g._sum.amount ?? new Prisma.Decimal(0)).toNumber(),
        }));
    }

    async getMonthlySummary(userId: number, accountId: number, month: string) {
        await this.accountsService.findOwnedAccount(userId, accountId);

        if (!/^\d{4}-\d{2}$/.test(month)) {
            throw new ValidationFailedError('month debe tener el formato YYYY-MM');
        }

        const [year, monthIndex] = month.split('-').map(Number);
        const startPeriod = new Date(year, monthIndex - 1, 1);
        const endPeriod = new Date(year, monthIndex, 1);

        const [incomeSum, expenseSum] = await Promise.all([
            this.prisma.bankTransaction.aggregate({
                where: { accountId, type: TransactionType.INCOME, date: { gte: startPeriod, lt: endPeriod } },
                _sum: { amount: true },
            }),
            this.prisma.bankTransaction.aggregate({
                where: { accountId, type: TransactionType.EXPENSE, date: { gte: startPeriod, lt: endPeriod } },
                _sum: { amount: true },
            }),
        ]);

        const income = incomeSum._sum.amount ?? new Prisma.Decimal(0);
        const expenses = expenseSum._sum.amount ?? new Prisma.Decimal(0);

        return {
            month,
            income: income.toNumber(),
            expenses: expenses.toNumber(),
            savings: income.minus(expenses).toNumber(),
        };
    }
}
