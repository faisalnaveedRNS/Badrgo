# Badrgo

A NestJS microservice platform: an API gateway fronting user, wallet and report services, wired together with TCP for synchronous calls and Kafka for domain events. It keeps the conventions of the original single-app blueprint — split admin/user surfaces, localization, one exception layer, a uniform response envelope, an e2e harness — and adds the money-movement pieces: a transactional outbox, idempotency keys, and a read-model projection.

## Architecture

```
                    Next.js Operations UI
                             │
                             ▼
                    ┌─────────────────┐
                    │   API Gateway   │  auth · rate limit · cache · Swagger
                    └────────┬────────┘
              TCP  ┌─────────┼─────────┐  TCP
                   ▼         ▼         ▼
              ┌────────┐ ┌────────┐ ┌────────┐
              │  User  │ │ Wallet │ │ Report │
              └────────┘ └───┬────┘ └───▲────┘
                             │          │
                        Postgres        │
                    wallet · transaction│
                    outbox · idempotency│
                             │          │
                          outbox        │ reads
                             ▼          │
                        ┌─────────┐     │
                        │  Kafka  │     │
                        │ wallet.*│     │
                        │ tx.*    │     │
                        └────┬────┘     │
                             │ Kafka engine table
                             ▼          │
                        ┌─────────────────┐
                        │   ClickHouse    │
                        │ wallet_events   │
                        │ balance view    │
                        └─────────────────┘

                     Redis: cache · rate limit · idempotency
```

Each service owns its database and no other service reads it. Synchronous
request/response goes over Nest's TCP transport; anything that fans out goes to
Kafka, written first to the producing service's outbox so state and event commit
together.

**Nothing in the application consumes Kafka.** ClickHouse subscribes to the
topics itself through a Kafka engine table and materializes the rows on arrival,
so the analytics store stays current without a consumer to deploy, scale or
restart.

## Stack

NestJS 11 · TypeORM 1 (Postgres 16) · Kafka (KRaft) · ClickHouse 24 · Redis 7 · JWT auth · nestjs-i18n · Swagger · Jest + Supertest

## Getting started

```bash
cp .env.example .env                 # then set JWT_SECRET_KEY
docker compose up -d                 # postgres + redis + kafka + clickhouse
npm install

npm run start:user                   # HTTP 3001 · TCP 4001
npm run start:wallet                 # TCP 4002
npm run start:report                 # HTTP 3003 (probes) · TCP 4003
npm run start:gateway                # HTTP 3000
```

Compose creates the per-service databases on first boot (`docker/postgres-init.sh`).
Kafka is reachable on `localhost:29092` from the host and `kafka:9092` inside the network.

- Client API docs: <http://localhost:3000/docs>
- Admin API docs: <http://localhost:3000/docs/admin>
- Global route prefix: `v1/api`
- Health: `/v1/api/health` (gateway), `/health/ready` (services, checks the database)

On first boot the user service seeds the three roles and the super admin from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`.

## Layout

```
apps/
  gateway/          the only public process — no database of its own
    modules/client/   TCP clients + `send()` (error translation, timeouts)
    modules/wallet/   HTTP surface over the wallet service
    modules/report/   admin HTTP surface over the report service
  user-service/     hybrid: keeps its HTTP surface, adds a TCP face
    modules/{auth,user,role,admin,language,seeder,main}
      user/views/       user_view      (role flattened, soft-deletes excluded)
      admin/admin/views/admin_view
  wallet-service/   pure TCP microservice, produces to Kafka via the outbox
    modules/{wallet,transaction,outbox,idempotency}
      wallet/views/       wallet_view      (ledger totals + balance drift)
      transaction/views/  transaction_view (signed amounts, owning user)
  report-service/   TCP queries only — ClickHouse does the consuming
    modules/{report}
      report/views/     report_view      (headline numbers lifted out of JSON)
libs/
  common/           response envelope, Exception layer, base entity, DTOs,
                    decorators, guards, filters (HTTP + RPC), i18n, config, utils
  common/contracts/ message patterns + DTOs shared by gateway and services
  kafka/            topics, event envelope, producer, consumer config
  redis/            cache service + idempotency store + rate limit guard
  clickhouse/       read-only client for the analytics store (`@analytics/*`)
