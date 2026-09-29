// ═══════════════════════════════════════════════════════════
// config/database.js — Amazon DocumentDB Connection Module
// ═══════════════════════════════════════════════════════════
// This module handles connecting to Amazon DocumentDB with
// TLS encryption. DocumentDB requires:
//   1. TLS certificate (global-bundle.pem)
//   2. retryWrites=false  (DocumentDB does NOT support retryable writes)
//   3. directConnection=true
//
// NOTE: The global-bundle.pem file must be downloaded on the
// EC2 instance during Phase 1 setup:
//   wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
// ═══════════════════════════════════════════════════════════

const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

let db = null;
let client = null;

/**
 * Connect to Amazon DocumentDB cluster.
 * Uses TLS with the AWS global CA bundle.
 * Returns the database instance.
 */
async function connectToDatabase() {
  if (db) return db;

  const caFilePath = path.join(__dirname, '..', 'global-bundle.pem');

  // Check if TLS certificate exists
  if (!fs.existsSync(caFilePath)) {
    console.warn('⚠️  TLS certificate (global-bundle.pem) not found at:', caFilePath);
    console.warn('   Download it on EC2 with:');
    console.warn('   wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem');
    console.warn('');
    console.warn('   Attempting connection without TLS (will fail on DocumentDB)...');
  }

  // Build the connection URI
  // CRITICAL: retryWrites=false is REQUIRED for DocumentDB compatibility
  const tlsOptions = fs.existsSync(caFilePath)
    ? `tls=true&tlsCAFile=${caFilePath}&retryWrites=false&directConnection=true`
    : 'retryWrites=false&directConnection=true';

  const uri = `mongodb://${encodeURIComponent(process.env.DOCDB_USERNAME)}:${encodeURIComponent(process.env.DOCDB_PASSWORD)}@${process.env.DOCDB_HOST}:${process.env.DOCDB_PORT}/?${tlsOptions}`;

  try {
    console.log('🔌 Connecting to Amazon DocumentDB...');
    console.log(`   Host: ${process.env.DOCDB_HOST}`);
    console.log(`   Port: ${process.env.DOCDB_PORT}`);
    console.log(`   Database: ${process.env.DOCDB_DATABASE}`);

    client = new MongoClient(uri, {
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 1,
      // Timeouts
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    db = client.db(process.env.DOCDB_DATABASE);

    // Verify connection with a ping
    await db.command({ ping: 1 });

    console.log('✅ Connected to Amazon DocumentDB successfully!');
    console.log(`   Database: ${process.env.DOCDB_DATABASE}`);
    return db;
  } catch (error) {
    console.error('❌ DocumentDB connection failed:', error.message);
    console.error('');
    console.error('   Common fixes:');
    console.error('   1. Ensure EC2 and DocumentDB are in the SAME VPC');
    console.error('   2. Check Security Group allows port 27017');
    console.error('   3. Verify credentials in .env file');
    console.error('   4. Ensure global-bundle.pem is present');
    process.exit(1);
  }
}

/**
 * Get the current database instance.
 * Throws if not connected yet.
 */
function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection gracefully.
 */
async function closeConnection() {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log('🔌 DocumentDB connection closed');
  }
}

module.exports = { connectToDatabase, getDb, closeConnection };
