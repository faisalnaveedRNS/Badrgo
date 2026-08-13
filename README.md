# Badrgo

<https://github.com/faisalnaveedRNS/Badrgo>

# Stack

NestJS 11 · TypeORM 1 (Postgres 16) · Kafka (KRaft) · ClickHouse 24 · Redis 7 · JWT auth · nestjs-i18n · Swagger · Jest + Supertest

# Getting started

```bash
cp .env.example .env                 # then set JWT_SECRET_KEY
docker compose up -d                 # postgres + redis + kafka + clickhouse
npm install

npm run start:user                   # HTTP 3001 · TCP 4001
npm run start:wallet                 # TCP 4002
npm run start:report                 # HTTP 3003 (probes) · TCP 4003
npm run start:gateway                # HTTP 3000
```

# AI usage disclosure

**Human**

- Architecture design and the full thought process behind it
- API design
- Entity design
- Error code and logic design

**AI**

- Test cases
- Fixes
- Linters
- Dockerfile and docker compose files
- Test environment setup
