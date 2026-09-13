import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, Min } from 'class-validator';
import { TransactionType } from '../../../generated/prisma/enums.js';

export class QueryTransactionsDto {
    @IsOptional()
    @IsDateString({}, { message: 'from debe ser una fecha válida (ISO 8601)' })
    from?: string;

    @IsOptional()
    @IsDateString({}, { message: 'to debe ser una fecha válida (ISO 8601)' })
    to?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'categoryId debe ser un número entero' })
    categoryId?: number;

    @IsOptional()
    @IsEnum(TransactionType, { message: 'type debe ser INCOME o EXPENSE' })
    type?: TransactionType;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'page debe ser un número entero' })
    @Min(1, { message: 'page debe ser mayor o igual a 1' })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'limit debe ser un número entero' })
    @IsPositive({ message: 'limit debe ser positivo' })
    limit?: number = 20;
}
