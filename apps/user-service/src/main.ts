/* eslint-disable no-console */
import 'reflect-metadata';
import { INestApplication, ModuleMetadata, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import compression from 'compression';
import express from 'express';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TrimStringsPipe } from '@common/transformer/trim-strings.pipe';
import { AppModule, imports } from '@modules/main/app.module';
import { AppService } from '@modules/main/app.service';
import { LoggerService } from '@utils/logger/logger.service';

const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const logger = await app.resolve(LoggerService);

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.useLogger(logger);

  // Order matters: trim -> validate -> (controller) -> exception filter.
  app.useGlobalPipes(new TrimStringsPipe(), new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  app.setGlobalPrefix(process.env.API_PREFIX || 'v1/api');
  app.disable('x-powered-by');
  app.enableCors({ origin: '*' });
  app.enableShutdownHooks();

  // Hybrid app: its own HTTP surface plus the TCP face the gateway calls.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: process.env.USER_SERVICE_HOST || '0.0.0.0', port: +(process.env.USER_SERVICE_PORT || 4001) },
  });

  // Lets custom class-validator constraints inject providers.
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  swaggerDoc(app, imports, 'docs', 'Client API', 'Endpoints consumed by the end-user application');

  await app.startAllMicroservices();
  await app.listen(process.env.USER_HTTP_PORT || 3001);
  AppService.startup();
};

const swaggerDoc = (app: INestApplication, modules: ModuleMetadata['imports'], route: string, title: string, description: string) => {
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion('1.0')
    .addServer(`http://localhost:${process.env.APP_PORT || 3000}`, 'Local')
    .addBearerAuth()
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
    include: modules as any,
  };

  SwaggerModule.setup(route, app, SwaggerModule.createDocument(app, config, options), { customSiteTitle: title });
};

bootstrap()
  .then(() => console.log(`User service: HTTP ${process.env.USER_HTTP_PORT || 3001}, TCP ${process.env.USER_SERVICE_PORT || 4001}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
