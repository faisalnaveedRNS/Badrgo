#!/bin/sh
# Each service owns its own database — they never read one another's tables.
set -e

for db in badrgo_wallet badrgo_report badrgo_test badrgo_wallet_test badrgo_report_test; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE DATABASE $db" || true
done
