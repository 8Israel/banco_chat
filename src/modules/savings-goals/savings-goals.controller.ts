import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service.js';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto.js';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto.js';

@Controller('savings-goals')
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Post()
  create(@Body() createSavingsGoalDto: CreateSavingsGoalDto) {
    return this.savingsGoalsService.create(createSavingsGoalDto);
  }

  @Get()
  findAll() {
    return this.savingsGoalsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.savingsGoalsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSavingsGoalDto: UpdateSavingsGoalDto) {
    return this.savingsGoalsService.update(+id, updateSavingsGoalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.savingsGoalsService.remove(+id);
  }
}
