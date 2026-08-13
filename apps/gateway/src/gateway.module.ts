import { MiddlewareConsumer, Module, ModuleMetadata, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { CommonModule } from '@common/common.module';
import { RedisModule } from '@cache/index';
import { AppConfig, I18N_PATH } from '@utils/config';
import { LoggerMiddleware } from '@utils/logger/logger.middleware';
import { LoggerModule } from '@utils/logger/logger.module';
import { ServiceClientModule } from './modules/client/client.module';
import { HealthModule } from './modules/health/health.module';
import { GatewayReportModule } from './modules/report/report.module';
import { GatewayWalletModule } from './modules/wallet/wallet.module';

/**
 * Back office surface — documented at `/docs/admin`.
 */
export const adminModulesImports: ModuleMetadata['imports'] = [GatewayReportModule];

/**
 * Client surface — documented at `/docs`.
 *
 * The gateway holds no entities and opens no database connection: it
 * authenticates, rate limits, caches, and forwards to the services that do.
 */
export const imports: ModuleMetadata['imports'] = [
  ConfigModule.forRoot({ envFilePath: [AppConfig.envConfiguration()], isGlobal: true }),
  I18nModule.forRoot({
    fallbackLanguage: process.env.FALLBACK_LANGUAGE || 'en-us',
    loaderOptions: { path: I18N_PATH, watch: true },
    resolvers: [{ use: QueryResolver, options: ['lang'] }, new AcceptLanguageResolver()],
  }),
  LoggerModule,
  CommonModule,
  RedisModule,
  ServiceClientModule,
  HealthModule,
  GatewayWalletModule,
];

@Module({
  imports: [...imports, ...adminModulesImports],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
