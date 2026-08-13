import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateWalletDto, WalletOperationDto } from '@contracts/wallet.dto';
import { KafkaTopic } from '@kafka/kafka.topics';
import { EStatus, TransactionStatus, TransactionType } from '@utils/enum';
import { Transaction } from '@wallet/modules/transaction/entities/transaction.entity';
import { OutboxService } from '@wallet/modules/outbox/outbox.service';
import { TransactionService } from '@wallet/modules/transaction/transaction.service';
import { TransactionView } from '@wallet/modules/transaction/views/transaction.view';
import { Wallet } from './entities/wallet.entity';
import { WalletView } from './views/wallet.view';
import { CurrencyMismatch, InsufficientBalance, InvalidAmount, WalletAlreadyExists, WalletInactive, WalletNotFound } from './wallet.exception';

/** Money is decimal all the way through — parsed only to compare, never to store. */
const toAmount = (value: string | number): number => Number(value);
const format = (value: number): string => value.toFixed(8);

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletView) private readonly walletView: Repository<WalletView>,
    private readonly dataSource: DataSource,
    private readonly outboxService: OutboxService,
    private readonly transactionService: TransactionService,
  ) {}

  async create(payload: CreateWalletDto): Promise<WalletView> {
    const { userId, currency } = payload;
    if (await this.walletRepository.exists({ where: { userId, currency } })) new WalletAlreadyExists();

    const created = await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.save(manager.create(Wallet, { userId, currency, balance: format(0), availableBalance: format(0) }));

      await this.outboxService.record(manager, KafkaTopic.WALLET_CREATED, 'wallet', wallet.id, {
        walletId: wallet.id,
        userId: wallet.userId,
        currency: wallet.currency,
      });

      return wallet;
    });

    return this.findById(created.id);
  }

  /**
   * Read path: the view, which carries the ledger totals alongside the balance.
   * The table is only touched on the write path, under a row lock.
   */
  async findById(id: string): Promise<WalletView> {
    const wallet = await this.walletView.findOne({ where: { id } });
    if (!wallet) new WalletNotFound();
    return wallet;
  }

  async findByUser(userId: string): Promise<WalletView[]> {
    return this.walletView.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async credit(payload: WalletOperationDto): Promise<TransactionView> {
    return this.post(payload, TransactionType.CREDIT);
  }

  async debit(payload: WalletOperationDto): Promise<TransactionView> {
    return this.post(payload, TransactionType.DEBIT);
  }

  /**
   * The one write path for money.
   *
   * Balance update, ledger line and outbox event share a single transaction, so
   * the event can never describe a balance that was rolled back. The wallet row
   * is locked pessimistically for the duration to serialise concurrent movements.
   */
  private async post(payload: WalletOperationDto, type: TransactionType): Promise<TransactionView> {
    const amount = toAmount(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) new InvalidAmount();

    const posted = await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, { where: { id: payload.walletId }, lock: { mode: 'pessimistic_write' } });

      if (!wallet) new WalletNotFound();
      if (wallet.status !== EStatus.ACTIVE) new WalletInactive();
      if (wallet.currency !== payload.currency) new CurrencyMismatch();

      const balance = toAmount(wallet.balance);
      if (type === TransactionType.DEBIT && balance < amount) new InsufficientBalance();

      const balanceAfter = type === TransactionType.CREDIT ? balance + amount : balance - amount;

      wallet.balance = format(balanceAfter);
      wallet.availableBalance = format(balanceAfter);
      await manager.save(wallet);

      const transaction = await manager.save(
        manager.create(Transaction, {
          walletId: wallet.id,
          wallet,
          type,
          status: TransactionStatus.POSTED,
          amount: format(amount),
          currency: payload.currency,
          balanceAfter: format(balanceAfter),
          reference: payload.reference,
          metadata: payload.metadata,
        }),
      );

      const event = {
        walletId: wallet.id,
        userId: wallet.userId,
        transactionId: transaction.id,
        type,
        amount: transaction.amount,
        currency: transaction.currency,
        balanceAfter: transaction.balanceAfter,
        reference: transaction.reference,
      };

      await this.outboxService.record(manager, type === TransactionType.CREDIT ? KafkaTopic.WALLET_CREDITED : KafkaTopic.WALLET_DEBITED, 'wallet', wallet.id, event);
      await this.outboxService.record(manager, KafkaTopic.TRANSACTION_POSTED, 'transaction', transaction.id, event);

      return transaction;
    });

    // Re-read after commit: the view is the shape every caller gets.
    return this.transactionService.findById(posted.id);
  }
}
