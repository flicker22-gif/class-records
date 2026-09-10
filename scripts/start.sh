#!/bin/sh
set -e

pnpm drizzle-kit migrate

node .output/server/index.mjs
