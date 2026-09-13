import { PartialType } from '@nestjs/mapped-types';
import { CreateTransferDto } from './create-transfer.dto.js';

export class UpdateTransferDto extends PartialType(CreateTransferDto) {}
