import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';
import { CurrentUser, type AuthenticatedUser } from '../../core/decorators/current-user.decorator.js';
import { ResponseMessage } from '../../core/decorators/response-message.decorator.js';

@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Post()
    @ResponseMessage('Cuenta creada')
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAccountDto) {
        return this.accountsService.create(user.id, dto);
    }

    @Get()
    @ResponseMessage('Cuentas obtenidas')
    findAll(@CurrentUser() user: AuthenticatedUser) {
        return this.accountsService.findAllForUser(user.id);
    }

    @Get(':id')
    @ResponseMessage('Cuenta obtenida')
    findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.accountsService.findOwnedAccount(user.id, id);
    }

    @Patch(':id')
    @ResponseMessage('Cuenta actualizada')
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateAccountDto,
    ) {
        return this.accountsService.update(user.id, id, dto);
    }
}
