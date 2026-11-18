FROM mysql:8.4
COPY --chmod=0444 server/schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY --chmod=0444 deploy/demo-grants.sh /docker-entrypoint-initdb.d/02-grants.sh
