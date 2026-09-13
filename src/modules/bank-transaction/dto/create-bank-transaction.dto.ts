import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { TransactionType } from "../../../generated/prisma/client.js";

export class CreateBankTransactionDto {
  @IsInt({
    message: "El identificador de la cuenta debe ser un número entero",
  })
  @IsPositive({
    message: "El identificador de la cuenta debe ser un número positivo",
  })
  accountId: number;

  @IsInt({
    message: "El identificador de la categoría debe ser un número entero",
  })
  @IsPositive({
    message: "El identificador de la categoría debe ser un número positivo",
  })
  categoryId: number;

  @IsEnum(TransactionType, {
    message: "El tipo de transacción no es válido",
  })
  type: TransactionType;

  @IsNumber(
    {},
    {
      message: "El monto debe ser un número",
    },
  )
  @IsPositive({
    message: "El monto debe ser un número positivo",
  })
  amount: number;

  @IsDateString(
    {},
    {
      message: "La fecha debe tener un formato de fecha válido",
    },
  )
  date: string;

  @IsOptional()
  @IsString({
    message: "La descripción debe ser una cadena de texto",
  })
  description?: string;
}
