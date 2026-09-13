import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator"


export class CreateSavingsGoalDto {
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @MaxLength(300, { message: 'El nombre debe ser menor a 300 caracteres' })
    name!: string

    @IsNumber({}, { message: 'La cantidad objetiva debe ser un numero' })
    @Min(1, { message: 'La cantidad objetiva debe ser positivo' })
    targetAmount!: number

    @IsInt({ message: 'El id de la cuenta debe ser un numero' })
    @Min(1, { message: 'El id de la cuenta debe ser positivo' })
    accountId!: number
}
