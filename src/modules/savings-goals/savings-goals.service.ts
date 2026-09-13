import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto.js';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

@Injectable()
export class SavingsGoalsService {

  constructor(private readonly prisma: PrismaService) { }

  async create(req: CreateSavingsGoalDto) {

    const newGoal = await this.prisma.savingsGoal.create({
      data: {
        accountId: req.accountId,
        name: req.name,
        targetAmount:req.targetAmount,
        actualAmount:0
      }
    })
    return newGoal
  }

  async findAll() {
    return await this.prisma.savingsGoal.findMany();
  }

  async findOne(id: number) {
    const goal = await this.prisma.savingsGoal.findFirst({where: {id}});

    if (!goal) {
      throw new NotFoundException('Objetivo no existente');
    }
    
    return goal;
  }

  async update(id: number, userId:number, req: UpdateSavingsGoalDto) {
    const goal = await this.prisma.savingsGoal.findFirst({where: {id}});

    if (!goal) {
      throw new NotFoundException('Objetivo no existente');
    }
    const card = await this.prisma.account.findFirst({where: {id:goal.accountId, userId}})
    if (!card) {
      throw new NotFoundException('Objetivo no perteneciente al usuario');
    }

    const goalUpdate = await this.prisma.savingsGoal.update({
      where: { id },
      data: {
        name: req.name ?? goal.name,
        targetAmount:req.targetAmount ?? goal.targetAmount,
        actualAmount:req.actualAmount ?? goal.actualAmount
      }
    })
    return goalUpdate
  }

  async remove(id: number) {
    const goal = await this.prisma.savingsGoal.findFirst({where: {id}});

    if (!goal) {
      throw new NotFoundException('Objetivo no existente');
    }

    return await this.prisma.savingsGoal.delete({
      where: { id }
    })
  }
}
