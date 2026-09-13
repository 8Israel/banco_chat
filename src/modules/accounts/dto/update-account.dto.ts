import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAccountDto {
    @IsOptional()
    @IsString({ message: 'El alias debe ser una cadena de texto' })
    @MaxLength(100, { message: 'El alias debe ser menor a 100 caracteres' })
    alias?: string;

    @IsOptional()
    @IsBoolean({ message: 'isActive debe ser un valor booleano' })
    isActive?: boolean;
}
