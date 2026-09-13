import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateTransferDto {
    @IsInt({ message: 'fromAccountId debe ser un número entero' })
    fromAccountId!: number;

    @IsInt({ message: 'toAccountId debe ser un número entero' })
    toAccountId!: number;

    @IsNumber({}, { message: 'amount debe ser un número' })
    @IsPositive({ message: 'amount debe ser positivo' })
    amount!: number;

    @IsOptional()
    @IsString({ message: 'description debe ser una cadena de texto' })
    @MaxLength(300, { message: 'description debe ser menor a 300 caracteres' })
    description?: string;
}
