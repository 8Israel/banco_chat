import { IsDateString, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateTransferDto {
    @IsInt({ message: 'El id de la cuenta remitente debe ser un numero' })
    @IsPositive( { message: 'El id de la cuenta remitente debe ser positivo' })
    fromAccountId!: number

    @IsInt({ message: 'El id de la cuenta destinario debe ser un numero' })
    @IsPositive( { message: 'El id de la cuenta destinario debe ser positivo' })
    toAccountId!: number

    @IsNumber({}, { message: 'La cantidad debe ser un numero' })
    @IsPositive( { message: 'La cantidad debe ser positivo' })
    amount!: number

    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @IsOptional()
    @MaxLength(100, { message: 'La descripción debe ser máximo 100 caracteres' })
    description?: string

}
