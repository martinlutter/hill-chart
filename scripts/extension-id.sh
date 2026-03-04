#!/usr/bin/env bash
# Compute Chrome extension ID from a PEM private key.
#
# Usage: ./scripts/extension-id.sh myext.pem

set -euo pipefail

PEM="${1:?Usage: $0 <private-key.pem>}"

# Extract DER-encoded public key, SHA-256 it, take first 32 hex chars,
# then map each hex digit (0-f → a-p) to produce the extension ID.
openssl pkey -in "$PEM" -pubout -outform DER 2>/dev/null \
  | openssl dgst -sha256 -hex \
  | sed 's/.*= //' \
  | head -c 32 \
  | tr '0-9a-f' 'a-p'

echo
