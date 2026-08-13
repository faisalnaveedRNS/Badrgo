import { Controller, UseFilters } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload, Transport } from '@nestjs/microservices';
import { RpcAllExceptionsFilter } from '@common/filters/rpc-exception.filter';
import { KafkaEvent, KafkaTopic } from '@kafka/kafka.topics';
import { LoggerService } from '@utils/logger/logger.service';
import { ProjectionService } from '@report/modules/report/projection.service';

/**
 * Reports consumer.
 *
 * `@EventPattern` (not `@MessagePattern`) — these are fire-and-forget events;
 * nothing is sent back to the producer. Delivery is at-least-once, so every
 * handler is idempotent on `eventId`.
 */
@UseFilters(RpcAllExceptionsFilter)
@Controller()
export class WalletConsumer {
  constructor(
    private readonly projection: ProjectionService,
    private readonly logger: LoggerService,
  ) {}

  @EventPattern(KafkaTopic.WALLET_CREATED, Transport.KAFKA)
  async onWalletCreated(@Payload() event: KafkaEvent, @Ctx() context: KafkaContext): Promise<void> {
    this.log(event, context);
    await this.projection.onWalletCreated(event);
  }

  @EventPattern(KafkaTopic.WALLET_CREDITED, Transport.KAFKA)
  async onWalletCredited(@Payload() event: KafkaEvent, @Ctx() context: KafkaContext): Promise<void> {
    this.log(event, context);
    await this.projection.onWalletMovement(event);
  }

  @EventPattern(KafkaTopic.WALLET_DEBITED, Transport.KAFKA)
  async onWalletDebited(@Payload() event: KafkaEvent, @Ctx() context: KafkaContext): Promise<void> {
    this.log(event, context);
    await this.projection.onWalletMovement(event);
  }

  private log(event: KafkaEvent, context: KafkaContext): void {
    this.logger.log(`Consumed ${event.eventType} ${event.eventId} from ${context.getTopic()}[${context.getPartition()}]`);
  }
}
