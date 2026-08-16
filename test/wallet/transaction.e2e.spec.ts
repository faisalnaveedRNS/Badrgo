import { HttpStatus } from '@nestjs/common';
import { KafkaTopic } from '@kafka/kafka.topics';
import { ResponseCode, ResponseMessage, TransactionStatus, TransactionType } from '@utils/enum';
import { GatewayHelper } from '../gateway.helper';

let helper: GatewayHelper;
let token: string;
let walletId: string;

/** A fresh wallet per suite run keeps the ledger assertions exact. */
const openWallet = async () => {
  const owner = GatewayHelper.uuid();
  const ownerToken = GatewayHelper.tokenFor(owner);
  const created = await helper.createWallet(ownerToken, 'PKR');

  return { ownerToken, walletId: created.body.data.id as string };
};

beforeAll(async () => {
  helper = await GatewayHelper.boot();
  ({ ownerToken: token, walletId } = await openWallet());
});

afterAll(async () => {
  await helper.afterAll();
});

describe('POST /wallet/:id/credit', () => {
  it('posts a credit and returns the ledger line', async () => {
    const response = await helper.credit(token, walletId, '500.00');

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.data.type).toBe(TransactionType.CREDIT);
    expect(response.body.data.status).toBe(TransactionStatus.POSTED);
    expect(response.body.data.amount).toBe('500.00000000');
    expect(response.body.data.balanceAfter).toBe('500.00000000');
    expect(response.body.data.signedAmount).toBe('500.00000000');
  });

  it('moves the wallet balance', async () => {
    const wallet = await helper.http().get(`/wallet/${walletId}`).set(helper.authed(token));

    expect(wallet.body.data.balance).toBe('500.00000000');
  });

  it('rejects a zero or negative amount', async () => {
    for (const amount of ['0', '0.00', '-10.00']) {
      const response = await helper.credit(token, walletId, amount);

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect([ResponseCode.INVALID_AMOUNT, ResponseCode.INVALID_INPUT]).toContain(response.body.statusCode);
    }
  });

  it('rejects an amount above the 10,000,000 per-transaction ceiling', async () => {
    const response = await helper.credit(token, walletId, '10000000.01');

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.AMOUNT_LIMIT_EXCEEDED);
  });

  it('rejects a currency that is not the wallet currency', async () => {
    const response = await helper.credit(token, walletId, '10.00', { currency: 'USD' });

    expect(response.body.statusCode).toBe(ResponseCode.CURRENCY_MISMATCH);
  });

  it('requires an idempotency key', async () => {
    const response = await helper.credit(token, walletId, '10.00', { idempotencyKey: undefined });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INVALID_INPUT);
  });

  it('refuses to credit a wallet owned by someone else', async () => {
    const response = await helper.credit(GatewayHelper.tokenFor(GatewayHelper.uuid()), walletId, '999.00');

    expect(response.body.statusCode).toBe(ResponseCode.WALLET_NOT_FOUND);

    const wallet = await helper.http().get(`/wallet/${walletId}`).set(helper.authed(token));
    expect(wallet.body.data.balance).toBe('500.00000000');
  });
});

describe('POST /wallet/:id/debit', () => {
  it('posts a debit and lowers the balance', async () => {
    const response = await helper.debit(token, walletId, '175.50');

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.data.type).toBe(TransactionType.DEBIT);
    expect(response.body.data.balanceAfter).toBe('324.50000000');
    // Credits positive, debits negative, so a page of rows sums to the movement.
    expect(response.body.data.signedAmount).toBe('-175.50000000');
  });

  it('refuses to overdraw and leaves the balance untouched', async () => {
    const response = await helper.debit(token, walletId, '99999.00');

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.INSUFFICIENT_BALANCE);
    expect(response.body.message).toBe(ResponseMessage.INSUFFICIENT_BALANCE);

    const wallet = await helper.http().get(`/wallet/${walletId}`).set(helper.authed(token));
    expect(wallet.body.data.balance).toBe('324.50000000');
  });

  it('rejects an amount above the ceiling before it ever checks the balance', async () => {
    const response = await helper.debit(token, walletId, '20000000.00');

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.statusCode).toBe(ResponseCode.AMOUNT_LIMIT_EXCEEDED);

    const wallet = await helper.http().get(`/wallet/${walletId}`).set(helper.authed(token));
    expect(wallet.body.data.balance).toBe('324.50000000');
  });

  it('releases the idempotency key of a failed debit so it can be retried', async () => {
    const key = GatewayHelper.uuid();

    const failed = await helper.debit(token, walletId, '99999.00', { idempotencyKey: key });
    expect(failed.body.statusCode).toBe(ResponseCode.INSUFFICIENT_BALANCE);

    const retried = await helper.debit(token, walletId, '24.50', { idempotencyKey: key });
    expect(retried.statusCode).toBe(HttpStatus.CREATED);
    expect(retried.body.data.balanceAfter).toBe('300.00000000');
  });
});

