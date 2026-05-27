#!/bin/bash
set -e
cd ../..
npm run build -w packages/shared
mkdir -p packages/backend/node_modules/@gymify/shared
cp -r packages/shared/dist packages/backend/node_modules/@gymify/shared/dist
cp packages/shared/package.json packages/backend/node_modules/@gymify/shared/package.json
cd packages/backend
npx prisma generate
npx tsc
