import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto.js';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto.js';
import { Prisma } from '../../generated/prisma/client.js';
import { SavingsGoalNotFoundError } from '../../common/errors/app-errors.js';

@Injectable()
export class SavingsGoalsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly accountsService: AccountsService,
    ) { }

    async create(userId: number, accountId: number, dto: CreateSavingsGoalDto) {
        await this.accountsService.findOwnedAccount(userId, accountId);
        return this.prisma.savingsGoal.create({
            data: {
                accountId,
                name: dto.name,
                targetAmount: dto.targetAmount,
            },
        });
    }

    async findAllForAccount(userId: number, accountId: number) {
        await this.accountsService.findOwnedAccount(userId, accountId);
        return this.prisma.savingsGoal.findMany({
            where: { accountId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOwnedGoal(userId: number, goalId: number) {
        const goal = await this.prisma.savingsGoal.findUnique({
            where: { id: goalId },
            include: { account: true },
        });
        if (!goal || goal.account.userId !== userId) {
            throw new SavingsGoalNotFoundError();
        }
        return goal;
    }

    async update(userId: number, goalId: number, dto: UpdateSavingsGoalDto) {
        await this.findOwnedGoal(userId, goalId);
        return this.prisma.savingsGoal.update({
            where: { id: goalId },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.targetAmount !== undefined ? { targetAmount: dto.targetAmount } : {}),
            },
        });
    }

    async contribute(userId: number, goalId: number, amount: number) {
        const goal = await this.findOwnedGoal(userId, goalId);
        return this.prisma.savingsGoal.update({
            where: { id: goalId },
            data: { actualAmount: goal.actualAmount.plus(new Prisma.Decimal(amount)) },
        });
    }
}
