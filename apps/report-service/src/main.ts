/* eslint-disable no-console */
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { KafkaConsumerGroup, kafkaConsumerOptions } from '@kafka/index';
import { AppConfig } from '@utils/config';
import { LoggerService } from '@utils/logger/logger.service';
import { ReportServiceModule } from './report.module';

/**
 * Hybrid app with three faces: HTTP for probes only, TCP for the gateway's
 * queries, and Kafka for the event stream that builds the projection.
 */
const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(ReportServiceModule, { bufferLogs: true });

  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.enableShutdownHooks();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: process.env.REPORT_SERVICE_HOST || '0.0.0.0', port: +(process.env.REPORT_SERVICE_PORT || 4003) },
  });
  app.connectMicroservice<MicroserviceOptions>(kafkaConsumerOptions('report-service', KafkaConsumerGroup.REPORTS));

  await app.startAllMicroservices();
  await app.listen(process.env.REPORT_HTTP_PORT || 3003);
  AppConfig.startup();
};

bootstrap()
  .then(() =>
    console.log(`Report service: TCP ${process.env.REPORT_SERVICE_PORT || 4003}, Kafka group ${KafkaConsumerGroup.REPORTS}, probes on ${process.env.REPORT_HTTP_PORT || 3003}`),
  )
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
