import { SetMetadata } from "@nestjs/common";


export const IS_PUBLIC_KEY = 'isPublic';
/**
 * Marca un endpoint como público, sin necesidad de JWT.
 * Uso: @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);