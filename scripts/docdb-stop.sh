#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# scripts/docdb-stop.sh — Stop the Amazon DocumentDB cluster
# ═══════════════════════════════════════════════════════════
# Usage:
#   export DOCDB_CLUSTER_ID=inspection-docdb-cluster
#   bash scripts/docdb-stop.sh
#
# Cost impact: compute billing stops immediately.
# Storage (snapshots) continues to accrue at the standard rate.
#
# ⚠️  AWS automatically RESTARTS a stopped cluster after 7 days.
# ═══════════════════════════════════════════════════════════
set -euo pipefail

CLUSTER_ID="${DOCDB_CLUSTER_ID:?Environment variable DOCDB_CLUSTER_ID must be set}"

echo "🛑  Stopping DocumentDB cluster: ${CLUSTER_ID} ..."
aws docdb stop-db-cluster --db-cluster-identifier "${CLUSTER_ID}"

echo ""
echo "✅  Stop command sent. The cluster will finish stopping in ~1 minute."
echo "    Compute billing stops once the cluster reaches 'stopped' state."
echo "    Run 'bash scripts/docdb-start.sh' to bring it back online."
echo ""
echo "⚠️  AWS will automatically restart the cluster after 7 days."
