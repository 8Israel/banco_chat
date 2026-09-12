import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * Loguea cada request que pasa por la API. Los errores NO se logean aquí
 * (eso lo hace HttpExceptionFilter, que además sabe distinguir 4xx de 5xx);
 * este interceptor solo reporta las respuestas exitosas y cuánto tardaron.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest();
        const { method, originalUrl, ip } = request;
        const start = Date.now();

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const ms = Date.now() - start;
                this.logger.log(
                    `${method} ${originalUrl} ${response.statusCode} — ${ms}ms — ${ip}`,
                );
            }),
        );
    }
}
