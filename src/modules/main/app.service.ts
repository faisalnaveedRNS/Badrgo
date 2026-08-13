import { Injectable } from '@nestjs/common';
import { DataSourceOptions } from 'typeorm';
import { NodeEnv } from '@utils/enum';
import { SnakeNamingStrategy } from '@utils/naming-strategy';

@Injectable()
export class AppService {
  static typeormConfig(): DataSourceOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNC === 'true',
      logging: process.env.DB_LOGGING === 'true',
      namingStrategy: new SnakeNamingStrategy(),
      extra: { max: 100 },
    };
  }

  /**
   * Picks the env file per environment so the test suite never reads .env.
   */
  static envConfiguration(): string {
    return (process.env.NODE_ENV as NodeEnv) === NodeEnv.TEST ? `_${NodeEnv.TEST}.env` : '.env';
  }

  static startup() {
    process
      // eslint-disable-next-line no-console
      .on('unhandledRejection', (reason) => console.error('Unhandled rejection at promise', reason))
      .on('uncaughtException', (err) => {
        // eslint-disable-next-line no-console
        console.error(err, 'Uncaught exception thrown');
        process.exit(1);
      });
  }
}
