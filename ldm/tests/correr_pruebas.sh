#!/usr/bin/env bash
# Corre las pruebas del esquema en un Postgres local (no toca Supabase).
# Uso: PGHOST=/tmp/ldm-pg PGPORT=5499 PGUSER=postgres bash tests/correr_pruebas.sh
set -euo pipefail
cd "$(dirname "$0")/.."
P="psql -v ON_ERROR_STOP=1 -q"
$P -d postgres -c "drop database if exists ldm_test" -c "create database ldm_test"
$P -d ldm_test -f tests/supabase_stub.sql
$P -d ldm_test -f supabase/schema.sql
$P -d ldm_test -f supabase/seed_2027.sql
$P -d ldm_test -f tests/permisos_test.sql
node --test tests/*.test.mjs
