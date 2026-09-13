import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { QueryTransactionsDto } from './dto/query-transactions.dto.js';
import { CurrentUser, type AuthenticatedUser } from '../../core/decorators/current-user.decorator.js';
import { ResponseMessage } from '../../core/decorators/response-message.decorator.js';

@Controller()
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Get('accounts/:accountId/transactions')
    @ResponseMessage('Transacciones obtenidas')
    findAllForAccount(
        @CurrentUser() user: AuthenticatedUser,
        @Param('accountId', ParseIntPipe) accountId: number,
        @Query() query: QueryTransactionsDto,
    ) {
        return this.transactionsService.findAllForAccount(user.id, accountId, query);
    }

    @Post('accounts/:accountId/transactions')
    @ResponseMessage('Transacción registrada')
    create(
        @CurrentUser() user: AuthenticatedUser,
        @Param('accountId', ParseIntPipe) accountId: number,
        @Body() dto: CreateTransactionDto,
    ) {
        return this.transactionsService.create(user.id, accountId, dto);
    }

    @Get('accounts/:accountId/transactions/summary')
    @ResponseMessage('Resumen mensual obtenido')
    getMonthlySummary(
        @CurrentUser() user: AuthenticatedUser,
        @Param('accountId', ParseIntPipe) accountId: number,
        @Query('month') month: string,
    ) {
        return this.transactionsService.getMonthlySummary(user.id, accountId, month);
    }

    @Get('accounts/:accountId/transactions/spending-by-category')
    @ResponseMessage('Gasto por categoría obtenido')
    getSpendingByCategory(
        @CurrentUser() user: AuthenticatedUser,
        @Param('accountId', ParseIntPipe) accountId: number,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.transactionsService.getSpendingByCategory(user.id, accountId, from, to);
    }

    @Get('transactions/:id')
    @ResponseMessage('Transacción obtenida')
    findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.transactionsService.findOne(user.id, id);
    }
}
