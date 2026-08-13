import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EntityManager } from 'typeorm';
import { KafkaEvent, KafkaTopic } from '@kafka/kafka.topics';
import { OutboxEvent } from './entities/outbox.entity';

@Injectable()
export class OutboxService {
  /**
   * Records an event inside the caller's transaction.
   *
   * Must be handed the transactional `EntityManager` — writing the event on a
   * different connection would reintroduce the dual write this table exists to
   * prevent.
   */
  async record(manager: EntityManager, eventType: KafkaTopic, aggregateType: string, aggregateId: string, payload: Record<string, any>): Promise<OutboxEvent> {
    const event = manager.create(OutboxEvent, { eventType, aggregateType, aggregateId, payload });
    return manager.save(event);
  }

  /** Wraps a stored row in the envelope consumers receive. */
  static toEnvelope(event: OutboxEvent): KafkaEvent {
    return {
      eventId: event.id || randomUUID(),
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      occurredAt: (event.createdAt || new Date()).toISOString(),
      payload: event.payload,
    };
  }
}
