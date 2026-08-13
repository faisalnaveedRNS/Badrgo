import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TrimStringsPipe } from '@common/transformer/trim-strings.pipe';
import { AppModule } from '@modules/main/app.module';
import { UserRoles } from '@utils/enum';
import { AuthToken } from '@utils/jwt';
import { LoggerService } from '@utils/logger/logger.service';
import { SeedService } from '@modules/seeder/seeder.service';
import { Helper } from './abstract-helper';

export const TEST_USER = { email: 'e2e.user@example.com', password: 'Passw0rd!' };

/**
 * Boots the real application the same way `main.ts` does, so the pipes, the
 * exception filter and the response envelope under test are the production ones.
 */
export const createTestApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication();
  const logger = await app.resolve(LoggerService);

  app.useLogger(logger);
  app.useGlobalPipes(new TrimStringsPipe(), new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  await app.init();
  return app;
};

export class AppHelper extends Helper {
  public userToken: string;

  /**
   * An admin-role token, signed locally. There is no admin account to log in
   * with — the back office lives behind the gateway — but the role boundary on
   * these routes still needs proving.
   */
  public adminToken: string = AuthToken.generate({ user: { id: '00000000-0000-4000-8000-000000000000', email: 'admin@badrgo.dev', role: UserRoles.ADMIN } });

  constructor(app: INestApplication) {
    super(app);
  }

  /**
   * Seeds the roles, then registers and logs in one user.
   */
  public async init(): Promise<void> {
    await this.truncateAll();
    await this.app.get(SeedService).seedData();
    this.userToken = await this.registerUser(TEST_USER.email, TEST_USER.password);
  }

  public async registerUser(email: string, password: string): Promise<string> {
    const response = await request(this.app.getHttpServer()).post('/auth/register').send({ email, password });

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.token).toBeDefined();
    return response.body.token;
  }

  public async loginUser(email: string, password: string) {
    return request(this.app.getHttpServer()).post('/auth/login').send({ email, password });
  }

  public authed(token: string) {
    return { Authorization: `Bearer ${token}` };
  }
}
