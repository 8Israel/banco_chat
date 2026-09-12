import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CardsModule } from './modules/cards/cards.module.js';

@Module({
  imports: [CardsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
