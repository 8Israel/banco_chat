import {
  ErrorCodes,
  AuthErrorCode,
  ForbiddenErrorCode,
  ValidationErrorCode,
  NotFoundErrorCode,
  ConflictErrorCode,
  ServerErrorCode,
  RateLimitErrorCode,
} from './error-codes.constat.js';
import { AppError } from './app-error.js';

// ========== AUTENTICACIÓN (401) ==========

export class UnauthorizedError extends AppError {
  constructor(
    message: string = 'No autorizado',
    errorCode: AuthErrorCode = ErrorCodes.AUTH.UNAUTHORIZED,
    data?: unknown,
  ) {
    super(message, 401, errorCode, data);
  }
}

export class TokenMissingError extends UnauthorizedError {
  constructor(message: string = 'Token de acceso no proporcionado') {
    super(message, ErrorCodes.AUTH.ACCESS_TOKEN_MISSING);
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor(message: string = 'Token inválido') {
    super(message, ErrorCodes.AUTH.INVALID_ACCESS_TOKEN);
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor(message: string = 'Token expirado') {
    super(message, ErrorCodes.AUTH.TOKEN_EXPIRED);
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message: string = 'Usuario o contraseña incorrectos') {
    super(message, ErrorCodes.AUTH.INVALID_CREDENTIALS);
  }
}

// ========== AUTORIZACIÓN (403) ==========

export class ForbiddenError extends AppError {
  constructor(
    message: string = 'Acceso denegado',
    errorCode: ForbiddenErrorCode = ErrorCodes.FORBIDDEN.FORBIDDEN,
    data?: unknown,
  ) {
    super(message, 403, errorCode, data);
  }
}

export class AccountInactiveError extends ForbiddenError {
  constructor(message: string = 'Tu cuenta no está activa') {
    super(message, ErrorCodes.FORBIDDEN.ACCOUNT_INACTIVE);
  }
}

// ========== VALIDACIÓN (400) ==========

export class BadRequestError extends AppError {
  constructor(
    message: string = 'Solicitud inválida',
    errorCode: ValidationErrorCode = ErrorCodes.VALIDATION.BAD_REQUEST,
    data?: unknown,
  ) {
    super(message, 400, errorCode, data);
  }
}

export class ValidationFailedError extends BadRequestError {
  constructor(message: string = 'Error de validación', data?: unknown) {
    super(message, ErrorCodes.VALIDATION.VALIDATION_ERROR, data);
  }
}

export class InsufficientBalanceError extends BadRequestError {
  constructor(message: string = 'Saldo insuficiente para realizar esta operación') {
    super(message, ErrorCodes.VALIDATION.INSUFFICIENT_BALANCE);
  }
}

// ========== NO ENCONTRADO (404) ==========

export class NotFoundError extends AppError {
  constructor(
    message: string = 'Recurso no encontrado',
    errorCode: NotFoundErrorCode = ErrorCodes.NOT_FOUND.NOT_FOUND,
    data?: unknown,
  ) {
    super(message, 404, errorCode, data);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(message: string = 'Usuario no encontrado') {
    super(message, ErrorCodes.NOT_FOUND.USER_NOT_FOUND);
  }
}

export class ResourceNotFoundError extends NotFoundError {
  constructor(resourceName: string) {
    super(`${resourceName} no encontrado`, ErrorCodes.NOT_FOUND.RESOURCE_NOT_FOUND);
  }
}

export class AccountNotFoundError extends NotFoundError {
  constructor(message: string = 'Cuenta no encontrada') {
    super(message, ErrorCodes.NOT_FOUND.ACCOUNT_NOT_FOUND);
  }
}

export class TransactionNotFoundError extends NotFoundError {
  constructor(message: string = 'Transacción no encontrada') {
    super(message, ErrorCodes.NOT_FOUND.TRANSACTION_NOT_FOUND);
  }
}

export class TransferNotFoundError extends NotFoundError {
  constructor(message: string = 'Transferencia no encontrada') {
    super(message, ErrorCodes.NOT_FOUND.TRANSFER_NOT_FOUND);
  }
}

export class CategoryNotFoundError extends NotFoundError {
  constructor(message: string = 'Categoría no encontrada') {
    super(message, ErrorCodes.NOT_FOUND.CATEGORY_NOT_FOUND);
  }
}

export class BudgetNotFoundError extends NotFoundError {
  constructor(message: string = 'Presupuesto no encontrado') {
    super(message, ErrorCodes.NOT_FOUND.BUDGET_NOT_FOUND);
  }
}

export class SavingsGoalNotFoundError extends NotFoundError {
  constructor(message: string = 'Meta de ahorro no encontrada') {
    super(message, ErrorCodes.NOT_FOUND.SAVINGS_GOAL_NOT_FOUND);
  }
}

export class AlertNotFoundError extends NotFoundError {
  constructor(message: string = 'Alerta no encontrada') {
    super(message, ErrorCodes.NOT_FOUND.ALERT_NOT_FOUND);
  }
}

export class SessionNotFoundError extends NotFoundError {
  constructor(message: string = 'Sesión de agente no encontrada') {
    super(message, ErrorCodes.NOT_FOUND.SESSION_NOT_FOUND);
  }
}

export class MessageNotFoundError extends NotFoundError {
  constructor(message: string = 'Mensaje no encontrado') {
    super(message, ErrorCodes.NOT_FOUND.MESSAGE_NOT_FOUND);
  }
}

// ========== CONFLICTO (409) ==========

export class ConflictError extends AppError {
  constructor(
    message: string = 'Conflicto',
    errorCode: ConflictErrorCode = ErrorCodes.CONFLICT.CONFLICT,
    data?: unknown,
  ) {
    super(message, 409, errorCode, data);
  }
}

export class ResourceAlreadyExistsError extends ConflictError {
  constructor(resourceName: string) {
    super(`${resourceName} ya existe`, ErrorCodes.CONFLICT.RESOURCE_ALREADY_EXISTS);
  }
}

// ========== SERVIDOR (500) ==========

export class InternalServerError extends AppError {
  constructor(
    message: string = 'Error interno del servidor',
    errorCode: ServerErrorCode = ErrorCodes.SERVER.INTERNAL_SERVER_ERROR,
    data?: unknown,
  ) {
    super(message, 500, errorCode, data);
  }
}

export class DatabaseError extends InternalServerError {
  constructor(message: string = 'Error en la base de datos') {
    super(message, ErrorCodes.SERVER.DATABASE_ERROR);
  }
}

export class LlmError extends InternalServerError {
  constructor(message: string = 'Error al comunicarse con el modelo de lenguaje') {
    super(message, ErrorCodes.SERVER.LLM_ERROR);
  }
}

export class McpToolError extends InternalServerError {
  constructor(message: string, data?: unknown) {
    super(message, ErrorCodes.SERVER.MCP_TOOL_ERROR, data);
  }
}

// ========== RATE LIMITING (429) ==========

export class RateLimitError extends AppError {
  constructor(
    message: string = 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
    errorCode: RateLimitErrorCode = ErrorCodes.RATE_LIMIT.TOO_MANY_REQUESTS,
  ) {
    super(message, 429, errorCode);
  }
}
