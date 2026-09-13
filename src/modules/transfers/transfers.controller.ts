import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { TransfersService } from './transfers.service.js';
import { CreateTransferDto } from './dto/create-transfer.dto.js';
import { CurrentUser, type AuthenticatedUser } from '../../core/decorators/current-user.decorator.js';
import { ResponseMessage } from '../../core/decorators/response-message.decorator.js';

@Controller('transfers')
export class TransfersController {
    constructor(private readonly transfersService: TransfersService) { }

    @Post()
    @ResponseMessage('Transferencia realizada')
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTransferDto) {
        return this.transfersService.create(user.id, dto);
    }

    @Get()
    @ResponseMessage('Transferencias obtenidas')
    findAll(@CurrentUser() user: AuthenticatedUser) {
        return this.transfersService.findAllForUser(user.id);
    }

    @Get(':id')
    @ResponseMessage('Transferencia obtenida')
    findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.transfersService.findOne(user.id, id);
    }
}
