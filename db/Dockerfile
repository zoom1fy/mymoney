# Postgres 17 with a cron-driven daily backup.
# pg_dump ships with the image, so only cron is added.
FROM postgres:17-alpine

RUN apk add --no-cache dcron

# Daily 03:00 dump to /backups with a rotating log
COPY crontab /etc/crontabs/root
COPY mymoney-backup.sh /usr/local/bin/mymoney-backup
COPY cron-entrypoint.sh /usr/local/bin/cron-entrypoint.sh

RUN chmod +x /usr/local/bin/mymoney-backup /usr/local/bin/cron-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/cron-entrypoint.sh"]
CMD ["postgres"]