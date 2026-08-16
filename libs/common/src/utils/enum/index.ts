export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum UserRoles {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum EStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  POSTED = 'posted',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum OutboxStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

export enum ReportType {
  WALLET_BALANCE = 'wallet_balance',
  TRANSACTION_HISTORY = 'transaction_history',
}

export enum ReportStatus {
  PENDING = 'pending',
  READY = 'ready',
  FAILED = 'failed',
}

export enum Language {
  EN_US = 'en-us',
  UR = 'ur',
}

/**
 * Business response codes.
 *
 * 2xx/4xx/5xx keep their HTTP meaning. Everything from 600 upwards is an
 * application level code: the HTTP status stays 400 (see `Exception`) while
 * `statusCode` in the body tells the client exactly what went wrong.
 */
export enum ResponseCode {
  SUCCESS = 200,
  CREATED_SUCCESSFULLY = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,

  GENERIC_ERROR = 600,
  INVALID_INPUT = 601,
  INVALID_TOKEN = 602,
  TOKEN_EXPIRED = 603,
  FORBIDDEN_ACCESS = 604,
  INVALID_PATH_PARAM = 605,

  // User
  USER_NOT_FOUND = 610,
  USER_ALREADY_EXISTS = 611,
  INVALID_CREDENTIALS = 612,
  INACTIVE_ACCOUNT = 613,
  INCORRECT_CURRENT_PASSWORD = 614,
  SAME_AS_OLD_PASSWORD = 615,
  FAILED_TO_CREATE_USER = 616,
  FAILED_TO_UPDATE_USER = 617,

  // Role
  ROLE_NOT_FOUND = 640,
  INVALID_ROLE = 641,

  // Language
  LANGUAGE_NOT_SUPPORTED = 650,

  // Wallet
  WALLET_NOT_FOUND = 660,
  WALLET_ALREADY_EXISTS = 661,
  WALLET_INACTIVE = 662,
  INSUFFICIENT_BALANCE = 663,
  INVALID_AMOUNT = 664,
  CURRENCY_MISMATCH = 665,
  DUPLICATE_REQUEST = 666,
  AMOUNT_LIMIT_EXCEEDED = 667,

  // Transaction
  TRANSACTION_NOT_FOUND = 670,
  TRANSACTION_ALREADY_POSTED = 671,

  // Report
  REPORT_NOT_FOUND = 680,
  REPORT_NOT_READY = 681,

  // Service to service
  SERVICE_UNAVAILABLE = 690,
}

export enum ResponseMessage {
  SUCCESS = 'Success',
  CREATED_SUCCESSFULLY = 'Created successfully',
  UPDATED_SUCCESSFULLY = 'Updated successfully',
  DELETED_SUCCESSFULLY = 'Deleted successfully',

  GENERIC_ERROR = 'Generic error',
  INTERNAL_SERVER_ERROR = 'Internal server error',
  INVALID_INPUT = 'Invalid input',
  INVALID_TOKEN = 'Invalid token',
  TOKEN_EXPIRED = 'Token expired',
  UNAUTHENTICATED = 'Unauthenticated',
  FORBIDDEN_ACCESS = 'Unauthorized access',
  INVALID_PATH_PARAM = 'Invalid path parameter',

  // User
  USER_NOT_FOUND = 'User not found',
  USER_ALREADY_EXISTS = 'User with the same email already exists',
  INVALID_CREDENTIALS = 'Invalid email or password',
  INACTIVE_ACCOUNT = 'Account is not active',
  INCORRECT_CURRENT_PASSWORD = 'Your current password is incorrect',
  SAME_AS_OLD_PASSWORD = 'Same as current password',
  FAILED_TO_CREATE_USER = 'Failed to create user',
  FAILED_TO_UPDATE_USER = 'Failed to update user',
  INVALID_PASSWORD = 'Use 8-50 characters with a mix of letters, numbers & symbols',

  // Role
  ROLE_NOT_FOUND = 'Role not found',
  INVALID_ROLE = 'Invalid role',

  // Language
  LANGUAGE_NOT_SUPPORTED = 'Language not supported',

  // Wallet
  WALLET_NOT_FOUND = 'Wallet not found',
  WALLET_ALREADY_EXISTS = 'Wallet already exists for this user and currency',
  WALLET_INACTIVE = 'Wallet is not active',
  INSUFFICIENT_BALANCE = 'Insufficient balance',
  INVALID_AMOUNT = 'Amount must be greater than zero',
  CURRENCY_MISMATCH = 'Currency does not match the wallet currency',
  DUPLICATE_REQUEST = 'A transaction with this idempotency key has already been accepted',
  AMOUNT_LIMIT_EXCEEDED = 'Amount exceeds the maximum of 10,000,000 per transaction',

  // Transaction
  TRANSACTION_NOT_FOUND = 'Transaction not found',
  TRANSACTION_ALREADY_POSTED = 'Transaction has already been posted',

  // Report
  REPORT_NOT_FOUND = 'Report not found',
  REPORT_NOT_READY = 'Report is not ready yet',

  // Service to service
  SERVICE_UNAVAILABLE = 'Downstream service is unavailable',
}
