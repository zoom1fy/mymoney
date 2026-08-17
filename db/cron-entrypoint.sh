#!/bin/sh
set -e

# Ensure the backup mount exists before cron writes its log there.
mkdir -p /backups

# Start the cron daemon in the background, then hand control over to the
# official Postgres entrypoint so container lifecycle stays unchanged.
/usr/sbin/crond
exec /usr/local/bin/docker-entrypoint.sh "$@"