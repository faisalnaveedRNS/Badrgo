import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TrimStringsPipe } from '@common/transformer/trim-strings.pipe';
import { AppModule } from '@modules/main/app.module';
import { LoggerService } from '@utils/logger/logger.service';
import { SeedService } from '@modules/seeder/seeder.service';
import { Helper } from './abstract-helper';

export const TEST_USER = { email: 'e2e.user@example.com', password: 'Passw0rd!' };
export const TEST_ADMIN = { email: process.env.SUPER_ADMIN_EMAIL || 'admin@badrgo.dev', password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@12345' };

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
  public adminToken: string;

  constructor(app: INestApplication) {
    super(app);
  }

  /**
   * Seeds roles + super admin, then logs in one user and one admin.
   */
  public async init(): Promise<void> {
    await this.truncateAll();
    await this.app.get(SeedService).seedData();
    this.userToken = await this.registerUser(TEST_USER.email, TEST_USER.password);
    this.adminToken = await this.loginAdmin(TEST_ADMIN.email, TEST_ADMIN.password);
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

  public async loginAdmin(email: string, password: string): Promise<string> {
    const response = await request(this.app.getHttpServer()).post('/admin/auth/login').send({ email, password });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.token).toBeDefined();
    return response.body.token;
  }

  public authed(token: string) {
    return { Authorization: `Bearer ${token}` };
  }
}
