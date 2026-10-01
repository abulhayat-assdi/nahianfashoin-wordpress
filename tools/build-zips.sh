#!/usr/bin/env bash
# Builds the two upload-ready ZIPs (theme + plugin) into dist/. The compiled CSS/JS are already committed,
# so the ZIPs contain no build tooling or sources.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist
( cd wp-content/themes && zip -qr ../../dist/nahianfashion-theme.zip nahianfashion -x 'nahianfashion/_src/*' '*.DS_Store' )
( cd wp-content/plugins && zip -qr ../../dist/nahianfashion-cms.zip nahianfashion-cms -x 'nahianfashion-cms/admin-src/*' '*.DS_Store' )
ls -la dist
