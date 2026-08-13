import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ResponseCode } from '@utils/enum';
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

describe('GET /user/me', () => {
  it('returns the authenticated profile', async () => {
    const response = await request(app.getHttpServer()).get('/user/me').set(helper.authed(helper.userToken));

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data.email).toBe(TEST_USER.email);
  });

  it('rejects a request without a token', async () => {
    const response = await request(app.getHttpServer()).get('/user/me');

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('rejects an admin token on a user-only route', async () => {
    const response = await request(app.getHttpServer()).get('/user/me').set(helper.authed(helper.adminToken));

    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
  });
});

describe('PATCH /user/me', () => {
  it('updates the profile', async () => {
    const response = await request(app.getHttpServer()).patch('/user/me').set(helper.authed(helper.userToken)).send({ firstName: 'John', lastName: 'Doe' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data.firstName).toBe('John');
  });
});

describe('PATCH /user/change-password', () => {
  it('rejects a wrong current password', async () => {
    const response = await request(app.getHttpServer())
      .patch('/user/change-password')
      .set(helper.authed(helper.userToken))
      .send({ currentPassword: 'Wrong@12345', newPassword: 'Newpassw0rd!' });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INCORRECT_CURRENT_PASSWORD);
  });

  it('changes the password and lets the user log in with it', async () => {
    const response = await request(app.getHttpServer())
      .patch('/user/change-password')
      .set(helper.authed(helper.userToken))
      .send({ currentPassword: TEST_USER.password, newPassword: 'Newpassw0rd!' });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const login = await helper.loginUser(TEST_USER.email, 'Newpassw0rd!');
    expect(login.statusCode).toBe(HttpStatus.OK);
  });
});
