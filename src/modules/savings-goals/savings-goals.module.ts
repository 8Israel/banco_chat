import { Module } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service.js';
import { SavingsGoalsController } from './savings-goals.controller.js';

@Module({
  controllers: [SavingsGoalsController],
  providers: [SavingsGoalsService],
})
export class SavingsGoalsModule {}
