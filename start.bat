@echo off
setlocal

cd /d "%~dp0"

echo ==^> Governance Board . start

where node >nul 2>nul
if errorlevel 1 (
  echo ERRORE: node non e' installato. Installa Node.js ^(^>=18^) da https://nodejs.org 1>&2
  exit /b 1
)

if not exist node_modules (
  echo ==^> node_modules mancante, eseguo npm install
  call npm install
  if errorlevel 1 exit /b 1
) else (
  echo ==^> dipendenze gia' installate ^(node_modules presente^)
)

if not exist prisma\dev.db (
  echo ==^> dev.db mancante, eseguo migrazione e seed
  call npx prisma migrate deploy
  if errorlevel 1 exit /b 1
  call npx prisma db seed
  if errorlevel 1 exit /b 1
) else (
  echo ==^> database gia' presente ^(prisma\dev.db^)
  echo ==^> applico eventuali migrazioni pendenti
  call npx prisma migrate deploy
  if errorlevel 1 exit /b 1
)

echo ==^> avvio Next.js dev server su http://localhost:3000
call npm run dev

endlocal
