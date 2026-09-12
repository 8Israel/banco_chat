import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CardsModule } from './modules/cards/cards.module.js';
import { SavingsGoalsModule } from './modules/savings-goals/savings-goals.module.js';

@Module({
  imports: [CardsModule, SavingsGoalsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
