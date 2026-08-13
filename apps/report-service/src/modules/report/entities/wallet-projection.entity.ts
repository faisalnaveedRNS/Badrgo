import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '@common/entity/base.entity';

/**
 * Read model built from `wallet.*` and `tx.*` events.
 *
 * The report service never queries the wallet database — it keeps its own
 * denormalised copy, updated as events arrive. `lastEventId` makes the
 * projection idempotent under Kafka's at-least-once delivery.
 */
@Entity({ name: 'wallet_projections' })
export class WalletProjection extends BaseEntity {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @PrimaryColumn({ type: 'uuid' })
  walletId: string;

  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'PKR' })
  @Column({ length: 3 })
  currency: string;

  @ApiProperty({ example: '1750.00000000' })
  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  balance: string;

  @ApiProperty({ example: '12000.00000000' })
  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  totalCredited: string;

  @ApiProperty({ example: '10250.00000000' })
  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  totalDebited: string;

  @ApiProperty({ example: 42 })
  @Column({ type: 'int', default: 0 })
  transactionCount: number;

  /** Last event applied — replays of the same event are ignored. */
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @Column({ type: 'uuid', nullable: true })
  lastEventId: string;
}
