import { IsEnum } from "class-validator/types/decorator/typechecker/IsEnum.js";
import { AccountType } from "../../../generated/prisma/client.js";
import { IsString } from "class-validator/types/decorator/typechecker/IsString.js";
import { Length } from "class-validator/types/decorator/string/Length.js";

export class CreateAccountDto {
  @IsEnum(AccountType, {
    message:
      "El tipo de cuenta no es válido, debe ser uno de los siguientes: debit, credit, savings, cash",
  })
  typeAccount: AccountType;

  @IsString({ message: "El alias debe ser una cadena de texto" })
  @Length(2, 100, { message: "El alias debe tener entre 2 y 100 caracteres" })
  alias: string;

  @IsString({ message: "Los últimos 4 dígitos deben ser una cadena de texto" })
  @Length(4, 4, {
    message: "Los últimos 4 dígitos deben tener exactamente 4 caracteres",
  })
  last4Digits: string;

  @IsBoolean({ message: "El estado de la tarjeta debe ser un valor booleano" })
  isActive: boolean;
}
