import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@common/common.module';
import { KafkaModule } from '@kafka/kafka.module';
import { RedisModule } from '@cache/redis.module';
import { AppConfig } from '@utils/config';
import { LoggerModule } from '@utils/logger/logger.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { OutboxEvent } from './modules/outbox/entities/outbox.entity';
import { OutboxModule } from './modules/outbox/outbox.module';
import { Transaction } from './modules/transaction/entities/transaction.entity';
import { TransactionModule } from './modules/transaction/transaction.module';
import { Wallet } from './modules/wallet/entities/wallet.entity';
import { WalletModule } from './modules/wallet/wallet.module';

/** Tables owned by the wallet service. No other service reads them. */
export const entities = [Wallet, Transaction, OutboxEvent];

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: [AppConfig.envConfiguration()], isGlobal: true }),
    TypeOrmModule.forRoot(AppConfig.typeorm(process.env.WALLET_DB_DATABASE || 'badrgo_wallet', entities)),
    ScheduleModule.forRoot(),
    LoggerModule,
    CommonModule,
    KafkaModule,
    RedisModule,
    WalletModule,
    TransactionModule,
    OutboxModule,
    IdempotencyModule,
  ],
})
export class WalletServiceModule {}
