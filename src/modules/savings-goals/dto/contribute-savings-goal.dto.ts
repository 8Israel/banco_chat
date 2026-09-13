import { IsNumber, IsPositive } from 'class-validator';

export class ContributeSavingsGoalDto {
    @IsNumber({}, { message: 'amount debe ser un número' })
    @IsPositive({ message: 'amount debe ser positivo' })
    amount!: number;
}
