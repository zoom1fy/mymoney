#!/bin/sh
set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
KEEP="${BACKUP_KEEP:-14}"

mkdir -p "$BACKUP_DIR"

# pg_dump -Fc is compressed and supports selective restore.
# The local socket uses trust auth, so no password is needed.
stamp="$(date +%Y%m%d-%H%M%S)"
pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > "$BACKUP_DIR/mymoney-$stamp.dump"

# Retention: keep only the newest $KEEP dumps. The while loop is empty-safe.
ls -1t "$BACKUP_DIR"/mymoney-*.dump 2>/dev/null | tail -n +"$((KEEP + 1))" | while IFS= read -r old; do
  rm -f -- "$old"
done