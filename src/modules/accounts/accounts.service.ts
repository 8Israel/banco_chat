import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateAccountDto } from "./dto/create-account.dto.js";
import { UpdateAccountDto } from "./dto/update-account.dto.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";

@Injectable()
export class AccountsService {

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createCardDto: CreateAccountDto) {
    return await this.prisma.account.create({
      data: {
        typeAccount: createCardDto.typeAccount,
        alias: createCardDto.alias,
        last4Digits: createCardDto.last4Digits,
        isActive: createCardDto.isActive,
        userId: userId,
        currentBalance: 0,
      },
    });
  }

  async findAll(userId: number) {
    const cards = await this.prisma.account.findMany({
      where: {
        userId: userId,
      },
    });
    return cards;
  }

  async findOne(userId: number, id: number) {
    const card = await this.prisma.account.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });
    if (!card) {
      throw new NotFoundException(`Cuenta no existente`);
    }
    return card;
  }

  async update(userId: number, id: number, updateCardDto: UpdateAccountDto) {
    const existingCard = await this.prisma.account.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });
    if (!existingCard) {
      throw new NotFoundException(`Cuenta no existente`);
    }
    return await this.prisma.account.update({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        alias: updateCardDto.alias,
        isActive: updateCardDto.isActive,
      },
    });
  }

  remove(userId: number, id: number) {
    const account = this.prisma.account.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });
    if (!account) {
      throw new NotFoundException(`Cuenta no existente`);
    }
    return this.prisma.account.delete({
      where: {
        id: id,
      },
    });
  }
}
