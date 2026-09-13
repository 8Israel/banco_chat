// src/modules/bank-transaction/bank-transaction.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { BankTransactionService } from "./bank-transaction.service.js";
import { CreateBankTransactionDto } from "./dto/create-bank-transaction.dto.js";
import { UpdateBankTransactionDto } from "./dto/update-bank-transaction.dto.js";
import { FilterBankTransactionDto } from "./dto/filter-bank-transaction.dto.js";
import { ResponseMessage } from "../../core/decorators/response-message.decorator.js";
import { Public } from "../../core/decorators/public.decorator.js";
import { CurrentUser } from "../../core/decorators/current-user.decorator.js";

@Controller("accounts")
export class BankTransactionController {
  constructor(
    private readonly bankTransactionService: BankTransactionService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Transacciones bancarias encontradas")
  @Post("bank-transaction")
  create(
    @Body() createBankTransactionDto: CreateBankTransactionDto,
    @CurrentUser("id") userId: number,
  ) {
    return this.bankTransactionService.create(createBankTransactionDto, userId);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Transacciones bancarias encontradas")
  @Get(":accountId/transactions")
  async findAll(
    @Param("accountId", ParseIntPipe) accountId: number,
    @Query() filter: FilterBankTransactionDto,
    @CurrentUser("id") userId: number,
  ) {
    return await this.bankTransactionService.findAllByAccount(
      accountId,
      filter,
      userId
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage("Transacción bancaria encontrada")
  @Get("bank-transaction/:id")
  async findOne(@Param("id") id: string, @CurrentUser("id") userId: number) {
    return await this.bankTransactionService.findOne(+id, userId);
  }
}
