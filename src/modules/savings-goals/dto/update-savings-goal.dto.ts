import { PartialType } from '@nestjs/mapped-types';
import { CreateSavingsGoalDto } from './create-savings-goal.dto.js';
import { IsNumber, Min } from 'class-validator';

export class UpdateSavingsGoalDto extends PartialType(CreateSavingsGoalDto) {
    @IsNumber({}, { message: 'La cantidad actual debe ser un numero' })
    @Min(1, { message: 'La cantidad actual debe ser positivo' })
    actualAmount!: number

}
