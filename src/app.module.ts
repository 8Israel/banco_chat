import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { TransfersModule } from './modules/transfers/transfers.module.js';
import { BudgetsModule } from './modules/budgets/budgets.module.js';
import { SavingsGoalsModule } from './modules/savings-goals/savings-goals.module.js';
import { PrismaModule } from './infrastructure/prisma/prisma.module.js';
import configuration from './config/configuration.js';
import { validateEnv } from './config/env.validation.js';
import { HttpExceptionFilter } from './core/filters/http-exception.filter.js';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor.js';
import { TransformResponseInterceptor } from './core/interceptors/transform-response.interceptor.js';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    ChatModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    TransfersModule,
    BudgetsModule,
    SavingsGoalsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
  ],
})
export class AppModule {}
