import { ApiProperty } from '@nestjs/swagger';
import { ViewColumn, ViewEntity } from 'typeorm';
import { EStatus } from '@utils/enum';

/**
 * Read model for every wallet GET.
 *
 * The ledger totals are aggregated here rather than in the service, so a
 * balance read is one query instead of a row scan in application code. Only
 * POSTED lines count — pending and reversed movements never reach a balance.
 */
@ViewEntity({
  name: 'wallet_view',
  expression: `
WITH transaction_agg AS (
  -- credits (+) and debits (-) per wallet, posted lines only
  SELECT
    t.wallet_id,
    COUNT(*)::int                                                                          AS transaction_count,
    SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END)::numeric(20,8)               AS total_credited,
    SUM(CASE WHEN t.type = 'debit'  THEN t.amount ELSE 0 END)::numeric(20,8)               AS total_debited,
    SUM(
      CASE
        WHEN t.type = 'credit' THEN t.amount
        WHEN t.type = 'debit'  THEN -t.amount
        ELSE 0
      END
    )::numeric(20,8)                                                                       AS net_posted_amount,
    MAX(t.created_at)                                                                      AS last_transaction_at

  FROM transactions t
  WHERE t.status = 'posted'
    AND t.deleted_at IS NULL
  GROUP BY t.wallet_id
)

  SELECT
    w.id,
    w.user_id,
    w.currency,
    w.status,
    w.balance,
    w.available_balance,
    w.version,

    COALESCE(a.transaction_count, 0)                        AS transaction_count,
    COALESCE(a.total_credited, 0)::numeric(20,8)            AS total_credited,
    COALESCE(a.total_debited, 0)::numeric(20,8)             AS total_debited,
    a.last_transaction_at,

    -- reconciliation: the stored balance minus what the ledger says it should be.
    -- Anything other than zero means a write bypassed WalletService.post().
    (w.balance - COALESCE(a.net_posted_amount, 0))::numeric(20,8) AS balance_drift,

    w.created_at,
    w.updated_at

  FROM wallets w
  LEFT JOIN transaction_agg a
    ON a.wallet_id = w.id

  WHERE w.deleted_at IS NULL
`,
})
export class WalletView {
  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  id: string;

  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  userId: string;

  @ViewColumn()
  @ApiProperty({ example: 'PKR' })
  currency: string;

  @ViewColumn()
  @ApiProperty({ enum: EStatus, example: EStatus.ACTIVE })
  status: EStatus;

  @ViewColumn()
  @ApiProperty({ example: '1750.00000000' })
  balance: string;

  @ViewColumn()
  @ApiProperty({ example: '1750.00000000' })
  availableBalance: string;

  @ViewColumn()
  @ApiProperty({ example: 3 })
  version: number;

  @ViewColumn()
  @ApiProperty({ example: 42 })
  transactionCount: number;

  @ViewColumn()
  @ApiProperty({ example: '12000.00000000' })
  totalCredited: string;

  @ViewColumn()
  @ApiProperty({ example: '10250.00000000' })
  totalDebited: string;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  lastTransactionAt: Date;

  @ViewColumn()
  @ApiProperty({ example: '0.00000000', description: 'Stored balance minus the posted ledger sum. Non-zero means the balance and the ledger disagree.' })
  balanceDrift: string;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  createdAt: Date;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  updatedAt: Date;
}