test/               e2e harness + specs (run against the user service)
```

Path aliases: `@common/*` `@utils/*` `@contracts/*` `@models` `@response` (libs/common),
`@kafka/*` `@cache/*` (libs), `@modules/*` `@gateway/*` `@wallet/*` `@report/*` (apps).

## The conventions

### 1. Admin and user sides are separate surfaces

Each HTTP app (`gateway.module.ts`, `app.module.ts`) exports two arrays — `imports` (client) and `adminModulesImports` (back office). `main.ts` feeds each into its own Swagger document, so `/docs` and `/docs/admin` never leak one another's endpoints. Admin controllers live under `modules/admin/*` (or `modules/report/` in the gateway) and are routed under `admin/…`.

Both sides share one `AuthGuard` and one set of services; what differs is the controller and the required role:

```ts
@UseGuards(AuthGuard)
@HasRoles(UserRoles.ADMIN, UserRoles.SUPER_ADMIN)
@Controller('admin/user')
```

To add a module: create it under the app's `modules/`, register it in `imports` **or** `adminModulesImports`.

### 2. Response pattern

Every success payload extends `Response`, so each body carries `statusCode` + `message` alongside its data:

```jsonc
{ "statusCode": 200, "message": "Success", "data": { … } }              // UserResponse
{ "statusCode": 200, "message": "Success", "data": [ … ], "meta": { … } } // paginated
```

- `SuccessResponse` — acknowledgement with no payload
- `PaginatedResponse<T>` — pair with `paginationMeta()` from `@utils/helper`
- Controllers set the HTTP status explicitly via `@Res({ passthrough: true })` and return the response object.

Declare the shape on the route so Swagger stays truthful: `@ApiOkResponse({ type: UserResponse })`.

### 3. Exception layer

Domain errors are classes extending `Exception` (`@utils/helper`). Constructing one throws an `HttpException` whose HTTP status is 400 while the body carries an **application** code from `ResponseCode` (600+):

```ts
// user.exception.ts
export class UserNotFound extends Exception {
  constructor() { super(ResponseCode.USER_NOT_FOUND, ResponseMessage.USER_NOT_FOUND); }
}

// service
if (!user) new UserNotFound();
```

The `@ApiProperty` examples on those classes make them double as Swagger error types: `@ApiResponse({ status: ResponseCode.USER_NOT_FOUND, type: UserNotFound })`.

`HttpExceptionFilter` is the single exit point: it passes domain errors through, remaps `ValidationPipe` failures to `INVALID_INPUT` with the field errors under `errors`, and logs + masks anything unexpected as a 500.

```jsonc
{ "statusCode": 601, "message": "Invalid input", "errors": ["email must be an email"] }
```

New error → add a `ResponseCode` + `ResponseMessage` pair, then a class in the module's `*.exception.ts`.

### 4. Language (i18n)

`I18nModule` resolves the language from `?lang=` then `Accept-Language`, falling back to `FALLBACK_LANGUAGE`. Catalogues live in `libs/common/src/i18n/<locale>/<namespace>.json` and are copied into `dist` by `npm run build`.

```bash
curl 'localhost:3000/v1/api/language/welcome?name=Ali&lang=ur'
```

`LanguageService.translate('common.welcome', { name })` resolves against the current request's language — see `modules/language/` for the reference implementation. The `User` entity stores a per-user `language` for background jobs and notifications, where there is no request context.

### 5. Tests

`test/app.helper.ts` boots the **real** user-service `AppModule` with the same pipes and filter as `main.ts`, so specs exercise production behaviour rather than a stub. `Helper.truncateAll()` gives each suite a clean database, and `helper.init()` seeds roles + super admin and logs in one user and one admin.

```bash
createdb badrgo_test             # matches _test.env
npm test                         # e2e suites, serial
npm run test:cov
```

Specs are grouped per module (`test/<module>/<name>.e2e.spec.ts`) and cover the happy path, the domain-error code, and the authorization boundary — mirror that trio when adding a module.

### 6. Service boundaries

The gateway never touches a database. It authenticates, rate limits, caches, and
forwards:

```ts
const wallet = await send<WalletModel>(this.walletService, WalletPattern.CREATE, payload);
```

`send()` (`apps/gateway/src/modules/client/service.client.ts`) applies a timeout and
translates the failure: a domain error keeps its application `statusCode`, an
unreachable service becomes `SERVICE_UNAVAILABLE` (690) instead of a stack trace.

Domain codes survive the hop because each RPC controller carries
`@UseFilters(RpcAllExceptionsFilter)` — without it Nest flattens every error to
"Internal server error". In a hybrid app, bind handlers to their transport
(`@MessagePattern(p, Transport.TCP)`, `@EventPattern(t, Transport.KAFKA)`), or the
Kafka consumer will subscribe to your TCP patterns as topics.

Patterns and shared payload DTOs live in `libs/common/src/contracts/` so the two
sides of a call cannot drift.

### 7. Outbox, not dual write

The balance update, the ledger line and the event are one database transaction:

```ts
return this.dataSource.transaction(async (manager) => {
  const wallet = await manager.findOne(Wallet, { where: { id }, lock: { mode: 'pessimistic_write' } });
  // … update wallet, insert transaction …
  await this.outboxService.record(manager, KafkaTopic.WALLET_CREDITED, 'wallet', wallet.id, event);
});
```

`OutboxPublisher` polls `outbox_events` every `OUTBOX_POLL_MS` and ships them to
Kafka, retrying up to 10 attempts before marking a row FAILED. Delivery is
**at-least-once**, so consumers dedupe on `eventId` — `WalletProjection.lastEventId`
is how the report service does it.

Money moves through exactly one method (`WalletService.post`), under a pessimistic
row lock, with amounts held as `numeric(20,8)` strings end to end.

### 8. Idempotency (Redis)

Every money movement requires an `idempotencyKey`. The key is reserved in Redis
with a single atomic `SET NX` before anything moves; a key that is already held
means the transaction was already accepted, so the duplicate is **rejected**:

```bash
POST /v1/api/wallet/:id/credit  { "amount": "250.00", …, "idempotencyKey": "abc" }
# -> 200  transaction posted

POST /v1/api/wallet/:id/credit  { "amount": "250.00", …, "idempotencyKey": "abc" }
# -> { "statusCode": 666, "message": "A transaction with this idempotency key has already been accepted" }
```

The claim lives in Redis rather than Postgres: it is short-lived, sits on the hot
path of every transaction, and should not cost a write to the ledger database.
`SET NX` is atomic, so two concurrent requests carrying the same key can never
both win.

A **failed** operation releases its key — nothing was posted, so the caller is
entitled to retry with the same key. Successful ones hold the reservation for
`IDEMPOTENCY_TTL` (24h by default); after that the key is free again and a
request carrying it is a new transaction. The unique `reference` on the ledger
line is the second line of defence.

### 9. Reads go through views

Every module owns a `views/` directory of TypeORM `@ViewEntity` classes, and
**every GET reads from a view — never from the table repository**:

```ts
async findById(id: string): Promise<WalletView> {
  const wallet = await this.walletView.findOne({ where: { id } });   // view
  if (!wallet) new WalletNotFound();
  return wallet;
}
```

The repository is reserved for writes. `WalletService.post()` still locks and
updates the `wallets` row; the read path never touches it.

A view is where joins and aggregates belong, so a read is one indexed scan
instead of N+1 lazy loads:

| View | What it adds over the table |
|---|---|
| `user_view` / `admin_view` | role flattened to `roleName`, `fullName`, soft-deletes filtered out |
| `wallet_view` | `transactionCount`, `totalCredited`, `totalDebited`, `lastTransactionAt`, and `balanceDrift` — the stored balance minus the posted ledger sum, which should always be `0.00000000` |
| `transaction_view` | owning `userId`, and `signedAmount` (credits +, debits −) so a page sums without re-reading `type` |
| `report_view` | `walletCount` / `totalBalance` / `transactionCount` lifted out of the `result` JSON into sortable columns, plus `generationSeconds` |

Three rules that keep this consistent:

1. **Views are registered like entities** — in the module's `forFeature([...])`
   *and* in the app's `entities` array, or `synchronize` will not create them.
2. **Writes re-read the view before returning**, so a POST/PATCH response has the
   same shape as the GET for that resource. Responses declare the view as their
   Swagger type.
3. **Column names go through the snake_case naming strategy**, so a `netTokenAmount`
   property must be aliased `AS net_token_amount` in the SQL.

Changing a view's SQL is a schema change: `synchronize` drops and recreates it on
boot. Under migrations, that becomes an explicit `DROP VIEW` / `CREATE VIEW` pair —
and views must be dropped before the tables they depend on.

### 10. ClickHouse consumes Kafka, not the application

There is no `@EventPattern` handler anywhere. ClickHouse is the subscriber, wired
in `docker/clickhouse-init.sql`:

```
wallet.* / tx.*  ->  kafka_wallet_events   Kafka engine table (the consumer)
                 ->  wallet_events_mv      materialized view, parses the JSON
                 ->  wallet_events         ReplacingMergeTree, deduped
                 ->  wallet_balance_view   per-wallet aggregate
                 ->  wallet_report_view    the finished report, one row
```

**ClickHouse aggregates; the report service only stores the answer.** No total is
summed in application code — `wallet_report_view` is a parameterized view that
returns a single already-aggregated row:

```ts
const [summary] = await this.clickhouse.query<WalletSummaryRow>(
  `SELECT * FROM wallet_report_view(userId = {userId:String})`,
  { userId },
);
report.result = { wallets: Number(summary.wallets), totalBalance: summary.total_balance, ... };
```

Money stays `Decimal(38,8)` in the view; the client sets
`output_format_decimal_trailing_zeros` and `output_format_json_quote_decimals` so
it arrives as `"879.50000000"` — a string, never a JS float.

The engine table reads with `kafka_format = 'JSONAsString'`, so the whole message
lands in one column and parsing happens in the materialized view. A new field in
an event payload cannot break ingestion — it is simply not extracted yet.

**Redelivery is handled by the storage engine.** `wallet_events` is a
`ReplacingMergeTree` ordered by `(wallet_id, occurred_at, event_id)`, and
`wallet_balance_view` reads `FROM wallet_events FINAL`, so a duplicate delivery
collapses instead of double-counting a credit. This replaces the
`lastEventId` check the old application projection did by hand.

Only `wallet.*` events are summed in the balance view: `tx.posted` describes the
same movement and would count every amount twice.

The application side is read-only — [`ClickhouseService`](libs/clickhouse/src/clickhouse.service.ts)
exposes `query()` with bound parameters and nothing else:

```ts
await this.clickhouse.query<WalletBalanceRow>(
  `SELECT ... FROM wallet_balance_view WHERE user_id = {userId:String}`,
  { userId },
);
```

Note the alias is `@analytics/*`, not `@clickhouse/*` — the latter would shadow
the `@clickhouse/client` package.

Trade-offs worth knowing:

- Ingestion is **eventually consistent**. The engine table flushes on batch size
  or timeout, so a report requested immediately after a credit may not include it.
- The Kafka engine table can only be read once per consumer group; **do not
  `SELECT` from `kafka_wallet_events` directly** — that steals messages from the
  materialized view.
- `FINAL` deduplicates at query time and costs more than a plain scan. At larger
  volumes, replace the view with an `AggregatingMergeTree` rollup.
- Changing the schema means editing `docker/clickhouse-init.sql`, which only runs
  on a **fresh** volume; an existing deployment needs the DDL applied by hand.
  Note the file uses `CREATE VIEW IF NOT EXISTS` — re-running it will **not**
  update a view that already exists. Drop it first, or use `CREATE OR REPLACE`.

## Adding a feature module

1. Decide who owns it. New bounded context → a new app under `apps/`; behaviour on
   existing data → a module inside that service.
2. `modules/<feature>/` with `entities/`, `views/`, `common/` (DTOs), `<feature>.{module,controller,service,exception,response}.ts`
3. Add a `views/<feature>.view.ts` and serve every GET from it; register it in
   `forFeature([...])` and the app's `entities` array
4. Add codes/messages to `@utils/enum`, error classes to `<feature>.exception.ts`
5. If the gateway exposes it: add the pattern to `@contracts/patterns`, a shared
   payload DTO to `@contracts/`, an RPC controller in the service, and an HTTP
   controller + response classes in the gateway.
6. If it emits events: add the topic to `@kafka/kafka.topics`, record to the outbox
   inside the transaction, and add the topic to `kafka_topic_list` in
   `docker/clickhouse-init.sql` if it should reach analytics.
7. Register the module in `imports` (client) or `adminModulesImports` (admin).
8. Add `test/<feature>/<feature>.e2e.spec.ts`.

## Not built yet

Deliberately left for the next pass: gateway proxying of auth/user endpoints (the
user service still serves its own HTTP surface), an audit trail (ClickHouse now
covers analytics, but nothing writes an immutable audit log), migrations in place
of `DB_SYNC` and of the ClickHouse init script, and e2e coverage for the wallet
and report services.
