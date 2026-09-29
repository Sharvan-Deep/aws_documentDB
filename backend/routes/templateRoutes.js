// ═══════════════════════════════════════════════════════════
// routes/templateRoutes.js — Template API Routes
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// GET /api/templates — List all templates
router.get('/', templateController.getAllTemplates);

// GET /api/templates/:type — Get template by report type
router.get('/:type', templateController.getTemplateByType);

// POST /api/templates — Create a new template
router.post('/', templateController.createTemplate);

// PUT /api/templates/:type — Update a template
router.put('/:type', templateController.updateTemplate);

// DELETE /api/templates/:type — Delete a template
router.delete('/:type', templateController.deleteTemplate);

module.exports = router;
