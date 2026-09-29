// ═══════════════════════════════════════════════════════════
// controllers/reportController.js — CRUD Operations
// ═══════════════════════════════════════════════════════════
// Handles Create, Read, Update, Delete operations for
// inspection reports. Supports VARIABLE SCHEMAS — any report
// type with any fields can be stored in the same collection.
// ═══════════════════════════════════════════════════════════

const { getDb } = require('../config/database');
const { ObjectId } = require('mongodb');

/**
 * GET /api/reports
 * List all reports with optional filtering and pagination.
 *
 * Query params:
 *   ?type=vehicle         — filter by report type
 *   ?status=completed     — filter by status
 *   ?city=Mumbai          — filter by location.city
 *   ?inspector=Rahul      — filter by inspector name (partial match)
 *   ?rating=pass          — filter by overall rating
 *   ?page=1&limit=10      — pagination
 */
exports.getAllReports = async (req, res) => {
  try {
    const db = getDb();
    const {
      type,
      status,
      city,
      inspector,
      rating,
      page = 1,
      limit = 10
    } = req.query;

    // Build dynamic filter object
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (inspector) filter['inspector.name'] = { $regex: inspector, $options: 'i' };
    if (rating) filter.overallRating = rating;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch reports with sorting (newest first)
    const reports = await db.collection('reports')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count for pagination
    const total = await db.collection('reports').countDocuments(filter);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error in getAllReports:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/:id
 * Get a single report by its MongoDB ObjectId.
 */
exports.getReportById = async (req, res) => {
  try {
    const db = getDb();

    // Validate ObjectId format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report ID format'
      });
    }

    const report = await db.collection('reports').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error in getReportById:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/reports
 * Create a new inspection report.
 *
 * VARIABLE SCHEMA: The request body can contain ANY fields.
 * This is the key feature — different report types have
 * different schemas, all stored in the same collection.
 *
 * Required fields: type, status
 * Auto-generated: reportId, createdAt, updatedAt
 */
exports.createReport = async (req, res) => {
  try {
    const db = getDb();
    const body = req.body;

    // Basic validation
    if (!body.type) {
      return res.status(400).json({
        success: false,
        error: 'Field "type" is required (e.g., vehicle, building, food_safety)'
      });
    }

    // Build the report document
    // The spread operator (...body) allows ANY schema to pass through
    const reportData = {
      ...body,
      reportId: `RPT-${Date.now()}`,
      status: body.status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('reports').insertOne(reportData);

    console.log(`📄 Created report: ${reportData.reportId} (type: ${reportData.type})`);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        _id: result.insertedId,
        reportId: reportData.reportId,
        type: reportData.type
      }
    });
  } catch (error) {
    console.error('Error in createReport:', error.message);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A report with this ID already exists'
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/reports/:id
 * Update an existing report.
 * Supports partial updates — only the fields you send will be updated.
 * Supports nested field updates (e.g., {"inspector.name": "New Name"}).
 */
exports.updateReport = async (req, res) => {
  try {
    const db = getDb();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report ID format'
      });
    }

    // Remove _id from update body if present (cannot modify _id)
    const updateBody = { ...req.body };
    delete updateBody._id;

    // Add updated timestamp
    updateBody.updatedAt = new Date();

    const result = await db.collection('reports').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateBody }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    console.log(`📝 Updated report: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error in updateReport:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/reports/:id
 * Delete a report permanently.
 */
exports.deleteReport = async (req, res) => {
  try {
    const db = getDb();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report ID format'
      });
    }

    const result = await db.collection('reports').deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    console.log(`🗑️  Deleted report: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteReport:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /api/reports/:id/findings
 * Add a new finding to an existing report's findings array.
 *
 * This demonstrates modifying NESTED document structures —
 * pushing a new element into an embedded array without
 * replacing the entire document.
 *
 * Body example:
 *   { "component": "tyres", "condition": "worn", "severity": "high" }
 */
exports.addFinding = async (req, res) => {
  try {
    const db = getDb();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report ID format'
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Finding data is required in request body'
      });
    }

    // Add a timestamp to the finding
    const findingData = {
      ...req.body,
      addedAt: new Date()
    };

    const result = await db.collection('reports').updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $push: { findings: findingData },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    console.log(`➕ Added finding to report: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Finding added successfully',
      data: findingData
    });
  } catch (error) {
    console.error('Error in addFinding:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/types/list
 * Get all distinct report types in the collection.
 * Useful for populating filter dropdowns in the frontend.
 */
exports.getReportTypes = async (req, res) => {
  try {
    const db = getDb();
    const types = await db.collection('reports').distinct('type');

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Error in getReportTypes:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/stats/overview
 * Get dashboard statistics — total reports, counts by type and status.
 */
exports.getOverviewStats = async (req, res) => {
  try {
    const db = getDb();

    // Run all queries in parallel for performance
    const [total, byType, byStatus, byRating, recentReports] = await Promise.all([
      // Total count
      db.collection('reports').countDocuments(),

      // Count by type
      db.collection('reports').aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),

      // Count by status
      db.collection('reports').aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),

      // Count by overall rating
      db.collection('reports').aggregate([
        { $group: { _id: '$overallRating', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),

      // 5 most recent reports
      db.collection('reports')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .project({ reportId: 1, type: 1, status: 1, overallRating: 1, createdAt: 1, 'inspector.name': 1 })
        .toArray()
    ]);

    res.json({
      success: true,
      data: {
        total,
        byType,
        byStatus,
        byRating,
        recentReports
      }
    });
  } catch (error) {
    console.error('Error in getOverviewStats:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
