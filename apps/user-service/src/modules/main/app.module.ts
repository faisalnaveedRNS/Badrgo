import { MiddlewareConsumer, Module, ModuleMetadata, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { AuthModule } from '@modules/auth/auth.module';
import { CommonModule } from '@common/common.module';
import { LanguageModule } from '@modules/language/language.module';
import { RoleModule } from '@modules/role/role.module';
import { UserModule } from '@modules/user/user.module';
import { I18N_PATH } from '@utils/config';
import { LoggerMiddleware } from '@utils/logger/logger.middleware';
import { LoggerModule } from '@utils/logger/logger.module';
import { SeedModule } from '@modules/seeder/seeder.module';
import { AppService } from './app.service';

/** Infrastructure + client-facing modules. The back office lives in the gateway. */
export const imports: ModuleMetadata['imports'] = [
  ConfigModule.forRoot({ envFilePath: [AppService.envConfiguration()], isGlobal: true }),
  TypeOrmModule.forRoot(AppService.typeormConfig()),
  I18nModule.forRoot({
    fallbackLanguage: process.env.FALLBACK_LANGUAGE || 'en-us',
    loaderOptions: {
      path: I18N_PATH,
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
  imports,
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
