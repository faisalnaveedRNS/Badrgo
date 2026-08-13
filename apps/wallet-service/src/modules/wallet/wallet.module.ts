import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyModule } from '@wallet/modules/idempotency/idempotency.module';
import { OutboxModule } from '@wallet/modules/outbox/outbox.module';
import { TransactionModule } from '@wallet/modules/transaction/transaction.module';
import { Wallet } from './entities/wallet.entity';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet]), TransactionModule, OutboxModule, IdempotencyModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
