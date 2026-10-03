#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# scripts/docdb-start.sh — Start the Amazon DocumentDB cluster
# ═══════════════════════════════════════════════════════════
# Usage:
#   export DOCDB_CLUSTER_ID=inspection-docdb-cluster
#   bash scripts/docdb-start.sh
#
# The cluster typically takes 2-4 minutes to become available.
# Wait for status "available" before starting the application.
# ═══════════════════════════════════════════════════════════
set -euo pipefail

CLUSTER_ID="${DOCDB_CLUSTER_ID:?Environment variable DOCDB_CLUSTER_ID must be set}"

echo "▶️   Starting DocumentDB cluster: ${CLUSTER_ID} ..."
aws docdb start-db-cluster --db-cluster-identifier "${CLUSTER_ID}"

echo ""
echo "✅  Start command sent. The cluster will be available in ~2-4 minutes."
echo "    Poll status with:"
echo "    aws docdb describe-db-clusters --db-cluster-identifier ${CLUSTER_ID} \\"
echo "        --query 'DBClusters[0].Status'"
echo ""
echo "    Once status is \"available\", run: cd backend && npm start"
