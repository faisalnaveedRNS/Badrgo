import { INestApplication, INestMicroservice, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TrimStringsPipe } from '@common/transformer/trim-strings.pipe';
import { UserRoles } from '@utils/enum';
import { AuthToken } from '@utils/jwt';
import { LoggerService } from '@utils/logger/logger.service';
import { GatewayModule } from '@gateway/gateway.module';
import { AppModule } from '@modules/main/app.module';
import { SeedService } from '@modules/seeder/seeder.service';
import { WalletServiceModule } from '@wallet/wallet.module';

/**
 * Boots the two processes a wallet request actually travels through: the
 * gateway (HTTP, where the token is verified) and the wallet service (TCP,
 * where money moves). Nothing is stubbed — the call really crosses the wire, so
 * these specs would catch a broken message pattern or a lost exception code.
 */
export class GatewayHelper {
  public userService?: INestMicroservice;
  public userDataSource?: DataSource;

  private constructor(
    public readonly app: INestApplication,
    public readonly walletService: INestMicroservice,
    public readonly walletDataSource: DataSource,
  ) {}

  /**
   * `withUserService` also boots the user service on its TCP port, which the
   * gateway needs for the auth and profile routes.
   */
  static async boot(options: { withUserService?: boolean } = {}): Promise<GatewayHelper> {
    const walletRef = await Test.createTestingModule({ imports: [WalletServiceModule] }).compile();
    const walletService = walletRef.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: +(process.env.WALLET_SERVICE_PORT || 4102) },
    });
    walletService.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await walletService.listen();

    const gatewayRef = await Test.createTestingModule({ imports: [GatewayModule] }).compile();
    const app = gatewayRef.createNestApplication();
    const logger = await app.resolve(LoggerService);

    app.useLogger(logger);
    app.useGlobalPipes(new TrimStringsPipe(), new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter(logger));
    await app.init();

    const helper = new GatewayHelper(app, walletService, walletRef.get(DataSource));

    if (options.withUserService) {
      const userRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
      helper.userService = userRef.createNestMicroservice<MicroserviceOptions>({
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: +(process.env.USER_SERVICE_PORT || 4101) },
      });
      helper.userService.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await helper.userService.listen();

      helper.userDataSource = userRef.get(DataSource);
      await helper.truncateUsers();
      await userRef.get(SeedService).seedData();
    }

    await helper.truncate();
    return helper;
  }

  /**
   * Signs a token the same way the user service does. The wallet service never
   * loads the user, so a spec can mint an identity without booting a third app.
   */
  static tokenFor(userId: string, role: UserRoles = UserRoles.USER): string {
    return AuthToken.generate({ user: { id: userId, email: `${userId}@example.com`, role } });
  }

  static uuid(): string {
    return crypto.randomUUID();
  }

  authed(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  http() {
    return request(this.app.getHttpServer());
  }

  /** Wipes the wallet tables (never the views) between suites. */
  async truncate(): Promise<void> {
    const tables = this.walletDataSource.entityMetadatas
      .filter((entity) => entity.tableType === 'regular')
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    if (tables) await this.walletDataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE;`);
  }

  /** Wipes the user service tables, leaving the seeded roles to be re-created. */
  async truncateUsers(): Promise<void> {
    if (!this.userDataSource) return;

    const tables = this.userDataSource.entityMetadatas
      .filter((entity) => entity.tableType === 'regular')
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    if (tables) await this.userDataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE;`);
  }

  async afterAll(): Promise<void> {
    await this.truncate();
    await this.truncateUsers();
    await this.app.close();
    await this.walletService.close();
    await this.userService?.close();
  }

  // --- fixtures -------------------------------------------------------------

  async createWallet(token: string, currency = 'PKR') {
    return this.http().post('/wallet').set(this.authed(token)).send({ currency });
  }

  async credit(token: string, walletId: string, amount: string, overrides: Record<string, unknown> = {}) {
    return this.http()
      .post(`/wallet/${walletId}/credit`)
      .set(this.authed(token))
      .send({ amount, currency: 'PKR', reference: `ref_${GatewayHelper.uuid()}`, idempotencyKey: GatewayHelper.uuid(), ...overrides });
  }

  async debit(token: string, walletId: string, amount: string, overrides: Record<string, unknown> = {}) {
    return this.http()
      .post(`/wallet/${walletId}/debit`)
      .set(this.authed(token))
      .send({ amount, currency: 'PKR', reference: `ref_${GatewayHelper.uuid()}`, idempotencyKey: GatewayHelper.uuid(), ...overrides });
  }

  /** Rows the wallet service wrote to its outbox, newest last. */
  async outboxEvents(aggregateId: string): Promise<{ event_type: string; aggregate_type: string }[]> {
    return this.walletDataSource.query('SELECT event_type, aggregate_type FROM outbox_events WHERE aggregate_id = $1 ORDER BY created_at', [aggregateId]);
  }
}
