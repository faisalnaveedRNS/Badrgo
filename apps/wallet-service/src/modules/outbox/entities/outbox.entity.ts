import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@common/entity/base.entity';
import { KafkaTopic } from '@kafka/kafka.topics';
import { OutboxStatus } from '@utils/enum';

/**
 * Transactional outbox.
 *
 * Events are written in the same database transaction as the balance change,
 * then drained to Kafka by the publisher. Either both the state change and the
 * event survive a crash, or neither does — no dual write.
 */
@Entity({ name: 'outbox_events' })
@Index(['status', 'createdAt'])
export class OutboxEvent extends BaseEntity {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'wallet' })
  @Column({ length: 64 })
  aggregateType: string;

  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @Index()
  @Column({ type: 'uuid' })
  aggregateId: string;

  /** Doubles as the Kafka topic. */
  @ApiProperty({ enum: KafkaTopic, example: KafkaTopic.WALLET_CREDITED })
  @Column({ type: 'varchar', length: 64 })
  eventType: KafkaTopic;

  @ApiProperty({ example: { walletId: '…', amount: '250.00000000' } })
  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @ApiProperty({ enum: OutboxStatus, example: OutboxStatus.PENDING })
  @Column({ type: 'varchar', length: 16, default: OutboxStatus.PENDING })
  status: OutboxStatus;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  attempts: number;

  @ApiProperty({ example: 'Broker unreachable' })
  @Column({ type: 'text', nullable: true })
  lastError: string;

  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;
}
