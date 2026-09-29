// ═══════════════════════════════════════════════════════════
// seed/seedData.js — Database Seed Script
// ═══════════════════════════════════════════════════════════
// Run with:  npm run seed
//
// This script connects to DocumentDB, clears existing data,
// inserts 5 sample inspection reports (3 different types with
// variable schemas), creates 3 templates, and sets up indexes.
//
// PREREQUISITE: Phase 1 and Phase 2 must be complete.
// The .env file must have valid DocumentDB credentials.
// ═══════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { connectToDatabase, closeConnection } = require('../config/database');

// ─── Sample Reports (3 Different Types = Variable Schema!) ──

const sampleReports = [
  // ────────────────────────────────────────────────────────
  // REPORT 1: Vehicle Inspection (Schema: vehicleDetails)
  // ────────────────────────────────────────────────────────
  {
    reportId: 'RPT-2024-001',
    type: 'vehicle',
    status: 'completed',
    createdAt: new Date('2024-10-15T10:30:00Z'),
    updatedAt: new Date('2024-10-15T12:00:00Z'),
    inspector: {
      name: 'Rahul Sharma',
      employeeId: 'EMP-042',
      department: 'Transport'
    },
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      coordinates: { lat: 12.9716, lng: 77.5946 }
    },
    vehicleDetails: {
      registrationNumber: 'KA01AB1234',
      make: 'Tata',
      model: 'Nexon',
      year: 2022,
      fuelType: 'diesel'
    },
    findings: [
      { component: 'brakes', condition: 'worn', severity: 'high', notes: 'Brake pads need replacement within 1000km' },
      { component: 'engine', condition: 'good', severity: 'low', notes: 'Running smoothly, oil level normal' },
      { component: 'tyres', condition: 'fair', severity: 'medium', notes: 'Front left tyre tread low — 3mm remaining' },
      { component: 'suspension', condition: 'good', severity: 'low', notes: 'No noise, proper alignment' }
    ],
    overallRating: 'fail',
    tags: ['urgent', 'safety-critical']
  },

  // ────────────────────────────────────────────────────────
  // REPORT 2: Building Inspection (Schema: buildingDetails, compliance)
  // ────────────────────────────────────────────────────────
  {
    reportId: 'RPT-2024-002',
    type: 'building',
    status: 'in_progress',
    createdAt: new Date('2024-10-16T09:00:00Z'),
    updatedAt: new Date('2024-10-16T14:30:00Z'),
    inspector: {
      name: 'Priya Patel',
      employeeId: 'EMP-078',
      department: 'Civil Engineering'
    },
    location: {
      address: '42, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    buildingDetails: {
      name: 'Sunrise Towers',
      type: 'residential',
      floors: 12,
      yearBuilt: 2018,
      occupancy: 85
    },
    findings: [
      {
        area: 'fire_safety',
        items: [
          { item: 'fire_extinguishers', status: 'expired', count: 5 },
          { item: 'fire_exits', status: 'blocked', floors: [3, 7] },
          { item: 'smoke_detectors', status: 'functional', count: 48 }
        ]
      },
      {
        area: 'structural',
        items: [
          { item: 'foundation', status: 'stable', notes: 'No cracks observed' },
          { item: 'walls', status: 'minor_cracks', notes: 'Hairline cracks on floor 5 exterior' }
        ]
      },
      {
        area: 'plumbing',
        items: [
          { item: 'water_supply', status: 'functional', notes: 'Adequate pressure all floors' },
          { item: 'drainage', status: 'partial_blockage', notes: 'Slow drainage on floor 9' }
        ]
      }
    ],
    compliance: {
      fireCode: false,
      buildingCode: true,
      electricalCode: true
    },
    overallRating: 'conditional_pass',
    tags: ['fire-safety', 'follow-up-required']
  },

  // ────────────────────────────────────────────────────────
  // REPORT 3: Food Safety Inspection (Schema: temperatureLog, scores)
  // ────────────────────────────────────────────────────────
  {
    reportId: 'RPT-2024-003',
    type: 'food_safety',
    status: 'completed',
    createdAt: new Date('2024-10-17T11:00:00Z'),
    updatedAt: new Date('2024-10-17T13:00:00Z'),
    inspector: {
      name: 'Amit Kumar',
      employeeId: 'EMP-091',
      department: 'Health'
    },
    location: {
      establishmentName: 'Spice Garden Restaurant',
      address: '15, Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      licenseNumber: 'FSSAI-2024-78901'
    },
    findings: [
      { category: 'hygiene', score: 7, maxScore: 10, notes: 'Kitchen area needs deep cleaning' },
      { category: 'storage', score: 9, maxScore: 10, notes: 'Proper refrigeration maintained' },
      { category: 'pest_control', score: 5, maxScore: 10, notes: 'Evidence of rodent activity near storage' },
      { category: 'food_handling', score: 8, maxScore: 10, notes: 'Staff use gloves, minor cross-contamination risk' }
    ],
    temperatureLog: [
      { item: 'refrigerator_1', temp: 3.5, unit: 'celsius', status: 'ok' },
      { item: 'refrigerator_2', temp: 4.1, unit: 'celsius', status: 'ok' },
      { item: 'freezer_1', temp: -18.2, unit: 'celsius', status: 'ok' },
      { item: 'hot_display', temp: 58.0, unit: 'celsius', status: 'warning' },
      { item: 'salad_bar', temp: 6.8, unit: 'celsius', status: 'ok' }
    ],
    overallScore: 72.5,
    maxScore: 100,
    overallRating: 'pass',
    tags: ['pest-issue', 'routine']
  },

  // ────────────────────────────────────────────────────────
  // REPORT 4: Another Vehicle (same type, different data)
  // ────────────────────────────────────────────────────────
  {
    reportId: 'RPT-2024-004',
    type: 'vehicle',
    status: 'completed',
    createdAt: new Date('2024-10-18T08:00:00Z'),
    updatedAt: new Date('2024-10-18T09:30:00Z'),
    inspector: {
      name: 'Rahul Sharma',
      employeeId: 'EMP-042',
      department: 'Transport'
    },
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      coordinates: { lat: 12.9352, lng: 77.6245 }
    },
    vehicleDetails: {
      registrationNumber: 'KA05CD5678',
      make: 'Maruti',
      model: 'Swift',
      year: 2023,
      fuelType: 'petrol'
    },
    findings: [
      { component: 'brakes', condition: 'good', severity: 'low', notes: 'Brake system in excellent condition' },
      { component: 'engine', condition: 'good', severity: 'low', notes: 'No issues detected' },
      { component: 'lights', condition: 'faulty', severity: 'medium', notes: 'Left headlight dim — bulb replacement needed' },
      { component: 'exhaust', condition: 'good', severity: 'low', notes: 'Emissions within limits' }
    ],
    overallRating: 'pass',
    tags: ['routine']
  },

  // ────────────────────────────────────────────────────────
  // REPORT 5: Another Building (compliant)
  // ────────────────────────────────────────────────────────
  {
    reportId: 'RPT-2024-005',
    type: 'building',
    status: 'completed',
    createdAt: new Date('2024-10-19T10:00:00Z'),
    updatedAt: new Date('2024-10-19T16:00:00Z'),
    inspector: {
      name: 'Priya Patel',
      employeeId: 'EMP-078',
      department: 'Civil Engineering'
    },
    location: {
      address: '8, Brigade Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001'
    },
    buildingDetails: {
      name: 'Tech Park Plaza',
      type: 'commercial',
      floors: 8,
      yearBuilt: 2020,
      occupancy: 92
    },
    findings: [
      {
        area: 'fire_safety',
        items: [
          { item: 'fire_extinguishers', status: 'functional', count: 24 },
          { item: 'fire_exits', status: 'clear', floors: [] },
          { item: 'sprinklers', status: 'functional', coverage: '100%' }
        ]
      },
      {
        area: 'electrical',
        items: [
          { item: 'wiring', status: 'up_to_code', notes: 'Recently rewired in 2023' },
          { item: 'backup_generator', status: 'functional', capacity: '500kVA' }
        ]
      },
      {
        area: 'elevator',
        items: [
          { item: 'passenger_lift_1', status: 'functional', lastService: '2024-09-15' },
          { item: 'passenger_lift_2', status: 'functional', lastService: '2024-09-15' },
          { item: 'cargo_lift', status: 'functional', lastService: '2024-08-20' }
        ]
      }
    ],
    compliance: {
      fireCode: true,
      buildingCode: true,
      electricalCode: true
    },
    overallRating: 'pass',
    tags: ['routine', 'compliant']
  }
];

