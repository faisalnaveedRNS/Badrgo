import { ApiProperty } from '@nestjs/swagger';
import { ViewColumn, ViewEntity } from 'typeorm';
import { ReportStatus, ReportType } from '@utils/enum';

/**
 * Read model for report GETs. Lifts the headline numbers out of the `result`
 * JSON into real columns, so the operations UI can sort and filter on them
 * without parsing JSON per row.
 */
@ViewEntity({
  name: 'report_view',
  expression: `
  SELECT
    r.id,
    r.type,
    r.status,
    r.requested_by,
    r.params,
    r.result,

    (r.result ->> 'wallets')::int                      AS wallet_count,
    (r.result ->> 'totalBalance')::numeric(20,8)       AS total_balance,
    (r.result ->> 'transactionCount')::int             AS transaction_count,

    -- how long the caller waited for it
    EXTRACT(EPOCH FROM (r.generated_at - r.created_at))::numeric(12,3) AS generation_seconds,

    r.generated_at,
    r.created_at,
    r.updated_at

  FROM reports r
  WHERE r.deleted_at IS NULL
`,
})
export class ReportView {
  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  id: string;

  @ViewColumn()
  @ApiProperty({ enum: ReportType, example: ReportType.WALLET_BALANCE })
  type: ReportType;

  @ViewColumn()
  @ApiProperty({ enum: ReportStatus, example: ReportStatus.READY })
  status: ReportStatus;

  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  requestedBy: string;

  @ViewColumn()
  @ApiProperty({ example: { userId: '5a9d8056-fffd-49a7-b215-40df44873d7d' } })
  params: Record<string, any>;

  @ViewColumn()
  @ApiProperty({ example: { wallets: 3, totalBalance: '5250.00000000' } })
  result: Record<string, any>;

  @ViewColumn()
  @ApiProperty({ example: 3 })
  walletCount: number;

  @ViewColumn()
  @ApiProperty({ example: '5250.00000000' })
  totalBalance: string;

  @ViewColumn()
  @ApiProperty({ example: 128 })
  transactionCount: number;

  @ViewColumn()
  @ApiProperty({ example: '0.412' })
  generationSeconds: string;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  generatedAt: Date;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  createdAt: Date;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  updatedAt: Date;
}
