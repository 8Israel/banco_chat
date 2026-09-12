import { PartialType } from '@nestjs/mapped-types';
import { CreateSavingsGoalDto } from './create-savings-goal.dto.js';

export class UpdateSavingsGoalDto extends PartialType(CreateSavingsGoalDto) {}
