#!/bin/sh
set -eu
if [ "$(id -u)" = 0 ]; then
  chown node:node /app/var/evidencias
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi
exec "$@"
