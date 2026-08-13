import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Shared plumbing for e2e helpers: direct access to the DataSource for
 * fixtures/cleanup, plus a teardown that closes everything the suite opened.
 */
export abstract class Helper {
  public readonly dataSource: DataSource;

  protected constructor(public readonly app: INestApplication) {
    this.dataSource = app.get(DataSource);
  }

  /**
   * Wipes every table between suites so each spec file starts from a known state.
   */
  public async truncateAll(): Promise<void> {
    const tables = this.dataSource.entityMetadatas.map((entity) => `"${entity.tableName}"`).join(', ');
    if (tables) await this.dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE;`);
  }

  public async afterAll(): Promise<void> {
    await this.truncateAll();
    await this.app.close();
  }
}
