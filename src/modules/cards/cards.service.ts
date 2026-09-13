import { Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto.js';
import { UpdateCardDto } from './dto/update-card.dto.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

@Injectable()
export class CardsService {

  constructor(private readonly prisma: PrismaService) {}

  async create(createCardDto: CreateCardDto, userId: number) {
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

  async findOne(id: number) {
    return await this.prisma.account.findUnique({
      where: {
        id: id,
      },
    });
  }

  async update(id: number, updateCardDto: UpdateCardDto) {
    const existingCard = await this.prisma.account.findUnique({
      where: {
        id: id,
      },
    });
    if (!existingCard) {
      throw new Error(`Card with ID ${id} not found`);
    }
    return await this.prisma.account.update({
      where: {
        id: id,
      },
      data: {
        typeAccount: updateCardDto.typeAccount,
        alias: updateCardDto.alias,
        last4Digits: updateCardDto.last4Digits,
        isActive: updateCardDto.isActive,
      },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} card`;
  }
}
