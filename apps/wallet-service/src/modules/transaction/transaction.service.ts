import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '@common/dtos/index.dtos';
import { PaginationMeta } from '@common/responses';
import { paginationMeta } from '@utils/helper';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(@InjectRepository(Transaction) private readonly repository: Repository<Transaction>) {}

  async findByWallet(walletId: string, query: PaginationDto): Promise<{ data: Transaction[]; meta: PaginationMeta }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 10;

    const [data, count] = await this.repository.findAndCount({
      where: { walletId },
      order: { createdAt: query?.sort === 'asc' ? 'ASC' : 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, meta: paginationMeta(count, data.length, page, pageSize) };
  }
}
