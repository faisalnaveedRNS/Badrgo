import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@common/entity/base.entity';
import { IdempotencyStatus } from '@utils/enum';

/**
 * Makes money movement safe to retry.
 *
 * The first request for a key inserts an IN_PROGRESS row; a retry with the same
 * key replays the stored response instead of moving money twice. `requestHash`
 * catches a key reused with a different body.
 */
@Entity({ name: 'idempotency_keys' })
export class IdempotencyKey extends BaseEntity {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'b6e1f0c2-1f3e-4d5a-9f8b-2c7d1e4a6b90' })
  @Index({ unique: true })
  @Column({ length: 128 })
  key: string;

  /** Operation the key belongs to, e.g. `wallet.credit`. */
  @ApiProperty({ example: 'wallet.credit' })
  @Column({ length: 64 })
  scope: string;

  @ApiProperty({ example: 'c8f2…' })
  @Column({ length: 128 })
  requestHash: string;

  @ApiProperty({ enum: IdempotencyStatus, example: IdempotencyStatus.COMPLETED })
  @Column({ type: 'varchar', length: 16, default: IdempotencyStatus.IN_PROGRESS })
  status: IdempotencyStatus;

  @ApiProperty({ example: { statusCode: 200, message: 'Success' } })
  @Column({ type: 'jsonb', nullable: true })
  response: Record<string, any>;

  @ApiProperty({ example: '2024-01-30T08:12:24.980Z' })
  @Index()
  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
