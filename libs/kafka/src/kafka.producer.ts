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

  constructor(private readonly logger: LoggerService) {
    const kafka = new Kafka({ clientId: process.env.KAFKA_CLIENT_ID || 'badrgo', brokers: kafkaBrokers() });
    this.producer = kafka.producer({ allowAutoTopicCreation: true, idempotent: true });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.log(`Kafka producer connected to ${kafkaBrokers().join(',')}`);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.producer.disconnect();
  }

  /**
   * Publishes one event. The aggregate id is used as the partition key, so all
   * events for a single wallet keep their relative order.
   */
  async publish(topic: KafkaTopic, event: KafkaEvent): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{ key: event.aggregateId, value: JSON.stringify(event), headers: { eventId: event.eventId, eventType: event.eventType } }],
    });
  }
}
