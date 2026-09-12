import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator.js';
import { PaginatedResult } from '../../common/dto/paginated-result.js';

export interface StandardResponse<T> {
    success: true;
    msg: string;
    errorCode: null;
    data: T;
    pagination?: PaginatedResult<unknown>['pagination'];
}

const DEFAULT_MESSAGE_BY_METHOD: Record<string, string> = {
    GET: 'Consulta exitosa',
    POST: 'Creado exitosamente',
    PUT: 'Actualizado exitosamente',
    PATCH: 'Actualizado exitosamente',
    DELETE: 'Eliminado exitosamente',
};

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
    T,
    StandardResponse<T>
> {
    constructor(private readonly reflector: Reflector) { }

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<StandardResponse<T>> {
        const request = context.switchToHttp().getRequest();

        const customMessage = this.reflector.getAllAndOverride<string>(
            RESPONSE_MESSAGE_KEY,
            [context.getHandler(), context.getClass()],
        );

        return next.handle().pipe(
            map((result) => {
                const msg =
                    customMessage ??
                    DEFAULT_MESSAGE_BY_METHOD[request.method] ??
                    'Operación exitosa';

                if (result instanceof PaginatedResult) {
                    return {
                        success: true,
                        msg,
                        errorCode: null,
                        data: result.items as unknown as T,
                        pagination: result.pagination,
                    };
                }

                return {
                    success: true,
                    msg,
                    errorCode: null,
                    data: (result ?? {}) as T,
                };
            }),
        );
    }
}
