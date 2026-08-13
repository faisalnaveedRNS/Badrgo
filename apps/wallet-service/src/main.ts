/* eslint-disable no-console */
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppConfig } from '@utils/config';
import { LoggerService } from '@utils/logger/logger.service';
import { WalletServiceModule } from './wallet.module';

/**
 * Pure microservice: TCP in (from the gateway), Kafka out (via the outbox).
 * It never listens on HTTP.
 */
const bootstrap = async () => {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(WalletServiceModule, {
    transport: Transport.TCP,
    options: { host: process.env.WALLET_SERVICE_HOST || '0.0.0.0', port: +(process.env.WALLET_SERVICE_PORT || 4002) },
    bufferLogs: true,
  });

  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  await app.listen();
  AppConfig.startup();
};

bootstrap()
  .then(() => console.log(`Wallet service listening on TCP ${process.env.WALLET_SERVICE_PORT || 4002}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
