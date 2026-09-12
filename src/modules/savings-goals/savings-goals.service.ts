import { Injectable } from '@nestjs/common';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto.js';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto.js';

@Injectable()
export class SavingsGoalsService {
  create(createSavingsGoalDto: CreateSavingsGoalDto) {
    return 'This action adds a new savingsGoal';
  }

  findAll() {
    return `This action returns all savingsGoals`;
  }

  findOne(id: number) {
    return `This action returns a #${id} savingsGoal`;
  }

  update(id: number, updateSavingsGoalDto: UpdateSavingsGoalDto) {
    return `This action updates a #${id} savingsGoal`;
  }

  remove(id: number) {
    return `This action removes a #${id} savingsGoal`;
  }
}
