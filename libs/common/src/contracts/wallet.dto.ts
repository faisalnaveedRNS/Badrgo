import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO4217CurrencyCode, IsNotEmpty, IsNumberString, IsObject, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ResponseMessage } from '@utils/enum';

/**
 * Payloads exchanged between the gateway and the wallet service. Shared so the
 * two sides cannot drift; validated at the gateway before the call is made.
 */
export class CreateWalletDto {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @IsUUID('4', { message: ResponseMessage.INVALID_PATH_PARAM })
  userId: string;

  @ApiProperty({ example: 'PKR' })
  @IsISO4217CurrencyCode()
  currency: string;
}

export class WalletOperationDto {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @IsUUID('4', { message: ResponseMessage.INVALID_PATH_PARAM })
  walletId: string;

  /**
   * Owner of the wallet, taken from the bearer token by the gateway — never
   * from the request body. The wallet service refuses to move money unless it
   * matches the wallet's `userId`.
   */
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @IsUUID('4', { message: ResponseMessage.INVALID_PATH_PARAM })
  userId: string;

  /** Decimal string, never a float: `numeric(20,8)` all the way down. */
  @ApiProperty({ example: '250.00' })
  @IsNumberString({ no_symbols: false }, { message: ResponseMessage.INVALID_AMOUNT })
  amount: string;

  @ApiProperty({ example: 'PKR' })
  @IsISO4217CurrencyCode()
  currency: string;

  /** Caller supplied, unique per wallet — the ledger line's business key. */
  @ApiProperty({ example: 'order_8127' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 128)
  reference: string;

  /**
   * Required on every money movement. Reserved in Redis for the first request
   * that presents it; a repeat of the same key is rejected, not replayed.
   */
  @ApiProperty({ example: 'b6e1f0c2-1f3e-4d5a-9f8b-2c7d1e4a6b90' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 128)
  idempotencyKey: string;

  @ApiPropertyOptional({ example: { channel: 'topup' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
