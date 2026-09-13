import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountType } from '../../../generated/prisma/enums.js';

export class CreateAccountDto {
    @IsEnum(AccountType, { message: 'typeAccount debe ser DEBIT, CREDIT, CASH o SAVINGS' })
    typeAccount!: AccountType;

    @IsOptional()
    @IsString({ message: 'alias debe ser una cadena de texto' })
    @MaxLength(100, { message: 'alias debe ser menor a 100 caracteres' })
    alias?: string;

    @IsOptional()
    @IsString({ message: 'last4Digits debe ser una cadena de texto' })
    @MaxLength(4, { message: 'last4Digits debe tener máximo 4 caracteres' })
    last4Digits?: string;

    // Puede ser negativo en cuentas CREDIT (deuda inicial), por eso no se
    // restringe a positivo acá; se valida caso por caso si hace falta.
    @IsOptional()
    @IsNumber({}, { message: 'currentBalance debe ser un número' })
    currentBalance?: number;
}
