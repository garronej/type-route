#!/bin/bash

npm run build
cd ../onyxia/web
rm -rf node_modules .yarn_home
yarn
rm -rf patches/type-route+1.1.0.patch
rm -rf node_modules/type-route/dist
rm -rf node_modules/type-route/src
rm -rf node_modules/type-route/core
cp -r ../../type-route/dist   node_modules/type-route/
cp -r ../../type-route/src   node_modules/type-route/
mv node_modules/type-route/dist/core node_modules/type-route/
npx patch-package type-route
yarn dev