#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# scripts/get-cert.sh — Download the AWS DocumentDB TLS CA bundle
# ═══════════════════════════════════════════════════════════
# Usage:
#   bash scripts/get-cert.sh             # saves to backend/global-bundle.pem
#   bash scripts/get-cert.sh /custom/dir # saves to /custom/dir/global-bundle.pem
#
# The CA bundle is required whenever NODE_ENV=production.
# It is git-ignored and must be downloaded on each fresh EC2 instance.
# ═══════════════════════════════════════════════════════════
set -euo pipefail

CERT_URL="https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="${1:-${SCRIPT_DIR}/../backend}"
DEST_FILE="${DEST_DIR}/global-bundle.pem"

echo "⬇️  Downloading AWS DocumentDB TLS CA bundle..."
mkdir -p "${DEST_DIR}"
wget -q "${CERT_URL}" -O "${DEST_FILE}"

echo "✅  Saved to: ${DEST_FILE}"
echo "    You can now start the backend with NODE_ENV=production."
