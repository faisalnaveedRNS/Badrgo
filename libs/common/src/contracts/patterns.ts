/**
 * Message patterns for synchronous service-to-service calls over TCP.
 *
 * The gateway is the only caller; each service answers with `@MessagePattern`.
 * Anything that should fan out to several consumers goes to Kafka instead —
 * see `@kafka/kafka.topics`.
 */
export enum AuthPattern {
  REGISTER = 'auth.register',
  LOGIN = 'auth.login',
}

export enum UserPattern {
  FIND_BY_ID = 'user.find_by_id',
  EXISTS = 'user.exists',
}

export enum WalletPattern {
  CREATE = 'wallet.create',
  FIND_BY_ID = 'wallet.find_by_id',
  FIND_BY_USER = 'wallet.find_by_user',
  CREDIT = 'wallet.credit',
  DEBIT = 'wallet.debit',
  TRANSACTIONS = 'wallet.transactions',
}

export enum ReportPattern {
  REQUEST = 'report.request',
  FIND_BY_ID = 'report.find_by_id',
  FIND_ALL = 'report.find_all',
}
