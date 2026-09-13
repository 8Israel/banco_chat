import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { TransactionType } from '../../../generated/prisma/enums.js';

export class CreateTransactionDto {
    @IsInt({ message: 'categoryId debe ser un número entero' })
    categoryId!: number;

    @IsEnum(TransactionType, { message: 'type debe ser INCOME o EXPENSE' })
    type!: TransactionType;

    @IsNumber({}, { message: 'amount debe ser un número' })
    @IsPositive({ message: 'amount debe ser positivo' })
    amount!: number;

    @IsOptional()
    @IsString({ message: 'description debe ser una cadena de texto' })
    @MaxLength(300, { message: 'description debe ser menor a 300 caracteres' })
    description?: string;

    @IsOptional()
    @IsDateString({}, { message: 'date debe ser una fecha válida (ISO 8601)' })
    date?: string;
}
