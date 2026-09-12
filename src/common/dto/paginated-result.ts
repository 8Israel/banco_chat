export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Envuelve una lista + su metadata de paginación. El TransformResponseInterceptor
 * reconoce esta forma (items + pagination) y arma el bloque "pagination" a nivel
 * raíz de la respuesta, dejando "data" solo con los items.
 *
 * Uso típico en un service:
 *   const [items, total] = await Promise.all([...]);
 *   return PaginatedResult.of(items, { page, limit, total });
 */
export class PaginatedResult<T> {
    items!: T[];
    pagination!: PaginationMeta;
    static of<T>(
        items: T[],
        params: { page: number; limit: number; total: number },
    ): PaginatedResult<T> {
        const result = new PaginatedResult<T>();
        result.items = items;
        result.pagination = {
            page: params.page,
            limit: params.limit,
            total: params.total,
            totalPages: Math.max(1, Math.ceil(params.total / params.limit)),
        };
        return result;
    }
}
