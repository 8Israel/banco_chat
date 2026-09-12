import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
    ErrorCodes,
    type ErrorCode,
} from '../../common/errors/error-codes.constat.js';

interface ValidationErrorBody {
    message?: string | string[];
    errors?: Array<{ field: string; messages: string[] }>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionsHandler');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Excepciones "de negocio" (jerarquía AppError: UnauthorizedError, NotFoundError, etc.)
        if (exception instanceof AppError) {
            const status = exception.getStatus();
            this.logHttpError(request, status, exception.message, exception);

            response.status(status).json({
                success: false,
                msg: exception.message,
                errorCode: exception.errorCode,
                data: exception.data ?? {},
            });
            return;
        }

        // Excepciones estándar de Nest (guards, ValidationPipe, NotFoundException, etc.)
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            const isObjectBody = typeof body === 'object' && body !== null;
            const parsed = isObjectBody ? (body as ValidationErrorBody) : undefined;

            const isValidationError =
                status === HttpStatus.BAD_REQUEST && !!parsed?.errors;

            const rawMessage =
                parsed?.message ??
                (isObjectBody ? undefined : body) ??
                exception.message;
            const msg = Array.isArray(rawMessage)
                ? rawMessage.join(', ')
                : (rawMessage as string);

            const detailOverride = isValidationError
                ? this.formatValidationErrors(parsed!.errors!)
                : undefined;
            this.logHttpError(request, status, msg, exception, detailOverride);

            response.status(status).json({
                success: false,
                msg,
                errorCode: isValidationError
                    ? ErrorCodes.VALIDATION.VALIDATION_ERROR
                    : this.mapStatusToErrorCode(status),
                data: isValidationError ? { errors: parsed!.errors } : {},
            });
            return;
        }

        // Errores conocidos de librerías externas (Prisma, jsonwebtoken, etc.)
        const mapped = this.mapKnownLibraryError(exception);
        if (mapped) {
            this.logHttpError(request, mapped.status, mapped.msg, exception);
            response.status(mapped.status).json({
                success: false,
                msg: mapped.msg,
                errorCode: mapped.errorCode,
                data: {},
            });
            return;
        }

        // Cualquier otra cosa: error no controlado. No se expone el detalle interno al cliente.
        this.logger.error(
            `${request.method} ${request.originalUrl} → 500 (error no controlado)`,
            exception instanceof Error ? exception.stack : String(exception),
        );

        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
            errorCode: ErrorCodes.SERVER.INTERNAL_SERVER_ERROR,
            data: {},
        });
    }

    /**
     * Loguea con warn (4xx) o error (5xx) incluyendo método y ruta para poder
     * rastrear el request, y SIEMPRE imprime el detalle completo del error
     * original (stack, y para Prisma también code/meta) debajo — el mensaje
     * corto de la primera línea es el que se sanitiza para el cliente, pero
     * en consola siempre se quiere ver la causa real, sea 4xx o 5xx.
     */
    private logHttpError(
        request: Request,
        status: number,
        msg: string,
        error?: unknown,
        detailOverride?: string,
    ) {
        const line = `${request.method} ${request.originalUrl} → ${status} — ${msg}`;
        const detail = detailOverride ?? this.formatErrorDetail(error);
        const log = status >= 500 ? this.logger.error.bind(this.logger) : this.logger.warn.bind(this.logger);

        log(line);
        if (detail) {
            log(detail);
        }
    }

    /** Imprime cada error de validación campo por campo, para verlos completos en consola sin tener que ir a la respuesta HTTP. */
    private formatValidationErrors(errors: Array<{ field: string; messages: string[] }>): string {
        return errors.map((e) => `  - ${e.field}: ${e.messages.join(', ')}`).join('\n');
    }

    /** Arma el bloque de detalle completo a imprimir: para errores de Prisma incluye code/meta/message; para cualquier otro Error, su stack; siempre agrega la causa original si existe. */
    private formatErrorDetail(error: unknown): string | undefined {
        if (error === undefined) return undefined;

        const parts: string[] = [];

        if (this.isPrismaKnownRequestError(error)) {
            parts.push(
                `Prisma ${error.code}: ${error.message}${error.meta ? ` — meta: ${JSON.stringify(error.meta)}` : ''}`,
            );
        } else if (error instanceof Error) {
            parts.push(error.stack ?? error.message);
        } else {
            parts.push(String(error));
        }

        const cause = error instanceof Error ? this.formatCause(error.cause) : undefined;
        if (cause) {
            parts.push(`Causa original: ${cause}`);
        }

        return parts.join('\n');
    }

    private isPrismaKnownRequestError(
        error: unknown,
    ): error is Error & { code: string; meta?: unknown } {
        return error instanceof Error && error.name === 'PrismaClientKnownRequestError';
    }

    /** Serializa la causa original de un error (p. ej. el error crudo de Supabase/Prisma/sharp) para poder verla en logs. */
    private formatCause(cause: unknown): string | undefined {
        if (cause === undefined) return undefined;
        if (cause instanceof Error) return cause.stack ?? cause.message;
        try {
            return JSON.stringify(cause);
        } catch {
            return String(cause);
        }
    }

    /**
     * Traduce errores típicos que no son HttpException (Prisma, JWT) a la
     * respuesta estándar, en vez de dejarlos caer como 500 genérico.
     */
    private mapKnownLibraryError(
        exception: unknown,
    ): { status: number; msg: string; errorCode: ErrorCode } | null {
        if (!(exception instanceof Error)) return null;

        if (exception.name === 'PrismaClientKnownRequestError') {
            return {
                status: HttpStatus.BAD_REQUEST,
                msg: 'Error en la base de datos',
                errorCode: ErrorCodes.SERVER.DATABASE_ERROR,
            };
        }

        if (exception.name === 'JsonWebTokenError') {
            return {
                status: HttpStatus.UNAUTHORIZED,
                msg: 'Token inválido',
                errorCode: ErrorCodes.AUTH.INVALID_ACCESS_TOKEN,
            };
        }

        if (exception.name === 'TokenExpiredError') {
            return {
                status: HttpStatus.UNAUTHORIZED,
                msg: 'Token expirado',
                errorCode: ErrorCodes.AUTH.TOKEN_EXPIRED,
            };
        }

        return null;
    }

    private mapStatusToErrorCode(status: number): ErrorCode {
        switch (status) {
            case HttpStatus.UNAUTHORIZED:
                return ErrorCodes.AUTH.UNAUTHORIZED;
            case HttpStatus.FORBIDDEN:
                return ErrorCodes.FORBIDDEN.FORBIDDEN;
            case HttpStatus.NOT_FOUND:
                return ErrorCodes.NOT_FOUND.NOT_FOUND;
            case HttpStatus.CONFLICT:
                return ErrorCodes.CONFLICT.CONFLICT;
            case HttpStatus.BAD_REQUEST:
                return ErrorCodes.VALIDATION.VALIDATION_ERROR;
            case HttpStatus.TOO_MANY_REQUESTS:
                return ErrorCodes.RATE_LIMIT.TOO_MANY_REQUESTS;
            default:
                return ErrorCodes.SERVER.INTERNAL_SERVER_ERROR;
        }
    }
}
