import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { LoggerService } from '@utils/logger/logger.service';
import { kafkaBrokers } from './kafka.config';
import { KafkaEvent, KafkaTopic } from './kafka.topics';

/**
 * Thin kafkajs producer. Only the outbox publisher should call this: services
 * write events to their own outbox table inside the business transaction, and
 * the publisher drains that table to Kafka.
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnApplicationShutdown {
  private readonly producer: Producer;
  private connected = false;

  constructor(private readonly logger: LoggerService) {
    const kafka = new Kafka({ clientId: process.env.KAFKA_CLIENT_ID || 'badrgo', brokers: kafkaBrokers() });
    this.producer = kafka.producer({ allowAutoTopicCreation: true, idempotent: true });
  }

  /**
   * A broker outage must not stop the service from booting. Writes still land
   * in the outbox, and the publisher retries — which is the whole point of
   * having an outbox. The first `publish()` reconnects.
   */
  async onModuleInit(): Promise<void> {
    await this.connect().catch((error) => this.logger.error(`Kafka producer unavailable at ${kafkaBrokers().join(',')}: ${(error as Error).message}`));
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.connected) await this.producer.disconnect().catch(() => undefined);
  }

  private async connect(): Promise<void> {
    if (this.connected) return;

    await this.producer.connect();
    this.connected = true;
    this.logger.log(`Kafka producer connected to ${kafkaBrokers().join(',')}`);
  }

  /**
   * Publishes one event. The aggregate id is used as the partition key, so all
   * events for a single wallet keep their relative order.
   */
  async publish(topic: KafkaTopic, event: KafkaEvent): Promise<void> {
    await this.connect();
    await this.producer.send({
      topic,
      messages: [{ key: event.aggregateId, value: JSON.stringify(event), headers: { eventId: event.eventId, eventType: event.eventType } }],
    });
  }
}
