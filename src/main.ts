/* eslint-disable no-console */
import 'reflect-metadata';
import { INestApplication, ModuleMetadata, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import compression from 'compression';
import express from 'express';
import { HttpExceptionFilter } from '@modules/common/filters/http-exception.filter';
import { TrimStringsPipe } from '@modules/common/transformer/trim-strings.pipe';
import { adminModulesImports, AppModule, imports } from '@modules/main/app.module';
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

  // Lets custom class-validator constraints inject providers.
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  swaggerDoc(app, imports, 'docs', 'Client API', 'Endpoints consumed by the end-user application');
  swaggerDoc(app, adminModulesImports, 'docs/admin', 'Admin API', 'Endpoints consumed by the back office');

  await app.listen(process.env.APP_PORT || 3000);
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
  .then(() => console.log(`Server started on ${process.env.APP_PORT || 3000}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
