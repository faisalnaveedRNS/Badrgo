import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaEvent } from '@kafka/kafka.topics';
import { TransactionType } from '@utils/enum';
import { WalletProjection } from './entities/wallet-projection.entity';

const add = (a: string, b: string): string => (Number(a) + Number(b)).toFixed(8);

/**
 * Applies wallet events to the read model. Every handler exits early when the
 * event has already been applied, so redelivery is a no-op rather than a
 * double count.
 */
@Injectable()
export class ProjectionService {
  constructor(@InjectRepository(WalletProjection) private readonly repository: Repository<WalletProjection>) {}

  async onWalletCreated(event: KafkaEvent): Promise<void> {
    const { walletId, userId, currency } = event.payload;
    if (await this.repository.exists({ where: { walletId } })) return;

    await this.repository.insert({ walletId, userId, currency, lastEventId: event.eventId });
  }

  async onWalletMovement(event: KafkaEvent): Promise<void> {
    const { walletId, amount, balanceAfter, type } = event.payload;

    const projection = await this.repository.findOne({ where: { walletId } });
    if (!projection || projection.lastEventId === event.eventId) return;

    projection.balance = balanceAfter;
    projection.transactionCount += 1;
    projection.lastEventId = event.eventId;

    if (type === TransactionType.CREDIT) projection.totalCredited = add(projection.totalCredited, amount);
    else projection.totalDebited = add(projection.totalDebited, amount);

    await this.repository.save(projection);
  }
}
