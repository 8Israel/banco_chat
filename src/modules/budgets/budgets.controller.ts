import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { BudgetsService } from './budgets.service.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { UpdateBudgetDto } from './dto/update-budget.dto.js';
import { CurrentUser, type AuthenticatedUser } from '../../core/decorators/current-user.decorator.js';
import { ResponseMessage } from '../../core/decorators/response-message.decorator.js';

@Controller()
export class BudgetsController {
    constructor(private readonly budgetsService: BudgetsService) { }

    @Get('accounts/:accountId/budgets')
    @ResponseMessage('Presupuestos obtenidos')
    findAllForAccount(
        @CurrentUser() user: AuthenticatedUser,
        @Param('accountId', ParseIntPipe) accountId: number,
    ) {
        return this.budgetsService.findAllForAccount(user.id, accountId);
    }

    @Post('accounts/:accountId/budgets')
    @ResponseMessage('Presupuesto creado')
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Param('accountId', ParseIntPipe) accountId: number,
        @Body() dto: CreateBudgetDto,
    ) {
        return this.budgetsService.create(user.id, accountId, dto);
    }

    @Patch('budgets/:id')
    @ResponseMessage('Presupuesto actualizado')
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBudgetDto,
    ) {
        return this.budgetsService.update(user.id, id, dto);
    }

    @Delete('budgets/:id')
    @ResponseMessage('Presupuesto eliminado')
    remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
        return this.budgetsService.remove(user.id, id);
    }

    @Get('budgets/:id/status')
    @ResponseMessage('Estado del presupuesto obtenido')
    getStatus(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
        return this.budgetsService.getStatus(user.id, id);
    }
}
