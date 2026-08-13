import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '@common/dtos/index.dtos';
import { PaginationMeta } from '@common/responses';
import { paginationMeta } from '@utils/helper';
import { TransactionView } from './views/transaction.view';

/**
 * The ledger is read-only from the outside: transactions are written by
 * `WalletService.post()` inside its transaction, and read here through the view.
 */
@Injectable()
export class TransactionService {
  constructor(@InjectRepository(TransactionView) private readonly transactionView: Repository<TransactionView>) {}

  async findById(id: string): Promise<TransactionView> {
    return this.transactionView.findOne({ where: { id } });
  }

  async findByWallet(walletId: string, query: PaginationDto): Promise<{ data: TransactionView[]; meta: PaginationMeta }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 10;

    const [data, count] = await this.transactionView.findAndCount({
      where: { walletId },
      order: { createdAt: query?.sort === 'asc' ? 'ASC' : 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, meta: paginationMeta(count, data.length, page, pageSize) };
  }
}
