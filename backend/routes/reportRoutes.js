// ═══════════════════════════════════════════════════════════
// routes/reportRoutes.js — Report API Routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// ─── Dashboard Stats ─────────────────────────────────────
// GET /api/reports/stats/overview — Dashboard statistics
// NOTE: This is placed before /:id only for readability;
// Express resolves these as literal path segments and would not
// match "stats" as an :id parameter regardless of order.
router.get('/stats/overview', reportController.getOverviewStats);

// ─── Report Types ────────────────────────────────────────
// GET /api/reports/types/list — All distinct report types
router.get('/types/list', reportController.getReportTypes);

// ─── CRUD Operations ─────────────────────────────────────
// GET /api/reports — List all reports (with filters & pagination)
router.get('/', reportController.getAllReports);

// GET /api/reports/:id — Get single report by ID
router.get('/:id', reportController.getReportById);

// POST /api/reports — Create a new report (any schema)
router.post('/', reportController.createReport);

// PUT /api/reports/:id — Update a report
router.put('/:id', reportController.updateReport);

// DELETE /api/reports/:id — Delete a report
router.delete('/:id', reportController.deleteReport);

// ─── Nested Document Operations ──────────────────────────
// PATCH /api/reports/:id/findings — Add a finding to a report
router.patch('/:id/findings', reportController.addFinding);

module.exports = router;
