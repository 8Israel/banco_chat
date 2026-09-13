// src/modules/bank-transaction/dto/filter-bank-transaction.dto.ts

import { Type } from 'class-transformer';

import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

import { TransactionType } from '../../../generated/prisma/client.js';

export class FilterBankTransactionDto {
  @IsOptional()
  @IsDateString({}, {
    message: 'La fecha de inicio debe tener un formato de fecha válido.',
  })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, {
    message: 'La fecha de fin debe tener un formato de fecha válido.',
  })
  endDate?: string;

  @IsOptional()
  @IsInt({
    message: 'El identificador de la categoría debe ser un número entero.',
  })
  @IsPositive({
    message: 'El identificador de la categoría debe ser un número positivo.',
  })
  categoryId?: number;

  @IsOptional()
  @IsEnum(TransactionType, {
    message: 'El tipo de transacción no es válido.',
  })
  type?: TransactionType;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'El número de página debe ser un número entero.',
  })
  @IsPositive({
    message: 'El número de página debe ser un número positivo.',
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'El límite debe ser un número entero.',
  })
  @IsPositive({
    message: 'El límite debe ser un número positivo.',
  })
  @Min(1, {
    message: 'El límite debe ser como mínimo 1.',
  })
  limit?: number = 20;
}