import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service.js';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto.js';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto.js';
import { ContributeSavingsGoalDto } from './dto/contribute-savings-goal.dto.js';
import { CurrentUser, type AuthenticatedUser } from '../../core/decorators/current-user.decorator.js';
import { ResponseMessage } from '../../core/decorators/response-message.decorator.js';

@Controller()
export class SavingsGoalsController {
    constructor(private readonly savingsGoalsService: SavingsGoalsService) { }

    @Get('accounts/:accountId/savings-goals')
    @ResponseMessage('Metas de ahorro obtenidas')
    findAllForAccount(
        @CurrentUser() user: AuthenticatedUser,
        @Param('accountId', ParseIntPipe) accountId: number,
    ) {
        return this.savingsGoalsService.findAllForAccount(user.id, accountId);
    }

    @Post('accounts/:accountId/savings-goals')
    @ResponseMessage('Meta de ahorro creada')
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Param('accountId', ParseIntPipe) accountId: number,
        @Body() dto: CreateSavingsGoalDto,
    ) {
        return this.savingsGoalsService.create(user.id, accountId, dto);
    }

    @Patch('savings-goals/:id')
    @ResponseMessage('Meta de ahorro actualizada')
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSavingsGoalDto,
    ) {
        return this.savingsGoalsService.update(user.id, id, dto);
    }

    @Post('savings-goals/:id/contribute')
    @ResponseMessage('Aportación registrada')
    contribute(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ContributeSavingsGoalDto,
    ) {
        return this.savingsGoalsService.contribute(user.id, id, dto.amount);
    }
}
