import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { PaginatedResponse, PaginationMeta } from '@common/responses';
import { EStatus, TransactionStatus, TransactionType } from '@utils/enum';

/**
 * The gateway owns the wire shape. Services return plain rows; these classes
 * put them in the same envelope every other endpoint uses.
 */
export class WalletModel {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  id: string;

  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  userId: string;

  @ApiProperty({ example: 'PKR' })
  currency: string;

  @ApiProperty({ example: '1750.00000000' })
  balance: string;

  @ApiProperty({ example: '1750.00000000' })
  availableBalance: string;

  @ApiProperty({ enum: EStatus, example: EStatus.ACTIVE })
  status: EStatus;
}

export class TransactionModel {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  id: string;

  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  walletId: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.CREDIT })
  type: TransactionType;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.POSTED })
  status: TransactionStatus;

  @ApiProperty({ example: '250.00000000' })
  amount: string;

  @ApiProperty({ example: 'PKR' })
  currency: string;

  @ApiProperty({ example: '1750.00000000' })
  balanceAfter: string;

  @ApiProperty({ example: 'order_8127' })
  reference: string;
}

export class WalletResponse extends Response {
  @ApiProperty({ type: WalletModel })
  data: WalletModel;

  constructor(wallet: WalletModel) {
    super();
    this.data = wallet;
  }
}

export class WalletListResponse extends Response {
  @ApiProperty({ type: [WalletModel] })
  data: WalletModel[];

  constructor(wallets: WalletModel[]) {
    super();
    this.data = wallets;
  }
}

export class TransactionResponse extends Response {
  @ApiProperty({ type: TransactionModel })
  data: TransactionModel;

  constructor(transaction: TransactionModel) {
    super();
    this.data = transaction;
  }
}

export class TransactionListResponse extends PaginatedResponse<TransactionModel> {
  @ApiProperty({ type: [TransactionModel] })
  data: TransactionModel[];

  constructor(transactions: TransactionModel[], meta: PaginationMeta) {
    super(transactions, meta);
  }
}
