import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { AccountsService } from "./accounts.service.js";
import { CreateAccountDto } from "./dto/create-account.dto.js";
import { UpdateAccountDto } from "./dto/update-account.dto.js";
import { ResponseMessage } from "../../core/decorators/response-message.decorator.js";
import { Public } from "../../core/decorators/public.decorator.js";
import { CurrentUser, type AuthenticatedUser } from '../../core/decorators/current-user.decorator.js';

@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Cuenta registrada")
  @Post()
  async create(@Body() createAccountDto: CreateAccountDto, @CurrentUser() user: AuthenticatedUser) {
    return await this.accountsService.create(user.id, createAccountDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Cuentas encontradas")
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.findAll(user.id);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Cuenta encontrada")
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.findOne(user.id, +id);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Cuenta actualizada")
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateAccountDto: UpdateAccountDto, @CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.update(user.id, +id, updateAccountDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Cuenta eliminada")
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.remove(user.id, +id);
  }
}
