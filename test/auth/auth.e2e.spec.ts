import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ResponseCode, ResponseMessage } from '../../src/utils/enum';
import { AppHelper, createTestApp, TEST_USER } from '../app.helper';

let app: INestApplication;
let helper: AppHelper;

beforeAll(async () => {
  app = await createTestApp();
  helper = new AppHelper(app);
  await helper.init();
});

afterAll(async () => {
  await helper.afterAll();
});

describe('POST /auth/register', () => {
  it('registers a user and returns a token', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register').send({ email: 'fresh.user@example.com', password: 'Passw0rd!' });

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.statusCode).toBe(ResponseCode.SUCCESS);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('fresh.user@example.com');
    expect(response.body.user.password).toBeUndefined();
  });

  it('rejects a duplicate email with the USER_ALREADY_EXISTS code', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register').send(TEST_USER);

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.USER_ALREADY_EXISTS);
    expect(response.body.message).toBe(ResponseMessage.USER_ALREADY_EXISTS);
  });

  it('reports validation failures through the INVALID_INPUT envelope', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register').send({ email: 'not-an-email', password: 'weak' });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INVALID_INPUT);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });
});

describe('POST /auth/login', () => {
  it('logs a registered user in', async () => {
    const response = await helper.loginUser(TEST_USER.email, TEST_USER.password);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.token).toBeDefined();
  });

  it('rejects a wrong password', async () => {
    const response = await helper.loginUser(TEST_USER.email, 'Wrong@12345');

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INVALID_CREDENTIALS);
  });
});
