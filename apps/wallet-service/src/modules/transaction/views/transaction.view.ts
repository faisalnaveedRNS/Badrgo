import { ApiProperty } from '@nestjs/swagger';
import { ViewColumn, ViewEntity } from 'typeorm';
import { TransactionStatus, TransactionType } from '@utils/enum';

/**
 * Read model for ledger GETs. Carries the wallet's owner and currency so a
 * statement renders without a second query, and signs the amount so a caller
 * can sum a page without re-reading `type`.
 */
@ViewEntity({
  name: 'transaction_view',
  expression: `
  SELECT
    t.id,
    t.wallet_id,
    w.user_id,
    t.type,
    t.status,
    t.amount,

    -- credits positive, debits negative: SUM(signed_amount) is the net movement
    (CASE WHEN t.type = 'debit' THEN -t.amount ELSE t.amount END)::numeric(20,8) AS signed_amount,

    t.currency,
    t.balance_after,
    t.reference,
    t.metadata,
    t.created_at,
    t.updated_at

  FROM transactions t
  LEFT JOIN wallets w
    ON w.id = t.wallet_id

  WHERE t.deleted_at IS NULL
`,
})
export class TransactionView {
  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  id: string;

  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  walletId: string;

  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  userId: string;

  @ViewColumn()
  @ApiProperty({ enum: TransactionType, example: TransactionType.CREDIT })
  type: TransactionType;

  @ViewColumn()
  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.POSTED })
  status: TransactionStatus;

  @ViewColumn()
  @ApiProperty({ example: '250.00000000' })
  amount: string;

  @ViewColumn()
  @ApiProperty({ example: '-250.00000000' })
  signedAmount: string;

  @ViewColumn()
  @ApiProperty({ example: 'PKR' })
  currency: string;

  @ViewColumn()
  @ApiProperty({ example: '1750.00000000' })
  balanceAfter: string;

  @ViewColumn()
  @ApiProperty({ example: 'order_8127' })
  reference: string;

  @ViewColumn()
  @ApiProperty({ example: { channel: 'topup' } })
  metadata: Record<string, any>;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  createdAt: Date;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  updatedAt: Date;
}
