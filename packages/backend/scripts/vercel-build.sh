#!/bin/bash
set -e
cd ../..
npm run build -w packages/shared
cd packages/backend
npx prisma generate
npx ncc build src/vercel.ts -o .vercel/output/functions/api --external @prisma/client
