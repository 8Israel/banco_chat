import { HttpException } from '@nestjs/common';
import type { ErrorCode } from './error-codes.constat.js';

/**
 * Clase base de errores "de negocio". Hereda de HttpException para que
 * Nest la trate como cualquier otra excepción HTTP (guards, filters, etc.),
 * pero agrega errorCode + data, que es lo que HttpExceptionFilter usa para
 * armar la respuesta estándar { success, msg, errorCode, data }.
 */
export class AppError extends HttpException {
    public readonly isOperational: boolean = true;
    public readonly errorCode: ErrorCode;
    public readonly data: unknown;

    constructor(
        message: string,
        statusCode: number,
        errorCode: ErrorCode,
        data: unknown = null,
    ) {
        super({ message, errorCode, data }, statusCode);
        this.errorCode = errorCode;
        this.data = data;
        this.name = this.constructor.name;
    }
}