// ─── Sample Templates ────────────────────────────────────

const sampleTemplates = [
  {
    templateId: 'TMPL-001',
    name: 'Vehicle Inspection Template',
    type: 'vehicle',
    version: '1.0',
    description: 'Standard vehicle inspection form for registration renewal and safety checks',
    fields: [
      { name: 'registrationNumber', label: 'Registration Number', type: 'string', required: true, placeholder: 'e.g., KA01AB1234' },
      { name: 'make', label: 'Vehicle Make', type: 'string', required: true, placeholder: 'e.g., Tata, Maruti' },
      { name: 'model', label: 'Vehicle Model', type: 'string', required: true, placeholder: 'e.g., Nexon, Swift' },
      { name: 'year', label: 'Year of Manufacture', type: 'number', required: true, placeholder: 'e.g., 2022' },
      { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'], required: true }
    ],
    findingFields: [
      { name: 'component', label: 'Component', type: 'string', required: true, placeholder: 'e.g., brakes, engine, tyres' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['good', 'fair', 'worn', 'faulty'], required: true },
      { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high'], required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false, placeholder: 'Additional observations...' }
    ],
    ratingOptions: ['pass', 'fail', 'conditional_pass'],
    createdAt: new Date('2024-10-01T00:00:00Z'),
    updatedAt: new Date('2024-10-01T00:00:00Z')
  },
  {
    templateId: 'TMPL-002',
    name: 'Building Inspection Template',
    type: 'building',
    version: '1.0',
    description: 'Building safety and compliance inspection for residential and commercial structures',
    fields: [
      { name: 'name', label: 'Building Name', type: 'string', required: true, placeholder: 'e.g., Sunrise Towers' },
      { name: 'buildingType', label: 'Building Type', type: 'select', options: ['residential', 'commercial', 'industrial', 'mixed'], required: true },
      { name: 'floors', label: 'Number of Floors', type: 'number', required: true, placeholder: 'e.g., 12' },
      { name: 'yearBuilt', label: 'Year Built', type: 'number', required: true, placeholder: 'e.g., 2018' },
      { name: 'occupancy', label: 'Occupancy (%)', type: 'number', required: false, placeholder: 'e.g., 85' },
      { name: 'address', label: 'Full Address', type: 'string', required: true, placeholder: 'e.g., 42, MG Road' },
      { name: 'pincode', label: 'Pincode', type: 'string', required: true, placeholder: 'e.g., 400001' }
    ],
    findingFields: [
      { name: 'area', label: 'Inspection Area', type: 'select', options: ['fire_safety', 'structural', 'electrical', 'plumbing', 'elevator'], required: true },
      { name: 'items', label: 'Items Checked', type: 'array', required: true }
    ],
    complianceFields: [
      { name: 'fireCode', label: 'Fire Code', type: 'boolean' },
      { name: 'buildingCode', label: 'Building Code', type: 'boolean' },
      { name: 'electricalCode', label: 'Electrical Code', type: 'boolean' }
    ],
    ratingOptions: ['pass', 'fail', 'conditional_pass'],
    createdAt: new Date('2024-10-01T00:00:00Z'),
    updatedAt: new Date('2024-10-01T00:00:00Z')
  },
  {
    templateId: 'TMPL-003',
    name: 'Food Safety Inspection Template',
    type: 'food_safety',
    version: '1.0',
    description: 'FSSAI food safety and hygiene inspection for restaurants and food establishments',
    fields: [
      { name: 'establishmentName', label: 'Establishment Name', type: 'string', required: true, placeholder: 'e.g., Spice Garden Restaurant' },
      { name: 'licenseNumber', label: 'FSSAI License Number', type: 'string', required: true, placeholder: 'e.g., FSSAI-2024-78901' },
      { name: 'address', label: 'Address', type: 'string', required: true, placeholder: 'e.g., 15, Park Street' }
    ],
    findingFields: [
      { name: 'category', label: 'Category', type: 'select', options: ['hygiene', 'storage', 'pest_control', 'food_handling', 'water_quality'], required: true },
      { name: 'score', label: 'Score', type: 'number', required: true, placeholder: '0-10' },
      { name: 'maxScore', label: 'Max Score', type: 'number', required: true, placeholder: '10' },
      { name: 'notes', label: 'Notes', type: 'text', required: false, placeholder: 'Observations...' }
    ],
    temperatureFields: [
      { name: 'item', label: 'Equipment', type: 'string', required: true },
      { name: 'temp', label: 'Temperature', type: 'number', required: true },
      { name: 'unit', label: 'Unit', type: 'select', options: ['celsius', 'fahrenheit'], required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['ok', 'warning', 'critical'], required: true }
    ],
    ratingOptions: ['pass', 'fail', 'conditional_pass'],
    createdAt: new Date('2024-10-01T00:00:00Z'),
    updatedAt: new Date('2024-10-01T00:00:00Z')
  }
];

// ─── Main Seed Function ──────────────────────────────────

async function seedDatabase() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🌱 Database Seed Script');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    const db = await connectToDatabase();

    // Step 1: Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.collection('reports').deleteMany({});
    await db.collection('templates').deleteMany({});
    console.log('   ✓ Existing data cleared\n');

    // Step 2: Insert reports
    console.log('📄 Inserting sample reports...');
    const reportResult = await db.collection('reports').insertMany(sampleReports);
    console.log(`   ✓ Inserted ${reportResult.insertedCount} reports`);
    sampleReports.forEach(r => {
      console.log(`     - ${r.reportId} (${r.type}) — ${r.overallRating}`);
    });
    console.log('');

    // Step 3: Insert templates
    console.log('📋 Inserting report templates...');
    const templateResult = await db.collection('templates').insertMany(sampleTemplates);
    console.log(`   ✓ Inserted ${templateResult.insertedCount} templates`);
    sampleTemplates.forEach(t => {
      console.log(`     - ${t.templateId} (${t.type}) — ${t.name}`);
    });
    console.log('');

    // Step 4: Create indexes
    console.log('📇 Creating indexes...');

    const indexes = [
      { spec: { reportId: 1 }, options: { unique: true, name: 'idx_reportId' } },
      { spec: { type: 1 }, options: { name: 'idx_type' } },
      { spec: { status: 1 }, options: { name: 'idx_status' } },
      { spec: { createdAt: -1 }, options: { name: 'idx_createdAt' } },
      { spec: { 'inspector.employeeId': 1 }, options: { name: 'idx_inspector_empId' } },
      { spec: { 'inspector.name': 1 }, options: { name: 'idx_inspector_name' } },
      { spec: { 'location.city': 1 }, options: { name: 'idx_location_city' } },
      { spec: { tags: 1 }, options: { name: 'idx_tags' } },
      { spec: { overallRating: 1 }, options: { name: 'idx_overallRating' } },
      { spec: { 'findings.severity': 1 }, options: { name: 'idx_findings_severity' } },
    ];

    for (const idx of indexes) {
      await db.collection('reports').createIndex(idx.spec, idx.options);
      console.log(`   ✓ Index: ${idx.options.name}`);
    }

    // Template indexes
    await db.collection('templates').createIndex({ type: 1 }, { unique: true, name: 'idx_template_type' });
    console.log('   ✓ Index: idx_template_type');
    console.log('');

    // Step 5: Verify
    console.log('🔍 Verifying data...');
    const reportCount = await db.collection('reports').countDocuments();
    const templateCount = await db.collection('templates').countDocuments();
    const distinctTypes = await db.collection('reports').distinct('type');
    console.log(`   Reports:   ${reportCount}`);
    console.log(`   Templates: ${templateCount}`);
    console.log(`   Types:     ${distinctTypes.join(', ')}`);
    console.log('');

    // Step 6: Show variable schema proof
    console.log('📊 Variable Schema Demonstration:');
    for (const type of distinctTypes) {
      const sample = await db.collection('reports').findOne({ type });
      const fields = Object.keys(sample).filter(k => k !== '_id');
      console.log(`   ${type}: ${fields.length} fields → [${fields.join(', ')}]`);
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅ Database seeded successfully!');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('');
    console.error('❌ Seeding failed:', error.message);
    console.error('');
    console.error('   Make sure:');
    console.error('   1. Phase 1 is complete (DocumentDB cluster is running)');
    console.error('   2. .env has correct credentials');
    console.error('   3. You are running this from an EC2 instance in the same VPC');
    console.error('   4. global-bundle.pem is in the project root');
    console.error('');
  } finally {
    await closeConnection();
  }
}

seedDatabase();
