import { IsDateString, IsInt, IsNumber, IsPositive } from 'class-validator';

export class CreateBudgetDto {
    @IsInt({ message: 'categoryId debe ser un número entero' })
    categoryId!: number;

    @IsNumber({}, { message: 'limitAmount debe ser un número' })
    @IsPositive({ message: 'limitAmount debe ser positivo' })
    limitAmount!: number;

    @IsDateString({}, { message: 'startPeriod debe ser una fecha válida (ISO 8601)' })
    startPeriod!: string;

    @IsDateString({}, { message: 'endPeriod debe ser una fecha válida (ISO 8601)' })
    endPeriod!: string;
}
