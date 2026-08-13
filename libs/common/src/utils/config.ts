import { DataSourceOptions, EntitySchema, MixedList } from 'typeorm';
import path from 'path';
import { NodeEnv } from '@utils/enum';
import { SnakeNamingStrategy } from '@utils/naming-strategy';

/** Absolute path to the shared translation catalogues, identical in src and dist. */
export const I18N_PATH = path.join(__dirname, '../', 'i18n/');

/**
 * Configuration shared by every app in the monorepo. Each service passes its
 * own database name and entity list, so services never see one another's tables.
 */
export class AppConfig {
  static typeorm(database: string, entities: MixedList<string | (new () => any) | EntitySchema<any>>): DataSourceOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database,
      entities,
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
