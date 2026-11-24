#!/usr/bin/env bash
# Runs all migrations and the security tests on a throwaway local PostgreSQL.
# Needs PostgreSQL 15+ server binaries (initdb, pg_ctl) and psql.
set -euo pipefail
cd "$(dirname "$0")/../.."

BIN=$(dirname "$(command -v pg_ctl 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/pg_ctl 2>/dev/null | sort -V | tail -1)")
[ -x "$BIN/initdb" ] || { echo "PostgreSQL server binaries not found (initdb/pg_ctl)."; exit 1; }

DIR=$(mktemp -d /var/tmp/ih-dbtest.XXXXXX)
RUN=()
if [ "$(id -u)" = 0 ]; then chown postgres "$DIR"; RUN=(runuser -u postgres --); fi
PORT=55432
cleanup() { "${RUN[@]}" "$BIN/pg_ctl" -D "$DIR/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT

"${RUN[@]}" "$BIN/initdb" -D "$DIR/data" -A trust -U postgres >/dev/null
"${RUN[@]}" "$BIN/pg_ctl" -D "$DIR/data" -o "-k $DIR -p $PORT -c listen_addresses=" -l "$DIR/log" -w start >/dev/null

PSQL=(psql -h "$DIR" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -f supabase/tests/supabase_stub.sql
for f in supabase/migrations/*.sql; do
  echo "migrate  $(basename "$f")"
  "${PSQL[@]}" -c "set client_min_messages = warning" -f "$f"
done
"${PSQL[@]}" -f supabase/tests/security_test.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
