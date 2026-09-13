import { Module } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service.js';
import { SavingsGoalsController } from './savings-goals.controller.js';
import { AccountsModule } from '../accounts/accounts.module.js';

@Module({
    imports: [AccountsModule],
    controllers: [SavingsGoalsController],
    providers: [SavingsGoalsService],
    exports: [SavingsGoalsService],
})
export class SavingsGoalsModule { }
