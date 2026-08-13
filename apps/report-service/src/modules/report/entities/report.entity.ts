import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@common/entity/base.entity';
import { ReportStatus, ReportType } from '@utils/enum';

/**
 * A report the operations UI asked for. Generation is asynchronous: the row is
 * created PENDING and flips to READY once the consumer has the data it needs.
 */
@Entity({ name: 'reports' })
export class Report extends BaseEntity {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: ReportType, example: ReportType.TRANSACTION_HISTORY })
  @Column({ type: 'varchar', length: 64 })
  type: ReportType;

  @ApiProperty({ enum: ReportStatus, example: ReportStatus.PENDING })
  @Index()
  @Column({ type: 'varchar', length: 16, default: ReportStatus.PENDING })
  status: ReportStatus;

  /** Who asked for it — no foreign key, the user lives in another service. */
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @Index()
  @Column({ type: 'uuid', nullable: true })
  requestedBy: string;

  @ApiProperty({ example: { from: '2026-01-01', to: '2026-01-31' } })
  @Column({ type: 'jsonb', nullable: true })
  params: Record<string, any>;

  @ApiProperty({ example: { rows: 128, total: '54000.00000000' } })
  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any>;

  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  @Column({ type: 'timestamp', nullable: true })
  generatedAt: Date;
}
