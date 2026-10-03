// ═══════════════════════════════════════════════════════════
// server.js — Pure REST API Server (No Views)
// ═══════════════════════════════════════════════════════════
// Amazon DocumentDB Inspection Report System — Backend
// Project: 24CC3014-P070 | Team: T211
//
// The frontend is a separate React app. This server
// only exposes JSON API endpoints.
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectToDatabase, closeConnection } = require('./config/database');

const reportRoutes = require('./routes/reportRoutes');
const queryRoutes = require('./routes/queryRoutes');
const templateRoutes = require('./routes/templateRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ──────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── API Routes ──────────────────────────────────────────
app.use('/api/reports', reportRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/templates', templateRoutes);

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const { getDb } = require('./config/database');
    const db = getDb();
    await db.command({ ping: 1 });
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// ─── Database Health Check ───────────────────────────────
// GET /api/health/db — Dedicated endpoint that pings DocumentDB
// and returns 200 {status:'ok'} or 503 {status:'error'}.
// Useful for load-balancer and monitoring health probes.
app.get('/api/health/db', async (req, res) => {
  try {
    const { getDb } = require('./config/database');
    const db = getDb();
    await db.command({ ping: 1 });
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// ─── Serve React build in production ─────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendBuild));
  // Fall back to index.html for non-API routes (SPA client-side routing).
  // Regex excludes /api/* so the JSON 404 handler below still fires for
  // unmatched API paths.
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', path: req.originalUrl });
});

// ─── Global Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ─── Start Server ────────────────────────────────────────
async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('  🚀 Inspection Report API — Running');
      console.log('═══════════════════════════════════════════════════');
      console.log(`  API URL:     http://0.0.0.0:${PORT}/api`);
      console.log(`  Health:      http://0.0.0.0:${PORT}/api/health`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('═══════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ───────────────────────────────────
process.on('SIGINT', async () => { console.log('\n📡 Shutting down...'); await closeConnection(); process.exit(0); });
process.on('SIGTERM', async () => { await closeConnection(); process.exit(0); });
process.on('uncaughtException', (e) => { console.error('❌ Uncaught:', e.message); process.exit(1); });

startServer();
