export const ErrorCodes = {
  // ========== AUTENTICACIÓN (401) ==========
  AUTH: {
    UNAUTHORIZED: 'UNAUTHORIZED',
    ACCESS_TOKEN_MISSING: 'ACCESS_TOKEN_MISSING',
    INVALID_ACCESS_TOKEN: 'INVALID_ACCESS_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  },

  // ========== AUTORIZACIÓN (403) ==========
  FORBIDDEN: {
    FORBIDDEN: 'FORBIDDEN',
    ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  },

  // ========== VALIDACIÓN (400) ==========
  VALIDATION: {
    BAD_REQUEST: 'BAD_REQUEST',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  },

  // ========== NO ENCONTRADO (404) ==========
  NOT_FOUND: {
    NOT_FOUND: 'NOT_FOUND',
    ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
    TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
    TRANSFER_NOT_FOUND: 'TRANSFER_NOT_FOUND',
    CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
    BUDGET_NOT_FOUND: 'BUDGET_NOT_FOUND',
    SAVINGS_GOAL_NOT_FOUND: 'SAVINGS_GOAL_NOT_FOUND',
    ALERT_NOT_FOUND: 'ALERT_NOT_FOUND',
    SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
    MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  },

  // ========== CONFLICTOS (409) ==========
  CONFLICT: {
    CONFLICT: 'CONFLICT',
    RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  },

  // ========== SERVIDOR (500) ==========
  SERVER: {
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    LLM_ERROR: 'LLM_ERROR',
    MCP_TOOL_ERROR: 'MCP_TOOL_ERROR',
  },

  // ========== OTROS ==========
  RATE_LIMIT: {
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  },
} as const;

export type ErrorCode =
  | (typeof ErrorCodes.AUTH)[keyof typeof ErrorCodes.AUTH]
  | (typeof ErrorCodes.FORBIDDEN)[keyof typeof ErrorCodes.FORBIDDEN]
  | (typeof ErrorCodes.VALIDATION)[keyof typeof ErrorCodes.VALIDATION]
  | (typeof ErrorCodes.NOT_FOUND)[keyof typeof ErrorCodes.NOT_FOUND]
  | (typeof ErrorCodes.CONFLICT)[keyof typeof ErrorCodes.CONFLICT]
  | (typeof ErrorCodes.SERVER)[keyof typeof ErrorCodes.SERVER]
  | (typeof ErrorCodes.RATE_LIMIT)[keyof typeof ErrorCodes.RATE_LIMIT];

export type AuthErrorCode = (typeof ErrorCodes.AUTH)[keyof typeof ErrorCodes.AUTH];
export type ForbiddenErrorCode = (typeof ErrorCodes.FORBIDDEN)[keyof typeof ErrorCodes.FORBIDDEN];
export type ValidationErrorCode =
  (typeof ErrorCodes.VALIDATION)[keyof typeof ErrorCodes.VALIDATION];
export type NotFoundErrorCode = (typeof ErrorCodes.NOT_FOUND)[keyof typeof ErrorCodes.NOT_FOUND];
export type ConflictErrorCode = (typeof ErrorCodes.CONFLICT)[keyof typeof ErrorCodes.CONFLICT];
export type ServerErrorCode = (typeof ErrorCodes.SERVER)[keyof typeof ErrorCodes.SERVER];
export type RateLimitErrorCode = (typeof ErrorCodes.RATE_LIMIT)[keyof typeof ErrorCodes.RATE_LIMIT];
