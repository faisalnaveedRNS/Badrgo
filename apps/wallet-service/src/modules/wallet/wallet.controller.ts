import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcAllExceptionsFilter } from '@common/filters/rpc-exception.filter';
import { WalletPattern } from '@contracts/patterns';
import { CreateWalletDto, WalletOperationDto } from '@contracts/wallet.dto';
import { PaginationDto } from '@common/dtos/index.dtos';
import { IdempotencyService } from '@wallet/modules/idempotency/idempotency.service';
import { TransactionService } from '@wallet/modules/transaction/transaction.service';
import { TransactionView } from '@wallet/modules/transaction/views/transaction.view';
import { WalletView } from './views/wallet.view';
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
  async create(@Payload() payload: CreateWalletDto): Promise<WalletView> {
    return this.service.create(payload);
  }

  @MessagePattern(WalletPattern.FIND_BY_ID)
  async findById(@Payload() payload: { id: string }): Promise<WalletView> {
    return this.service.findById(payload.id);
  }

  @MessagePattern(WalletPattern.FIND_BY_USER)
  async findByUser(@Payload() payload: { userId: string }): Promise<WalletView[]> {
    return this.service.findByUser(payload.userId);
  }

  @MessagePattern(WalletPattern.CREDIT)
  async credit(@Payload() payload: WalletOperationDto): Promise<TransactionView> {
    return this.idempotent(payload, WalletPattern.CREDIT, () => this.service.credit(payload));
  }

  @MessagePattern(WalletPattern.DEBIT)
  async debit(@Payload() payload: WalletOperationDto): Promise<TransactionView> {
    return this.idempotent(payload, WalletPattern.DEBIT, () => this.service.debit(payload));
  }

  @MessagePattern(WalletPattern.TRANSACTIONS)
  async transactions(@Payload() payload: { walletId: string; query: PaginationDto }) {
    return this.transactionService.findByWallet(payload.walletId, payload.query);
  }

  /**
   * Runs `operation` at most once per idempotency key.
   *
   * The key is reserved in Redis before any money moves. A key that is already
   * held means this transaction was already accepted, so the duplicate is
   * rejected rather than replayed. A failed operation gives its key back, since
   * nothing was posted and the caller is entitled to retry.
   */
  private async idempotent(payload: WalletOperationDto, scope: string, operation: () => Promise<TransactionView>): Promise<TransactionView> {
    if (!(await this.idempotencyService.claim(payload.idempotencyKey, scope))) new DuplicateRequest();

    try {
      return await operation();
    } catch (error) {
      await this.idempotencyService.release(payload.idempotencyKey, scope);
      throw error;
    }
  }
}
