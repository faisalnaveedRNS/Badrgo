import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcAllExceptionsFilter } from '@common/filters/rpc-exception.filter';
import { WalletPattern } from '@contracts/patterns';
import { CreateWalletDto, WalletOperationDto } from '@contracts/wallet.dto';
import { PaginationDto } from '@common/dtos/index.dtos';
import { IdempotencyService } from '@wallet/modules/idempotency/idempotency.service';
import { TransactionService } from '@wallet/modules/transaction/transaction.service';
import { Transaction } from '@wallet/modules/transaction/entities/transaction.entity';
import { Wallet } from './entities/wallet.entity';
import { DuplicateRequest } from './wallet.exception';
import { WalletService } from './wallet.service';

/**
 * The wallet service speaks TCP message patterns, not HTTP — the gateway is its
 * only caller. Every handler returns a plain entity; the envelope is the
 * gateway's job.
 */
@UseFilters(RpcAllExceptionsFilter)
@Controller()
export class WalletController {
  constructor(
    private readonly service: WalletService,
    private readonly transactionService: TransactionService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @MessagePattern(WalletPattern.CREATE)
  async create(@Payload() payload: CreateWalletDto): Promise<Wallet> {
    return this.service.create(payload);
  }

  @MessagePattern(WalletPattern.FIND_BY_ID)
  async findById(@Payload() payload: { id: string }): Promise<Wallet> {
    return this.service.findById(payload.id);
  }

  @MessagePattern(WalletPattern.FIND_BY_USER)
  async findByUser(@Payload() payload: { userId: string }): Promise<Wallet[]> {
    return this.service.findByUser(payload.userId);
  }

  @MessagePattern(WalletPattern.CREDIT)
  async credit(@Payload() payload: WalletOperationDto): Promise<Transaction> {
    return this.idempotent(payload, WalletPattern.CREDIT, () => this.service.credit(payload));
  }

  @MessagePattern(WalletPattern.DEBIT)
  async debit(@Payload() payload: WalletOperationDto): Promise<Transaction> {
    return this.idempotent(payload, WalletPattern.DEBIT, () => this.service.debit(payload));
  }

  @MessagePattern(WalletPattern.TRANSACTIONS)
  async transactions(@Payload() payload: { walletId: string; query: PaginationDto }) {
    return this.transactionService.findByWallet(payload.walletId, payload.query);
  }

  /**
   * Runs `operation` at most once per idempotency key. Without a key the
   * operation runs as-is — the unique `reference` on the ledger line is then
   * the only thing standing between a retry and a double post.
   */
  private async idempotent(payload: WalletOperationDto, scope: string, operation: () => Promise<Transaction>): Promise<Transaction> {
    if (!payload.idempotencyKey) return operation();

    const claim = await this.idempotencyService.claim(payload.idempotencyKey, scope, payload);
    if (claim) {
      if (!claim.replay) new DuplicateRequest();
      return claim.replay as Transaction;
    }

    try {
      const result = await operation();
      await this.idempotencyService.complete(payload.idempotencyKey, scope, result as unknown as Record<string, any>);
      return result;
    } catch (error) {
      await this.idempotencyService.release(payload.idempotencyKey, scope);
      throw error;
    }
  }
}
