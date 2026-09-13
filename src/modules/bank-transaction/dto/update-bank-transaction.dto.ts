import { PartialType } from '@nestjs/mapped-types';
import { CreateBankTransactionDto } from './create-bank-transaction.dto.js';

export class UpdateBankTransactionDto extends PartialType(CreateBankTransactionDto) {}
