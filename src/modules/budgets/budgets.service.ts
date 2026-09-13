import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { UpdateBudgetDto } from './dto/update-budget.dto.js';
import { TransactionType } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { BudgetNotFoundError, CategoryNotFoundError } from '../../common/errors/app-errors.js';

@Injectable()
export class BudgetsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly accountsService: AccountsService,
    ) { }

    async create(userId: number, accountId: number, dto: CreateBudgetDto) {
        await this.accountsService.findOwnedAccount(userId, accountId);

        const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
        if (!category) {
            throw new CategoryNotFoundError();
        }

        return this.prisma.budget.create({
            data: {
                accountId,
                categoryId: dto.categoryId,
                limitAmount: dto.limitAmount,
                startPeriod: new Date(dto.startPeriod),
                endPeriod: new Date(dto.endPeriod),
            },
        });
    }

    async findAllForAccount(userId: number, accountId: number) {
        await this.accountsService.findOwnedAccount(userId, accountId);
        return this.prisma.budget.findMany({
            where: { accountId },
            orderBy: { startPeriod: 'desc' },
        });
    }

    async findOwnedBudget(userId: number, budgetId: number) {
        const budget = await this.prisma.budget.findUnique({
            where: { id: budgetId },
            include: { account: true },
        });
        if (!budget || budget.account.userId !== userId) {
            throw new BudgetNotFoundError();
        }
        return budget;
    }

    async update(userId: number, budgetId: number, dto: UpdateBudgetDto) {
        await this.findOwnedBudget(userId, budgetId);
        return this.prisma.budget.update({
            where: { id: budgetId },
            data: {
                ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
                ...(dto.limitAmount !== undefined ? { limitAmount: dto.limitAmount } : {}),
                ...(dto.startPeriod !== undefined ? { startPeriod: new Date(dto.startPeriod) } : {}),
                ...(dto.endPeriod !== undefined ? { endPeriod: new Date(dto.endPeriod) } : {}),
            },
        });
    }

    async remove(userId: number, budgetId: number) {
        await this.findOwnedBudget(userId, budgetId);
        return this.prisma.budget.delete({ where: { id: budgetId } });
    }

    async getStatus(userId: number, budgetId: number) {
        const budget = await this.findOwnedBudget(userId, budgetId);

        const spentResult = await this.prisma.bankTransaction.aggregate({
            where: {
                accountId: budget.accountId,
                categoryId: budget.categoryId,
                type: TransactionType.EXPENSE,
                date: { gte: budget.startPeriod, lte: budget.endPeriod },
            },
            _sum: { amount: true },
        });

        const spent = spentResult._sum.amount ?? new Prisma.Decimal(0);
        const remaining = budget.limitAmount.minus(spent);
        const percentage = budget.limitAmount.isZero()
            ? 0
            : spent.dividedBy(budget.limitAmount).times(100).toNumber();

        return {
            limitAmount: budget.limitAmount.toNumber(),
            spent: spent.toNumber(),
            remaining: remaining.toNumber(),
            percentage,
        };
    }
}
