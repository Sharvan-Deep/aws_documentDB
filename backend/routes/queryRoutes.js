// ═══════════════════════════════════════════════════════════
// routes/queryRoutes.js — Advanced Query Routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');

// ─── Nested Document Queries ─────────────────────────────
// GET /api/queries/nested?field=X&value=Y
router.get('/nested', queryController.queryNestedFields);

// ─── Aggregation Queries ─────────────────────────────────
// GET /api/queries/by-type — Reports grouped by type
router.get('/by-type', queryController.reportsByType);

// GET /api/queries/by-status — Reports grouped by status
router.get('/by-status', queryController.reportsByStatus);

// GET /api/queries/by-city — Reports grouped by city
router.get('/by-city', queryController.reportsByCity);

// ─── Filtered Queries ────────────────────────────────────
// GET /api/queries/high-severity — Reports with high severity findings
router.get('/high-severity', queryController.highSeverityReports);

// GET /api/queries/search-tags?tags=urgent,safety — Search by tags
router.get('/search-tags', queryController.searchByTags);

// GET /api/queries/date-range?startDate=X&endDate=Y — Date range filter
router.get('/date-range', queryController.reportsByDateRange);

// ─── Analytics Queries ───────────────────────────────────
// GET /api/queries/inspector-stats — Inspector performance
router.get('/inspector-stats', queryController.inspectorStats);

// GET /api/queries/schema-analysis — Analyze variable schemas
router.get('/schema-analysis', queryController.schemaAnalysis);

// ─── Custom Query (Query Playground) ─────────────────────
// POST /api/queries/custom — Run a custom MongoDB-style query
router.post('/custom', queryController.customQuery);

module.exports = router;
