/**
 * Every event that crosses a service boundary. Producers publish by topic,
 * consumers subscribe by topic — nothing else is shared between services.
 */
export enum KafkaTopic {
  WALLET_CREATED = 'wallet.created',
  WALLET_CREDITED = 'wallet.credited',
  WALLET_DEBITED = 'wallet.debited',

  TRANSACTION_CREATED = 'tx.created',
  TRANSACTION_POSTED = 'tx.posted',
  TRANSACTION_FAILED = 'tx.failed',
}

/** Consumer groups, one per downstream concern (see the Kafka fan-out). */
export enum KafkaConsumerGroup {
  REPORTS = 'reports-consumer',
  AUDIT = 'audit-consumer',
  ANALYTICS = 'analytics-consumer',
}

/**
 * Envelope every event is wrapped in, so consumers can dedupe on `eventId`
 * and trace a change back to the row that produced it.
 */
export interface KafkaEvent<T = Record<string, any>> {
  eventId: string;
  eventType: KafkaTopic;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  payload: T;
}
