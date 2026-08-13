/* eslint-disable no-console */
import 'reflect-metadata';
import { INestApplication, ModuleMetadata, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import compression from 'compression';
import express from 'express';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TrimStringsPipe } from '@common/transformer/trim-strings.pipe';
import { AppConfig } from '@utils/config';
import { LoggerService } from '@utils/logger/logger.service';
import { adminModulesImports, GatewayModule, imports } from './gateway.module';

/**
 * The only process exposed to the internet. Bootstraps exactly like the
 * original single app did — same pipe order, same filter, same two Swagger
 * documents — but forwards the work to the services behind it.
 */
const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(GatewayModule, { bufferLogs: true });
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

  // Lets custom class-validator constraints inject providers.
  useContainer(app.select(GatewayModule), { fallbackOnErrors: true });

  swaggerDoc(app, imports, 'docs', 'Client API', 'Endpoints consumed by the end-user application');
  swaggerDoc(app, adminModulesImports, 'docs/admin', 'Admin API', 'Endpoints consumed by the back office');

  await app.listen(process.env.APP_PORT || 3000);
  AppConfig.startup();
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
  .then(() => console.log(`Gateway started on ${process.env.APP_PORT || 3000}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
