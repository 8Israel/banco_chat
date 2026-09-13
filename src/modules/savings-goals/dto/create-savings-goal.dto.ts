import { IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateSavingsGoalDto {
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @MaxLength(300, { message: 'El nombre debe ser menor a 300 caracteres' })
    name!: string;

    @IsNumber({}, { message: 'targetAmount debe ser un número' })
    @IsPositive({ message: 'targetAmount debe ser positivo' })
    targetAmount!: number;
}
