import { HttpStatus } from '@nestjs/common';
import { EStatus, ResponseCode, ResponseMessage, UserRoles } from '@utils/enum';
import { GatewayHelper } from '../gateway.helper';

let helper: GatewayHelper;
let userId: string;
let token: string;

beforeAll(async () => {
  helper = await GatewayHelper.boot();
  userId = GatewayHelper.uuid();
  token = GatewayHelper.tokenFor(userId);
});

afterAll(async () => {
  await helper.afterAll();
});

describe('POST /wallet', () => {
  it('opens a wallet for the authenticated user', async () => {
    const response = await helper.createWallet(token, 'PKR');

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.data.userId).toBe(userId);
    expect(response.body.data.currency).toBe('PKR');
    expect(response.body.data.status).toBe(EStatus.ACTIVE);
    expect(response.body.data.balance).toBe('0.00000000');
  });

  it('takes the owner from the token, not the body', async () => {
    const other = GatewayHelper.uuid();
    const response = await helper.http().post('/wallet').set(helper.authed(token)).send({ currency: 'USD', userId: other });

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.data.userId).toBe(userId);
    expect(response.body.data.userId).not.toBe(other);
  });

  it('rejects a second wallet in the same currency', async () => {
    const response = await helper.createWallet(token, 'PKR');

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.WALLET_ALREADY_EXISTS);
    expect(response.body.message).toBe(ResponseMessage.WALLET_ALREADY_EXISTS);
  });

  it('rejects an unknown currency code', async () => {
    const response = await helper.createWallet(token, 'XXXXX');

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INVALID_INPUT);
  });

  it('rejects a request without a token', async () => {
    const response = await helper.http().post('/wallet').send({ currency: 'PKR' });

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('rejects an admin token on a user-only route', async () => {
    const response = await helper.createWallet(GatewayHelper.tokenFor(GatewayHelper.uuid(), UserRoles.ADMIN));

    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it('rejects a tampered token with 401, not 500', async () => {
    const response = await helper
      .http()
      .get('/wallet')
      .set(helper.authed(`${token.slice(0, -1)}X`));

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });
});

describe('GET /wallet', () => {
  it('lists only the wallets of the caller', async () => {
    const stranger = GatewayHelper.tokenFor(GatewayHelper.uuid());
    await helper.createWallet(stranger, 'PKR');

    const response = await helper.http().get('/wallet').set(helper.authed(token));

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data.length).toBe(2); // PKR + USD, not the stranger's
    expect(response.body.data.every((wallet: { userId: string }) => wallet.userId === userId)).toBe(true);
  });
});

describe('GET /wallet/:id', () => {
  it('returns the wallet with its ledger aggregates from the view', async () => {
    const created = await helper.createWallet(GatewayHelper.tokenFor(GatewayHelper.uuid()), 'PKR');
    const owner = created.body.data.userId;
    const ownerToken = GatewayHelper.tokenFor(owner);

    await helper.credit(ownerToken, created.body.data.id, '300.00');
    const response = await helper.http().get(`/wallet/${created.body.data.id}`).set(helper.authed(ownerToken));

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data.balance).toBe('300.00000000');
    expect(response.body.data.transactionCount).toBe(1);
    expect(response.body.data.totalCredited).toBe('300.00000000');
    expect(response.body.data.totalDebited).toBe('0.00000000');
    // The view reconciles the stored balance against the posted ledger.
    expect(response.body.data.balanceDrift).toBe('0.00000000');
  });

  it('reports a wallet that belongs to someone else as not found', async () => {
    const mine = await helper.createWallet(GatewayHelper.tokenFor(GatewayHelper.uuid()), 'PKR');
    const response = await helper.http().get(`/wallet/${mine.body.data.id}`).set(helper.authed(token));

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.WALLET_NOT_FOUND);
  });

  it('reports an unknown wallet as not found', async () => {
    const response = await helper.http().get(`/wallet/${GatewayHelper.uuid()}`).set(helper.authed(token));

    expect(response.body.statusCode).toBe(ResponseCode.WALLET_NOT_FOUND);
  });

  it('rejects a malformed uuid path param', async () => {
    const response = await helper.http().get('/wallet/not-a-uuid').set(helper.authed(token));

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INVALID_INPUT);
  });
});
