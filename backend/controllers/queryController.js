// ═══════════════════════════════════════════════════════════
// controllers/queryController.js — Advanced Query Operations
// ═══════════════════════════════════════════════════════════
// Demonstrates querying NESTED document structures and
// running aggregation pipelines on Amazon DocumentDB.
//
// These queries showcase why a document database is powerful
// for variable-schema, deeply nested data like inspection reports.
// ═══════════════════════════════════════════════════════════

const { getDb } = require('../config/database');
const { ALLOWED_DOLLAR_OPS, validateOperators } = require('../utils/validateQuery');

// ─── Query Playground Guard ──────────────────────────────
// The two open-ended endpoints (nested + custom) accept raw
// user-supplied MongoDB filters, which is powerful but risky.
// They are disabled by default and require the feature flag:
//   ENABLE_QUERY_PLAYGROUND=true   (in .env)

/**
 * Returns true if the playground is enabled; otherwise writes a
 * 403 JSON response and returns false.
 */
function playgroundEnabled(res) {
  if (process.env.ENABLE_QUERY_PLAYGROUND !== 'true') {
    res.status(403).json({
      success: false,
      error: 'Query Playground is disabled.',
      hint: 'Set ENABLE_QUERY_PLAYGROUND=true in .env to enable this endpoint.'
    });
    return false;
  }
  return true;
}

/**
 * GET /api/queries/nested?field=X&value=Y
 * Query 1: Search inside nested documents dynamically.
 *
 * Examples:
 *   ?field=findings.severity&value=high
 *   ?field=location.city&value=Mumbai
 *   ?field=inspector.department&value=Transport
 *   ?field=vehicleDetails.fuelType&value=diesel
 *   ?field=compliance.fireCode&value=false
 *
 * ⚠️  Requires ENABLE_QUERY_PLAYGROUND=true
 */
