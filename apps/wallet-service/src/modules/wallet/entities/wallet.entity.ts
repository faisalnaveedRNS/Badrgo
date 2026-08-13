import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';
import { BaseEntity } from '@common/entity/base.entity';
import { EStatus } from '@utils/enum';

/**
 * One balance per user per currency.
 *
 * Money is stored as `numeric(20,8)` and read back as a string: TypeORM never
 * hands it to the JS number type, so no precision is lost in transit.
 */
@Entity({ name: 'wallets' })
@Index(['userId', 'currency'], { unique: true })
export class Wallet extends BaseEntity {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Owning user, resolved by the user service. No cross-service foreign key. */
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'PKR' })
  @Column({ length: 3 })
  currency: string;

  @ApiProperty({ example: '1500.00000000' })
  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  balance: string;

  /** Balance minus the amount held by pending debits. */
  @ApiProperty({ example: '1400.00000000' })
  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  availableBalance: string;

  @ApiProperty({ enum: EStatus, example: EStatus.ACTIVE })
  @Column({ type: 'varchar', length: 32, default: EStatus.ACTIVE })
  status: EStatus;

  /** Optimistic lock: concurrent writes to the same wallet fail rather than interleave. */
  @ApiProperty({ example: 1 })
  @VersionColumn()
  version: number;
}
