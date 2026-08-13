import { OmitType } from '@nestjs/swagger';
import { CreateWalletDto, WalletOperationDto } from '@contracts/wallet.dto';

/**
 * Body shapes at the edge. `userId` comes from the bearer token and `walletId`
 * from the path, so neither is accepted from the caller — the gateway fills
 * them in before calling the wallet service.
 */
export class CreateWalletBodyDto extends OmitType(CreateWalletDto, ['userId'] as const) {}

export class WalletOperationBodyDto extends OmitType(WalletOperationDto, ['walletId', 'userId'] as const) {}
