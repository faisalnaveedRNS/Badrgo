import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ResponseCode, ResponseMessage, UserRoles } from '@utils/enum';
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

  it('rejects a tampered token with 401 rather than 500', async () => {
    const response = await request(app.getHttpServer())
      .get('/user/me')
      .set(helper.authed(`${helper.userToken.slice(0, -1)}X`));

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.message).toBe(ResponseMessage.INVALID_TOKEN);
  });

  it('serves the profile from the view, with the role flattened and no password', async () => {
    const response = await request(app.getHttpServer()).get('/user/me').set(helper.authed(helper.userToken));

    expect(response.body.data.roleName).toBe(UserRoles.USER);
    expect(response.body.data).toHaveProperty('fullName');
    expect(response.body.data.password).toBeUndefined();
    expect(response.body.data.role).toBeUndefined();
  });
});

describe('PATCH /user/me', () => {
  it('updates the profile', async () => {
    const response = await request(app.getHttpServer()).patch('/user/me').set(helper.authed(helper.userToken)).send({ firstName: 'John', lastName: 'Doe' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data.firstName).toBe('John');
  });

  it('returns the same shape as the GET, computed by the view', async () => {
    const response = await request(app.getHttpServer()).patch('/user/me').set(helper.authed(helper.userToken)).send({ firstName: 'Jane', lastName: 'Roe' });

    expect(response.body.data.fullName).toBe('Jane Roe');
    expect(response.body.data.roleName).toBe(UserRoles.USER);
  });

  it('ignores fields the DTO does not allow', async () => {
    const response = await request(app.getHttpServer()).patch('/user/me').set(helper.authed(helper.userToken)).send({ firstName: 'Jane', status: 'blocked' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data.status).not.toBe('blocked');
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
