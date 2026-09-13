import { Injectable } from '@nestjs/common';
import { CreateTransferDto } from './dto/create-transfer.dto.js';
import { UpdateTransferDto } from './dto/update-transfer.dto.js';

@Injectable()
export class TransfersService {
  create(createTransferDto: CreateTransferDto) {
    return 'This action adds a new transfer';
  }

  findAll() {
    return `This action returns all transfers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transfer`;
  }

  update(id: number, updateTransferDto: UpdateTransferDto) {
    return `This action updates a #${id} transfer`;
  }

  remove(id: number) {
    return `This action removes a #${id} transfer`;
  }
}
