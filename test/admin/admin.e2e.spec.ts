import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EStatus, ResponseCode } from '../../src/utils/enum';
import { AppHelper, createTestApp, TEST_ADMIN, TEST_USER } from '../app.helper';

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

describe('POST /admin/auth/login', () => {
  it('logs the seeded super admin in', async () => {
    const response = await request(app.getHttpServer()).post('/admin/auth/login').send(TEST_ADMIN);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.token).toBeDefined();
  });

  it('rejects wrong admin credentials', async () => {
    const response = await request(app.getHttpServer()).post('/admin/auth/login').send({ email: TEST_ADMIN.email, password: 'Wrong@12345' });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INVALID_ADMIN_CREDENTIALS);
  });
});

describe('GET /admin/user', () => {
  it('returns a paginated user list', async () => {
    const response = await request(app.getHttpServer()).get('/admin/user?page=1&pageSize=10').set(helper.authed(helper.adminToken));

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta.currentPage).toBe(1);
    expect(response.body.meta.totalItems).toBeGreaterThan(0);
  });

  it('rejects a user token on an admin route', async () => {
    const response = await request(app.getHttpServer()).get('/admin/user').set(helper.authed(helper.userToken));

    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
  });
});

describe('PATCH /admin/user/:id/status', () => {
  it('blocks a user, who can then no longer log in', async () => {
    const list = await request(app.getHttpServer()).get(`/admin/user?search=${TEST_USER.email}`).set(helper.authed(helper.adminToken));
    const userId = list.body.data[0].id;

    const response = await request(app.getHttpServer()).patch(`/admin/user/${userId}/status`).set(helper.authed(helper.adminToken)).send({ status: EStatus.BLOCKED });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data.status).toBe(EStatus.BLOCKED);

    const login = await helper.loginUser(TEST_USER.email, TEST_USER.password);
    expect(login.body.statusCode).toBe(ResponseCode.INACTIVE_ACCOUNT);
  });

  it('rejects a malformed uuid path param', async () => {
    const response = await request(app.getHttpServer()).patch('/admin/user/not-a-uuid/status').set(helper.authed(helper.adminToken)).send({ status: EStatus.ACTIVE });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INVALID_INPUT);
  });
});