exports.queryNestedFields = async (req, res) => {
  if (!playgroundEnabled(res)) return;

  try {
    const db = getDb();
    const { field, value } = req.query;

    if (!field || value === undefined || value === null || value === '') {
      return res.status(400).json({
        success: false,
        error: 'Both "field" and "value" query parameters are required',
        examples: [
          '?field=findings.severity&value=high',
          '?field=location.city&value=Mumbai',
          '?field=inspector.department&value=Transport'
        ]
      });
    }

    // Reject field names that start with "$" or contain a "$" segment
    // (e.g. "$where", "a.$where") to prevent operator injection via the key.
    if (typeof field !== 'string' || field.startsWith('$') || field.split('.').some(seg => seg.startsWith('$'))) {
      return res.status(400).json({
        success: false,
        error: 'Field name must not start with "$" or contain a "$" segment'
      });
    }

    // value must arrive as a plain string; reject arrays and objects that
    // Express can produce when the caller sends value[$ne]=x.
    if (typeof value !== 'string') {
      return res.status(400).json({
        success: false,
        error: '"field" and "value" must be plain strings. Arrays and objects are not allowed.'
      });
    }

    // Try to parse value as boolean or number if applicable
    let parsedValue = value;
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!isNaN(value) && value.trim() !== '') parsedValue = Number(value);

    const filter = { [field]: parsedValue };

    // Validate the constructed filter (catches any $ that slipped through)
    validateOperators(filter, 'filter');

    const results = await db.collection('reports').find(filter).toArray();

    res.json({
      success: true,
      query: { field, value: parsedValue },
      mongoFilter: filter,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error in queryNestedFields:', error.message);
    if (error.message.includes('not permitted') || error.message.includes('allow-list')) {
      return res.status(400).json({ success: false, error: 'Disallowed operator in query', details: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/queries/by-type
 * Query 2: Aggregation — count reports grouped by type.
 * Shows: vehicle: 2, building: 2, food_safety: 1, etc.
 */
exports.reportsByType = async (req, res) => {
  try {
    const db = getDb();
    const pipeline = [
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          latestReport: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } }
    ];

    const results = await db.collection('reports').aggregate(pipeline).toArray();

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in reportsByType:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/queries/by-status
 * Query 3: Aggregation — count reports grouped by status.
 */
exports.reportsByStatus = async (req, res) => {
  try {
    const db = getDb();
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ];

    const results = await db.collection('reports').aggregate(pipeline).toArray();

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in reportsByStatus:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/queries/high-severity
 * Query 4: Find all reports that contain high-severity findings.
 *
 * This demonstrates querying INSIDE nested arrays —
 * the findings array contains objects, and we search
 * for a specific field value within those objects.
 */
exports.highSeverityReports = async (req, res) => {
  try {
    const db = getDb();

    const results = await db.collection('reports')
      .find({ 'findings.severity': 'high' })
      .project({
        reportId: 1,
        type: 1,
        status: 1,
        overallRating: 1,
        'inspector.name': 1,
        'location.city': 1,
        findings: 1,
        createdAt: 1
      })
      .toArray();

    res.json({
      success: true,
      description: 'Reports containing at least one high-severity finding',
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error in highSeverityReports:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/queries/search-tags?tags=urgent,safety-critical
 * Query 5: Search reports by tags (array field).
 *
 * Demonstrates querying array fields with $in operator.
 * Finds reports that have ANY of the specified tags.
 */
exports.searchByTags = async (req, res) => {
  try {
    const db = getDb();
    const { tags } = req.query;

    if (!tags) {
      return res.status(400).json({
        success: false,
        error: '"tags" query parameter is required (comma-separated)',
        example: '?tags=urgent,safety-critical'
      });
    }

    const tagArray = tags.split(',').map(t => t.trim());

    const results = await db.collection('reports')
      .find({ tags: { $in: tagArray } })
      .toArray();

    res.json({
      success: true,
      searchedTags: tagArray,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error in searchByTags:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/queries/date-range?startDate=2024-10-15&endDate=2024-10-20
 * Query 6: Find reports within a date range.
 * Returns 400 if either date is invalid (NaN after new Date()).
 */
exports.reportsByDateRange = async (req, res) => {
  try {
    const db = getDb();
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both "startDate" and "endDate" are required (ISO format)',
        example: '?startDate=2024-10-15&endDate=2024-10-20'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 (e.g. 2024-10-15)',
        example: '?startDate=2024-10-15&endDate=2024-10-20'
      });
    }

    const results = await db.collection('reports')
      .find({
        createdAt: {
          $gte: start,
          $lte: end
        }
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      dateRange: { startDate, endDate },
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error in reportsByDateRange:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/queries/inspector-stats
 * Query 7: Aggregation — inspector performance statistics.
 *
 * Groups by inspector name and shows how many reports each
 * inspector has created, which departments they belong to,
 * and what types of inspections they perform.
 */
exports.inspectorStats = async (req, res) => {
  try {
    const db = getDb();
    const pipeline = [
      {
        $group: {
          _id: '$inspector.name',
          totalReports: { $sum: 1 },
          employeeId: { $first: '$inspector.employeeId' },
          departments: { $addToSet: '$inspector.department' },
          reportTypes: { $addToSet: '$type' },
          latestReport: { $max: '$createdAt' },
          oldestReport: { $min: '$createdAt' }
        }
      },
      { $sort: { totalReports: -1 } }
    ];

    const results = await db.collection('reports').aggregate(pipeline).toArray();

    res.json({
      success: true,
      description: 'Inspector performance statistics',
      data: results
    });
  } catch (error) {
    console.error('Error in inspectorStats:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/queries/by-city
 * Query 8: Aggregation — reports grouped by city.
 */
exports.reportsByCity = async (req, res) => {
  try {
    const db = getDb();
    const pipeline = [
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 },
          types: { $addToSet: '$type' },
          statuses: { $addToSet: '$status' }
        }
      },
      { $sort: { count: -1 } }
    ];

    const results = await db.collection('reports').aggregate(pipeline).toArray();

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in reportsByCity:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/queries/schema-analysis
 * Query 9: Analyze the variable schemas across different report types.
 *
 * This is a KEY demonstration — it shows how different report types
 * have different fields, proving the value of a document database
 * over a fixed-schema relational database.
 *
 * Note: shows the fields of ONE SAMPLE document per type, not every
 * possible field across all documents of that type.
 */
exports.schemaAnalysis = async (req, res) => {
  try {
    const db = getDb();

    // Get one sample document per type
    const types = await db.collection('reports').distinct('type');

    const analysis = [];

    for (const type of types) {
      const sample = await db.collection('reports').findOne({ type });
      if (sample) {
        // Extract top-level field names
        const fields = Object.keys(sample).filter(k => k !== '_id');
        analysis.push({
          type,
          fieldCount: fields.length,
          fields,
          sampleId: sample.reportId
        });
      }
    }

    res.json({
      success: true,
      description: 'Schema analysis — shows the fields of one sample document per type (variable schema). Fields present only in other documents of the same type are not shown here.',
      totalTypes: types.length,
      data: analysis
    });
  } catch (error) {
    console.error('Error in schemaAnalysis:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/queries/allowed-operators
 * Returns the list of operators permitted by the Query Playground.
 * Always available (not gated by ENABLE_QUERY_PLAYGROUND).
 */
exports.allowedOperators = (req, res) => {
  res.json({
    success: true,
    allowedOperators: Array.from(ALLOWED_DOLLAR_OPS),
    blockedOperators: ['$where', '$function', '$accumulator']
  });
};

/**
 * POST /api/queries/custom
 * Query 10: Custom query from the Query Playground.
 *
 * Accepts a raw MongoDB-style filter, projection, sort, and limit.
 * This is the "power user" feature for the demo.
 *
 * ⚠️  Requires ENABLE_QUERY_PLAYGROUND=true
 * The filter, projection and sort objects are validated against the
 * operator allow-list before being passed to the driver.
 * limit is capped at 100, minimum 1.
 *
 * Body example:
 * {
 *   "filter": {"type": "vehicle", "findings.severity": "high"},
 *   "projection": {"reportId": 1, "type": 1, "findings": 1},
 *   "sort": {"createdAt": -1},
 *   "limit": 10
 * }
 */
exports.customQuery = async (req, res) => {
  if (!playgroundEnabled(res)) return;

  try {
    const db = getDb();
    const {
      filter = '{}',
      projection = '{}',
      sort = '{"createdAt": -1}',
      limit = 10
    } = req.body;

    // Parse JSON strings if they're strings, or use objects directly
    const parsedFilter = typeof filter === 'string' ? JSON.parse(filter) : filter;
    const parsedProjection = typeof projection === 'string' ? JSON.parse(projection) : projection;
    const parsedSort = typeof sort === 'string' ? JSON.parse(sort) : sort;

    // Cap limit at 100 with a minimum of 1
    const rawLimit = parseInt(limit) || 10;
    const parsedLimit = Math.max(1, Math.min(rawLimit, 100));

    // Validate all user-supplied objects against the operator allow-list.
    // This runs BEFORE any data reaches the MongoDB driver.
    validateOperators(parsedFilter, 'filter');
    validateOperators(parsedProjection, 'projection');
    validateOperators(parsedSort, 'sort');

    const startTime = Date.now();

    const results = await db.collection('reports')
      .find(parsedFilter)
      .project(parsedProjection)
      .sort(parsedSort)
      .limit(parsedLimit)
      .toArray();

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      query: {
        filter: parsedFilter,
        projection: parsedProjection,
        sort: parsedSort,
        limit: parsedLimit
      },
      executionTimeMs: executionTime,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error in customQuery:', error.message);

    // Provide helpful error for invalid JSON
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON in query parameters',
        details: error.message
      });
    }

    // Operator validation failures (thrown by validateOperators)
    if (error.message.includes('not permitted') || error.message.includes('allow-list')) {
      return res.status(400).json({
        success: false,
        error: 'Disallowed operator in query',
        details: error.message
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};
