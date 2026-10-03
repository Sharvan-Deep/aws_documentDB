// ═══════════════════════════════════════════════════════════
// routes/templateRoutes.js — Template API Routes
// ═══════════════════════════════════════════════════════════
// GET routes are always enabled.
// Write routes (POST, PUT, DELETE) are gated behind the
// ENABLE_TEMPLATE_WRITES=true environment variable.
// Default is false — returns 403 with a hint when disabled.
// This matches the pattern used by ENABLE_QUERY_PLAYGROUND.
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// ─── Template Write Guard ─────────────────────────────────
function templateWritesEnabled(req, res, next) {
  if (process.env.ENABLE_TEMPLATE_WRITES !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Template write operations are disabled.',
      hint: 'Set ENABLE_TEMPLATE_WRITES=true in .env to enable POST, PUT and DELETE on /api/templates.'
    });
  }
  next();
}

// ─── Read routes (always on) ──────────────────────────────
// GET /api/templates — List all templates
router.get('/', templateController.getAllTemplates);

// GET /api/templates/:type — Get template by report type
router.get('/:type', templateController.getTemplateByType);

// ─── Write routes (gated) ─────────────────────────────────
// POST /api/templates — Create a new template
router.post('/', templateWritesEnabled, templateController.createTemplate);

// PUT /api/templates/:type — Update a template
router.put('/:type', templateWritesEnabled, templateController.updateTemplate);

// DELETE /api/templates/:type — Delete a template
router.delete('/:type', templateWritesEnabled, templateController.deleteTemplate);

module.exports = router;
