# Badrgo

A runnable NestJS starter distilled from the conventions of this repository: a split admin/user API surface, localization, a single exception layer, a uniform response envelope, and an end-to-end test harness. No business/domain code — everything here is scaffolding you extend.

## Stack

NestJS 10 · TypeORM (Postgres) · JWT auth · nestjs-i18n · Swagger · Jest + Supertest

## Getting started

```bash
cp .env.example .env          # then set DB credentials + JWT_SECRET_KEY
createdb badrgo
npm install
npm run start:dev
```

`docker compose up -d postgres` starts a Postgres 16 instance instead of a local install
(it reads `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` / `DB_PORT` from `.env`). The
`Dockerfile` builds the API image itself for deployment.

- Client API docs: <http://localhost:3000/docs>
- Admin API docs: <http://localhost:3000/docs/admin>
- Global route prefix: `v1/api`

On first boot the seeder creates the three roles and the super admin from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`.

## Layout

```
src/
  main.ts                      bootstrap: pipes → filter → prefix → two Swagger docs
  response/response.ts         base envelope every success response extends
  models/models.ts             shared types (JWT payload, query filters)
  i18n/{en-us,ur}/common.json  translation catalogues
  modules/
    main/                      AppModule + AppService (typeorm/env/startup config)
    common/                    base entity, decorators, DTOs, filter, pipes, responses, validators
    auth/                      user-side register/login + AuthGuard (roles)
    user/                      user self-service (profile, password)
    role/                      role entity + lookup
    language/                  i18n reference module
    admin/
      admin/                   admin entity + service
      auth/                    admin login, admin creation (super admin only)
      user/                    admin-side user management (list/inspect/block/delete)
  utils/                       enum (codes + messages), helper (Exception, pagination), jwt, hash, logger, seeder
test/                          e2e harness + specs per module
```

## The five conventions

### 1. Admin and user sides are separate surfaces

`app.module.ts` exports two arrays — `imports` (client) and `adminModulesImports` (back office). `main.ts` feeds each into its own Swagger document, so `/docs` and `/docs/admin` never leak one another's endpoints. Admin controllers live under `modules/admin/*` and are routed under `admin/…`.

Both sides share one `AuthGuard` and one set of services; what differs is the controller and the required role:

```ts
@UseGuards(AuthGuard)
@HasRoles(UserRoles.ADMIN, UserRoles.SUPER_ADMIN)
@Controller('admin/user')
```

To add a module: create it under `modules/`, register it in `imports` **or** `adminModulesImports`.

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

`I18nModule` resolves the language from `?lang=` then `Accept-Language`, falling back to `FALLBACK_LANGUAGE`. Catalogues live in `src/i18n/<locale>/<namespace>.json` and are copied into `dist` by `npm run build`.

```bash
curl 'localhost:3000/v1/api/language/welcome?name=Ali&lang=ur'
```

`LanguageService.translate('common.welcome', { name })` resolves against the current request's language — see `modules/language/` for the reference implementation. The `User` entity stores a per-user `language` for background jobs and notifications, where there is no request context.

### 5. Tests

`test/app.helper.ts` boots the **real** `AppModule` with the same pipes and filter as `main.ts`, so specs exercise production behaviour rather than a stub. `Helper.truncateAll()` gives each suite a clean database, and `helper.init()` seeds roles + super admin and logs in one user and one admin.

```bash
createdb badrgo_test          # matches _test.env
npm test                         # e2e suites, serial
npm run test:cov
```

Specs are grouped per module (`test/<module>/<name>.e2e.spec.ts`) and cover the happy path, the domain-error code, and the authorization boundary — mirror that trio when adding a module.

## Adding a feature module

1. `modules/<feature>/` with `entities/`, `common/` (DTOs), `<feature>.{module,controller,service,exception,response}.ts`
2. Add codes/messages to `@utils/enum`, error classes to `<feature>.exception.ts`
3. Register in `imports` (client) or `adminModulesImports` (admin) in `app.module.ts`
4. Add `test/<feature>/<feature>.e2e.spec.ts`
