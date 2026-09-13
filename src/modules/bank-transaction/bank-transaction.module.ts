import { Module } from '@nestjs/common';
import { BankTransactionService } from './bank-transaction.service.js';
import { BankTransactionController } from './bank-transaction.controller.js';

@Module({
  controllers: [BankTransactionController],
  providers: [BankTransactionService],
})
export class BankTransactionModule {}
