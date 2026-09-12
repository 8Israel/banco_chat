export interface ApiResponse<T> {
  success: boolean;
  msg: string;
  error_code: string | null;
  data: T | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  msg: string;
  error_code: string | null;
  data: T[];
  pagination: PaginationMeta;
}
