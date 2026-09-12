import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'responseMessage';

/**
 * Define el "msg" que va en la respuesta exitosa de este endpoint.
 * Si no se usa, el interceptor pone un mensaje genérico según el método HTTP.
 *
 * Uso: @ResponseMessage('Usuario creado correctamente')
 */
export const ResponseMessage = (message: string) =>
    SetMetadata(RESPONSE_MESSAGE_KEY, message);
