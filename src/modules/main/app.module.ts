import { MiddlewareConsumer, Module, ModuleMetadata, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import path from 'path';
import { AdminAuthModule } from '@modules/admin/auth/auth.module';
import { AdminUserModule } from '@modules/admin/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { CommonModule } from '@modules/common/common.module';
import { LanguageModule } from '@modules/language/language.module';
import { RoleModule } from '@modules/role/role.module';
import { UserModule } from '@modules/user/user.module';
import { LoggerMiddleware } from '@utils/logger/logger.middleware';
import { LoggerModule } from '@utils/logger/logger.module';
import { SeedModule } from '@utils/seeder/seeder.module';
import { AppService } from './app.service';

/**
 * Admin-facing modules. Kept separate so `/docs/admin` documents exactly the
 * admin surface and `/docs` exactly the client surface.
 */
export const adminModulesImports: ModuleMetadata['imports'] = [AdminAuthModule, AdminUserModule];

/** Infrastructure + client-facing modules. */
export const imports: ModuleMetadata['imports'] = [
  ConfigModule.forRoot({ envFilePath: [AppService.envConfiguration()], isGlobal: true }),
  TypeOrmModule.forRoot(AppService.typeormConfig()),
  I18nModule.forRoot({
    fallbackLanguage: process.env.FALLBACK_LANGUAGE || 'en-us',
    loaderOptions: {
      path: path.join(__dirname, '../../', '/i18n/'),
      watch: true,
    },
    resolvers: [{ use: QueryResolver, options: ['lang'] }, new AcceptLanguageResolver()],
  }),
  LoggerModule,
  CommonModule,
  SeedModule,
  RoleModule,
  AuthModule,
  UserModule,
  LanguageModule,
];

@Module({
  imports: [...imports, ...adminModulesImports],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
