// ═══════════════════════════════════════════════════════════
// controllers/templateController.js — Template Operations
// ═══════════════════════════════════════════════════════════
// Manages inspection report templates. Templates define the
// expected fields for each report type, powering the dynamic
// form generation in the frontend.
// ═══════════════════════════════════════════════════════════

const { getDb } = require('../config/database');
const { ObjectId } = require('mongodb');

/**
 * GET /api/templates
 * List all available inspection templates.
 */
exports.getAllTemplates = async (req, res) => {
  try {
    const db = getDb();
    const templates = await db.collection('templates')
      .find({})
      .sort({ type: 1 })
      .toArray();

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Error in getAllTemplates:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/templates/:type
 * Get a template by its report type (e.g., "vehicle", "building").
 */
exports.getTemplateByType = async (req, res) => {
  try {
    const db = getDb();
    const template = await db.collection('templates').findOne({
      type: req.params.type
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template for type "${req.params.type}" not found`,
        availableTypes: await db.collection('templates').distinct('type')
      });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error in getTemplateByType:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/templates
 * Create a new template.
 */
exports.createTemplate = async (req, res) => {
  try {
    const db = getDb();
    const body = req.body;

    if (!body.type || !body.name) {
      return res.status(400).json({
        success: false,
        error: 'Fields "type" and "name" are required'
      });
    }

    // Check if template for this type already exists
    const existing = await db.collection('templates').findOne({ type: body.type });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Template for type "${body.type}" already exists`
      });
    }

    const templateData = {
      ...body,
      templateId: `TMPL-${Date.now()}`,
      version: body.version || '1.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('templates').insertOne(templateData);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { _id: result.insertedId, templateId: templateData.templateId }
    });
  } catch (error) {
    console.error('Error in createTemplate:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/templates/:type
 * Update an existing template by type.
 */
exports.updateTemplate = async (req, res) => {
  try {
    const db = getDb();
    const updateBody = { ...req.body };
    delete updateBody._id;
    updateBody.updatedAt = new Date();

    const result = await db.collection('templates').updateOne(
      { type: req.params.type },
      { $set: updateBody }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Template for type "${req.params.type}" not found`
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error in updateTemplate:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/templates/:type
 * Delete a template by type.
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('templates').deleteOne({
      type: req.params.type
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Template for type "${req.params.type}" not found`
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTemplate:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
