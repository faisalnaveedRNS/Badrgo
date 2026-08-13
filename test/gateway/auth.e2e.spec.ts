import { HttpStatus } from '@nestjs/common';
import { ResponseCode, ResponseMessage, UserRoles } from '@utils/enum';
import { GatewayHelper } from '../gateway.helper';

/**
 * The gateway's public surface, exercised across the real TCP hop to the user
 * service. A broken message pattern or a domain code lost in transit fails here.
 */
let helper: GatewayHelper;

const CREDENTIALS = { email: 'gateway.user@example.com', password: 'Passw0rd!' };

beforeAll(async () => {
  helper = await GatewayHelper.boot({ withUserService: true });
});

afterAll(async () => {
  await helper.afterAll();
});

describe('GET /health', () => {
  it('reports the gateway as live without a token', async () => {
    const response = await helper.http().get('/health');

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('gateway');
  });
});

describe('POST /auth/register', () => {
  it('registers a user and returns a token', async () => {
    const response = await helper.http().post('/auth/register').send(CREDENTIALS);

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(CREDENTIALS.email);
    expect(response.body.user.roleName).toBe(UserRoles.USER);
    expect(response.body.user.password).toBeUndefined();
  });

  it('rejects a duplicate email, carrying the domain code across the hop', async () => {
    const response = await helper.http().post('/auth/register').send(CREDENTIALS);

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.USER_ALREADY_EXISTS);
    expect(response.body.message).toBe(ResponseMessage.USER_ALREADY_EXISTS);
  });

  it('rejects a weak password before the call is made', async () => {
    const response = await helper.http().post('/auth/register').send({ email: 'weak@example.com', password: 'abc' });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INVALID_INPUT);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects a malformed email', async () => {
    const response = await helper.http().post('/auth/register').send({ email: 'not-an-email', password: 'Passw0rd!' });

    expect(response.body.statusCode).toBe(ResponseCode.INVALID_INPUT);
  });
});

describe('POST /auth/login', () => {
  it('logs a registered user in', async () => {
    const response = await helper.http().post('/auth/login').send(CREDENTIALS);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(CREDENTIALS.email);
  });

  it('rejects a wrong password', async () => {
    const response = await helper
      .http()
      .post('/auth/login')
      .send({ ...CREDENTIALS, password: 'Wrong0rd!' });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INVALID_CREDENTIALS);
  });

  it('answers an unknown email exactly as a wrong password, so accounts cannot be enumerated', async () => {
    const unknown = await helper.http().post('/auth/login').send({ email: 'nobody@example.com', password: 'Passw0rd!' });
    const wrong = await helper
      .http()
      .post('/auth/login')
      .send({ ...CREDENTIALS, password: 'Wrong0rd!' });

    expect(unknown.body).toEqual(wrong.body);
  });
});

describe('GET /user/me', () => {
  it('returns the profile of the token holder', async () => {
    const login = await helper.http().post('/auth/login').send(CREDENTIALS);
    const response = await helper.http().get('/user/me').set(helper.authed(login.body.token));

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data.email).toBe(CREDENTIALS.email);
    expect(response.body.data.roleName).toBe(UserRoles.USER);
    expect(response.body.data.password).toBeUndefined();
  });

  it('rejects a request without a token', async () => {
    const response = await helper.http().get('/user/me');

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('rejects a tampered token with 401 rather than 500', async () => {
    const login = await helper.http().post('/auth/login').send(CREDENTIALS);
    const response = await helper
      .http()
      .get('/user/me')
      .set(helper.authed(`${login.body.token.slice(0, -1)}X`));

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.message).toBe(ResponseMessage.INVALID_TOKEN);
  });

  it('rejects a syntactically invalid token', async () => {
    const response = await helper.http().get('/user/me').set(helper.authed('not-a-jwt'));

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('rejects an admin token on a user-only route', async () => {
    const response = await helper
      .http()
      .get('/user/me')
      .set(helper.authed(GatewayHelper.tokenFor(GatewayHelper.uuid(), UserRoles.ADMIN)));

    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it('reports a token for a deleted user as USER_NOT_FOUND', async () => {
    const response = await helper
      .http()
      .get('/user/me')
      .set(helper.authed(GatewayHelper.tokenFor(GatewayHelper.uuid())));

    expect(response.body.statusCode).toBe(ResponseCode.USER_NOT_FOUND);
  });
});
