// src/modules/bank-transaction/bank-transaction.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateBankTransactionDto } from "./dto/create-bank-transaction.dto.js";
import { UpdateBankTransactionDto } from "./dto/update-bank-transaction.dto.js";
import { FilterBankTransactionDto } from "./dto/filter-bank-transaction.dto.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";
import { Prisma } from "../../generated/prisma/client.js";

@Injectable()
export class BankTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBankTransactionDto: CreateBankTransactionDto, userId: number) {
    return "This action adds a new bankTransaction";
  }

  async findAllByAccount(accountId: number, filter: FilterBankTransactionDto, userId: number) {
    const {
      startDate,
      endDate,
      categoryId,
      type,
      page = 1,
      limit = 20,
    } = filter;

    const where: Prisma.BankTransactionWhereInput = {
      accountId,
      ...(type && { type }),
      ...(categoryId && { categoryId }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.bankTransaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bankTransaction.count({ where }),
    ]);

    const ownerAccount = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    }); 
    if (!ownerAccount) {
      throw new NotFoundException(`Cuenta no encontrada`);
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: number) {
    const bankTransaction = await this.prisma.bankTransaction.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!bankTransaction) {
      throw new NotFoundException(`Transacción bancaria no encontrada`);
    }
    return bankTransaction;
  }

}
