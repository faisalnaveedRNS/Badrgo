import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { KafkaProducerService } from '@kafka/kafka.producer';
import { OutboxStatus } from '@utils/enum';
import { LoggerService } from '@utils/logger/logger.service';
import { OutboxEvent } from './entities/outbox.entity';
import { OutboxService } from './outbox.service';

const BATCH_SIZE = 100;
const MAX_ATTEMPTS = 10;

/**
 * Drains the outbox to Kafka.
 *
 * Delivery is at-least-once: a crash between `send` and the status update
 * republishes the event, so every consumer must dedupe on `eventId`.
 */
@Injectable()
export class OutboxPublisher {
  private draining = false;

  constructor(
    @InjectRepository(OutboxEvent) private readonly outboxRepository: Repository<OutboxEvent>,
    private readonly producer: KafkaProducerService,
    private readonly logger: LoggerService,
  ) {}

  @Interval(+(process.env.OUTBOX_POLL_MS || 2000))
  async drain(): Promise<void> {
    // One drain at a time: the interval must not overlap a slow batch.
    if (this.draining) return;
    this.draining = true;

    try {
      const pending = await this.outboxRepository.find({
        where: { status: OutboxStatus.PENDING, attempts: LessThan(MAX_ATTEMPTS) },
        order: { createdAt: 'ASC' },
        take: BATCH_SIZE,
      });

      for (const event of pending) await this.publish(event);
    } catch (error) {
      this.logger.error(error);
    } finally {
      this.draining = false;
    }
  }

  private async publish(event: OutboxEvent): Promise<void> {
    try {
      await this.producer.publish(event.eventType, OutboxService.toEnvelope(event));
      await this.outboxRepository.update(event.id, { status: OutboxStatus.PUBLISHED, publishedAt: new Date(), attempts: event.attempts + 1 });
    } catch (error) {
      const attempts = event.attempts + 1;
      await this.outboxRepository.update(event.id, {
        attempts,
        lastError: (error as Error).message,
        status: attempts >= MAX_ATTEMPTS ? OutboxStatus.FAILED : OutboxStatus.PENDING,
      });
      this.logger.error(`Outbox publish failed for ${event.id} (${event.eventType}): ${(error as Error).message}`);
    }
  }
}
