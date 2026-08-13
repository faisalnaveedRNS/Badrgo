import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@common/entity/base.entity';
import { TransactionStatus, TransactionType } from '@utils/enum';
import { Wallet } from '@wallet/modules/wallet/entities/wallet.entity';

/**
 * Append-only ledger line. Balances are derived from posted transactions, so a
 * transaction is never edited once posted — corrections are new REVERSED rows.
 */
@Entity({ name: 'transactions' })
export class Transaction extends BaseEntity {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Wallet })
  @ManyToOne(() => Wallet, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn()
  wallet: Wallet;

  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @Index()
  @Column({ type: 'uuid' })
  walletId: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.CREDIT })
  @Column({ type: 'varchar', length: 16 })
  type: TransactionType;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.POSTED })
  @Column({ type: 'varchar', length: 16, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @ApiProperty({ example: '250.00000000' })
  @Column({ type: 'numeric', precision: 20, scale: 8 })
  amount: string;

  @ApiProperty({ example: 'PKR' })
  @Column({ length: 3 })
  currency: string;

  /** Balance after this line was posted, kept for statement rendering. */
  @ApiProperty({ example: '1750.00000000' })
  @Column({ type: 'numeric', precision: 20, scale: 8, nullable: true })
  balanceAfter: string;

  /** Caller supplied reference (payment id, order id). Unique per wallet. */
  @ApiProperty({ example: 'order_8127' })
  @Index({ unique: true })
  @Column({ length: 128 })
  reference: string;

  @ApiProperty({ example: { channel: 'topup' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
