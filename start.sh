#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "==> Governance Board · start"

if ! command -v node >/dev/null 2>&1; then
  echo "ERRORE: node non è installato. Installa Node.js (>=18) da https://nodejs.org" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "==> node_modules mancante, eseguo npm install"
  npm install
else
  echo "==> dipendenze già installate (node_modules presente)"
fi

if [ ! -f prisma/dev.db ]; then
  echo "==> dev.db mancante, eseguo migrazione e seed"
  npx prisma migrate deploy
  npx prisma db seed
else
  echo "==> database già presente (prisma/dev.db)"
  echo "==> applico eventuali migrazioni pendenti"
  npx prisma migrate deploy
fi

echo "==> avvio Next.js dev server su http://localhost:3000"
exec npm run dev
