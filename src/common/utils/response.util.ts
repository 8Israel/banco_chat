import type { ApiResponse, PaginatedResponse } from '../interfaces/api-response.interface.js';

export class ResponseUtil {
  static successResponse<T>(msg: string, data: T): ApiResponse<T> {
    return {
      success: true,
      msg,
      error_code: null,
      data,
    };
  }

  static errorResponse<T>(msg: string, error_code: string, data: T | null = null): ApiResponse<T> {
    return {
      success: false,
      msg,
      error_code,
      data,
    };
  }

  static paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    msg = 'Datos obtenidos',
  ): PaginatedResponse<T> {
    return {
      success: true,
      msg,
      error_code: null,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