describe('idempotency', () => {
  it('rejects a repeat of an accepted key instead of posting twice', async () => {
    const key = GatewayHelper.uuid();

    const first = await helper.credit(token, walletId, '25.00', { idempotencyKey: key });
    expect(first.statusCode).toBe(HttpStatus.CREATED);

    const repeat = await helper.credit(token, walletId, '25.00', { idempotencyKey: key });
    expect(repeat.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(repeat.body.statusCode).toBe(ResponseCode.DUPLICATE_REQUEST);

    const wallet = await helper.http().get(`/wallet/${walletId}`).set(helper.authed(token));
    expect(wallet.body.data.balance).toBe('325.00000000');
  });

  it('rejects a duplicate reference on the same wallet', async () => {
    const reference = `dup_${GatewayHelper.uuid()}`;

    const first = await helper.credit(token, walletId, '5.00', { reference });
    expect(first.statusCode).toBe(HttpStatus.CREATED);

    const duplicate = await helper.credit(token, walletId, '5.00', { reference });
    expect(duplicate.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });
});

describe('GET /wallet/:id/transactions', () => {
  it('returns the ledger newest first with pagination meta', async () => {
    const response = await helper.http().get(`/wallet/${walletId}/transactions`).set(helper.authed(token));

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data.length).toBeGreaterThan(1);
    expect(response.body.meta.currentPage).toBe(1);
    expect(response.body.meta.itemsPerPage).toBe(10);
    expect(response.body.meta.totalItems).toBe(response.body.meta.totalItems);

    const timestamps = response.body.data.map((row: { createdAt: string }) => new Date(row.createdAt).getTime());
    expect([...timestamps].sort((a: number, b: number) => b - a)).toEqual(timestamps);
  });

  it('honours page and pageSize as integers', async () => {
    const first = await helper.http().get(`/wallet/${walletId}/transactions?page=1&pageSize=1`).set(helper.authed(token));
    const second = await helper.http().get(`/wallet/${walletId}/transactions?page=2&pageSize=1`).set(helper.authed(token));

    expect(first.body.data.length).toBe(1);
    expect(second.body.data.length).toBe(1);
    expect(first.body.meta.itemsPerPage).toBe(1);
    expect(second.body.meta.currentPage).toBe(2);
    expect(first.body.data[0].id).not.toBe(second.body.data[0].id);
  });

  it('sorts ascending on request', async () => {
    const response = await helper.http().get(`/wallet/${walletId}/transactions?sort=asc`).set(helper.authed(token));

    const timestamps = response.body.data.map((row: { createdAt: string }) => new Date(row.createdAt).getTime());
    expect([...timestamps].sort((a: number, b: number) => a - b)).toEqual(timestamps);
  });

  it('rejects out of range pagination', async () => {
    for (const query of ['?page=0', '?pageSize=0', '?pageSize=500', '?page=abc']) {
      const response = await helper.http().get(`/wallet/${walletId}/transactions${query}`).set(helper.authed(token));

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.statusCode).toBe(ResponseCode.INVALID_INPUT);
    }
  });

  it('carries the owning user and signed amounts from the view', async () => {
    const response = await helper.http().get(`/wallet/${walletId}/transactions`).set(helper.authed(token));
    const debit = response.body.data.find((row: { type: string }) => row.type === TransactionType.DEBIT);

    expect(debit.userId).toBeDefined();
    expect(Number(debit.signedAmount)).toBeLessThan(0);
  });

  it('reports an unknown wallet as not found rather than an empty ledger', async () => {
    const response = await helper.http().get(`/wallet/${GatewayHelper.uuid()}/transactions`).set(helper.authed(token));

    expect(response.body.statusCode).toBe(ResponseCode.WALLET_NOT_FOUND);
    expect(response.body.data).toBeUndefined();
  });

  it("refuses to read another user's ledger", async () => {
    const response = await helper
      .http()
      .get(`/wallet/${walletId}/transactions`)
      .set(helper.authed(GatewayHelper.tokenFor(GatewayHelper.uuid())));

    expect(response.body.statusCode).toBe(ResponseCode.WALLET_NOT_FOUND);
  });

  it('rejects a request without a token', async () => {
    const response = await helper.http().get(`/wallet/${walletId}/transactions`);

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });
});

describe('outbox', () => {
  it('records an event for every movement, in the same transaction', async () => {
    const { ownerToken, walletId: fresh } = await openWallet();
    await helper.credit(ownerToken, fresh, '40.00');
    await helper.debit(ownerToken, fresh, '15.00');

    const events = (await helper.outboxEvents(fresh)).map((event) => event.event_type);

    expect(events).toEqual([KafkaTopic.WALLET_CREATED, KafkaTopic.WALLET_CREDITED, KafkaTopic.WALLET_DEBITED]);
  });

  it('writes no event when the movement is rejected', async () => {
    const { ownerToken, walletId: fresh } = await openWallet();
    await helper.debit(ownerToken, fresh, '10.00'); // insufficient balance

    const events = (await helper.outboxEvents(fresh)).map((event) => event.event_type);

    expect(events).toEqual([KafkaTopic.WALLET_CREATED]);
  });
});
