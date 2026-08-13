-- ClickHouse consumes Kafka itself. There is no application consumer: the Kafka
-- engine table is the subscriber, a materialized view parses each message, and
-- the rows land in a MergeTree table the report service queries.
--
--   Kafka topics -> kafka_wallet_events (Kafka engine)
--                -> wallet_events_mv    (materialized view, parses JSON)
--                -> wallet_events       (ReplacingMergeTree, deduped)
--                -> wallet_balance_view (aggregate, read by the report service)

CREATE DATABASE IF NOT EXISTS badrgo;

-- 1. The subscriber. `JSONAsString` hands the whole message to one column, so a
--    change to the event payload cannot break ingestion — parsing happens below.
CREATE TABLE IF NOT EXISTS badrgo.kafka_wallet_events
(
    raw String
)
ENGINE = Kafka
SETTINGS
    kafka_broker_list = 'kafka:9092',
    kafka_topic_list = 'wallet.created,wallet.credited,wallet.debited,tx.posted',
    kafka_group_name = 'clickhouse-analytics',
    kafka_format = 'JSONAsString',
    kafka_num_consumers = 1,
    kafka_max_block_size = 1048576,
    kafka_poll_max_batch_size = 1000;

-- 2. The landing table. Kafka delivery is at-least-once, so the sort key ends in
--    `event_id` and ReplacingMergeTree collapses redelivered copies on merge —
--    the same job `WalletProjection.lastEventId` used to do in application code.
CREATE TABLE IF NOT EXISTS badrgo.wallet_events
(
    event_id        String,
    event_type      LowCardinality(String),
    aggregate_type  LowCardinality(String),
    aggregate_id    String,
    occurred_at     DateTime64(3),

    wallet_id       String,
    user_id         String,
    currency        LowCardinality(String),
    type            LowCardinality(String),
    amount          Decimal(38, 8),
    balance_after   Decimal(38, 8),
    reference       String,
    transaction_id  String,

    ingested_at     DateTime64(3) DEFAULT now64(3),
    raw             String
)
ENGINE = ReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(occurred_at)
ORDER BY (wallet_id, occurred_at, event_id);

-- 3. The pipe. Fires on every batch the Kafka engine reads.
CREATE MATERIALIZED VIEW IF NOT EXISTS badrgo.wallet_events_mv
TO badrgo.wallet_events AS
SELECT
    JSONExtractString(raw, 'eventId')                                   AS event_id,
    JSONExtractString(raw, 'eventType')                                 AS event_type,
    JSONExtractString(raw, 'aggregateType')                             AS aggregate_type,
    JSONExtractString(raw, 'aggregateId')                               AS aggregate_id,
    parseDateTime64BestEffortOrZero(JSONExtractString(raw, 'occurredAt'), 3) AS occurred_at,

    JSONExtractString(raw, 'payload', 'walletId')                       AS wallet_id,
    JSONExtractString(raw, 'payload', 'userId')                         AS user_id,
    JSONExtractString(raw, 'payload', 'currency')                       AS currency,
    JSONExtractString(raw, 'payload', 'type')                           AS type,
    toDecimal64OrZero(JSONExtractString(raw, 'payload', 'amount'), 8)   AS amount,
    toDecimal64OrZero(JSONExtractString(raw, 'payload', 'balanceAfter'), 8) AS balance_after,
    JSONExtractString(raw, 'payload', 'reference')                      AS reference,
    JSONExtractString(raw, 'payload', 'transactionId')                  AS transaction_id,

    now64(3)                                                            AS ingested_at,
    raw                                                                 AS raw
FROM badrgo.kafka_wallet_events;

-- 4. The read model, replacing the Postgres `wallet_projections` table.
--    `FINAL` applies the ReplacingMergeTree dedupe at query time, so a duplicate
--    delivery cannot double-count a credit. Only wallet.* movements are summed —
--    `tx.posted` describes the same money and would count it twice.
CREATE VIEW IF NOT EXISTS badrgo.wallet_balance_view AS
SELECT
    wallet_id,
    any(user_id)                                                        AS user_id,
    any(currency)                                                       AS currency,
    sumIf(amount, event_type = 'wallet.credited')                       AS total_credited,
    sumIf(amount, event_type = 'wallet.debited')                        AS total_debited,
    countIf(event_type IN ('wallet.credited', 'wallet.debited'))        AS transaction_count,
    argMax(balance_after, occurred_at)                                  AS balance,
    max(occurred_at)                                                    AS last_event_at
FROM badrgo.wallet_events FINAL
WHERE event_type IN ('wallet.created', 'wallet.credited', 'wallet.debited')
GROUP BY wallet_id;

-- 5. The report itself, aggregated in the database.
--    A parameterized view: the report service selects one already-summed row and
--    stores it, so no totals are ever computed in application code.
--      SELECT * FROM wallet_report_view(userId = '')            -- every wallet
--      SELECT * FROM wallet_report_view(userId = '<uuid>')      -- one user
--
--    Decimals stay Decimal(38,8): the client sets output_format_decimal_trailing_zeros
--    and output_format_json_quote_decimals, so money arrives as "879.50000000" —
--    a string, never a JS float.
CREATE VIEW IF NOT EXISTS badrgo.wallet_report_view AS
SELECT
    count()                                                             AS wallets,
    sum(balance)                                                        AS total_balance,
    sum(total_credited)                                                 AS total_credited,
    sum(total_debited)                                                  AS total_debited,
    toUInt64(sum(transaction_count))                                    AS transaction_count,
    max(last_event_at)                                                  AS last_event_at
FROM badrgo.wallet_balance_view
WHERE ({userId:String} = '' OR user_id = {userId:String});

-- 6. Per-wallet detail for statement style reports, also aggregated here.
CREATE VIEW IF NOT EXISTS badrgo.wallet_detail_view AS
SELECT
    wallet_id,
    user_id,
    currency,
    balance,
    total_credited,
    total_debited,
    transaction_count,
    last_event_at
FROM badrgo.wallet_balance_view
WHERE ({userId:String} = '' OR user_id = {userId:String})
ORDER BY balance DESC
LIMIT 1000;
