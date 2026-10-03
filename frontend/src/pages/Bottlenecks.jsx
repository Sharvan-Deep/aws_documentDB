import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  DollarSign,
  Code2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Zap,
  Copy,
  Check,
  Info,
  TrendingDown,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  Cpu
} from 'lucide-react';
import { toast } from 'sonner';

export default function Bottlenecks() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Compatibility Matrix ─────────────────────────────────
  // Rebuilt from SKILL.md section 5 only.
  // "Supported, but..." rows reflect confirmed documentation.
  // "To test on cluster" rows are not yet observed on our cluster.
  // ─────────────────────────────────────────────────────────

  // Confirmed items (from SKILL.md §5 / AWS docs)
  const confirmedItems = [
    {
      feature: 'retryWrites',
      category: 'Driver / Protocol',
      mongo: { status: 'supported', label: 'Supported' },
      docdb: { status: 'limited', label: 'Supported only from engine 8.0.2' },
      fix: 'Set retryWrites=false in connection string',
      detail: 'Retryable writes are supported only from engine 8.0.2. We use engine 5.0, so we set retryWrites=false in the connection URI. Source: AWS documentation.'
    },
    {
      feature: '$text search / Text indexes',
      category: 'Search & Indexing',
      mongo: { status: 'supported', label: 'Full-text search' },
      docdb: { status: 'limited', label: 'Supported, but tokenisation differs from MongoDB' },
      fix: 'Use $regex for case-insensitive text searches',
      detail: 'DocumentDB has native text indexes, but tokenisation differs from MongoDB and matching is case-insensitive. It is not an unsupported feature. We use $regex for our search to avoid tokenisation differences. Source: AWS documentation.'
    },
    {
      feature: 'Nested Document Queries',
      category: 'Querying',
      mongo: { status: 'supported', label: 'Full' },
      docdb: { status: 'supported', label: 'Supported' },
      fix: 'Works as expected',
      detail: 'Dot-notation queries like findings.severity and location.city query seamlessly into subdocuments. Confirmed working in the Query Playground.'
    },
    {
      feature: 'Array Queries ($in, $all, $elemMatch)',
      category: 'Querying',
      mongo: { status: 'supported', label: 'Full' },
      docdb: { status: 'supported', label: 'Supported' },
      fix: 'Works as expected',
      detail: 'Operators $in, $nin, $all, and $elemMatch are in the allow-list and expected to work. $elemMatch is used to match two conditions on the same array element. Confirm on the cluster.'
    },
    {
      feature: 'Aggregation Pipelines ($group, $sort, $match …)',
      category: 'Analytics',
      mongo: { status: 'supported', label: 'Full' },
      docdb: { status: 'supported', label: 'Supported' },
      fix: 'Works as expected',
      detail: 'Core aggregation operators $group, $match, $sort, $project, $unwind execute with high performance. Used for all dashboard charts and inspector stats. Expected to work; confirm on the cluster.'
    },
    {
      feature: 'Indexes (B-tree, compound, unique)',
      category: 'Search & Indexing',
      mongo: { status: 'supported', label: 'Full' },
      docdb: { status: 'supported', label: 'Supported' },
      fix: 'Works as expected',
      detail: 'Single-field, compound, unique, and sparse B-tree indexes are set up by the seed script. Expected to work; confirm on the cluster.'
    },
    {
      feature: 'Multi-document transactions',
      category: 'Concurrency',
      mongo: { status: 'supported', label: 'Full ACID' },
      docdb: { status: 'limited', label: 'Supported on 4.0+ [confirm]' },
      fix: 'All mutations are single-document ($set, $push) — transactions not needed',
      detail: 'Per a third-party migration guide, multi-document transactions are supported on 4.0 and later. Not confirmed in AWS docs. All our operations are single-document; we do not rely on multi-doc transactions.'
    }
  ];

  // Items that must be tested on our cluster before claiming as a gap
  const toTestItems = [
    {
      feature: '$lookup (joins)',
      category: 'Aggregation',
      note: 'Not used in this project. SKILL.md says to test on cluster before claiming as a gap.',
      observedError: '[insert from live test]'
    },
    {
      feature: '$merge',
      category: 'Aggregation',
      note: 'Not used. $out or client-side upsert used instead. Test on cluster to confirm.',
      observedError: '[insert from live test]'
    },
    {
      feature: 'Change Streams',
      category: 'Real-time Events',
      note: 'Not used. Replaced with polling. Test on cluster to confirm behaviour.',
      observedError: '[insert from live test]'
    },
    {
      feature: 'directConnection behaviour',
      category: 'Driver / Protocol',
      note: 'directConnection=true is set in our connection string. This is a choice, not yet confirmed to be required on the cluster.',
      observedError: '[insert from live test]'
    }
  ];

  const filteredFeatures = confirmedItems.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'supported') return item.docdb.status === 'supported';
    if (filterType === 'limited') return item.docdb.status === 'limited';
    return true;
  });

  const getBadge = (status, label) => {
    if (status === 'supported') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {label}
        </span>
      );
    }
    if (status === 'limited') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        {label}
      </span>
    );
  };

  // Code Fix Snippets
  const codeFixes = [
    {
      id: 'connection',
      title: '1. Connection String: Disabling retryWrites',
      filePath: 'backend/config/database.js',
      description:
        'Retryable writes are supported only from Amazon DocumentDB engine 8.0.2. We use engine 5.0, so retryWrites=true would cause write operations to fail. We set retryWrites=false explicitly in the connection URI.',
      code: `// config/database.js — DocumentDB connection URI
const tlsOptions = fs.existsSync(caFilePath)
  ? \`tls=true&tlsCAFile=\${caFilePath}&retryWrites=false&directConnection=true\`
  : 'retryWrites=false&directConnection=true';

const uri = \`mongodb://\${encodeURIComponent(process.env.DOCDB_USERNAME)}:\` +
  \`\${encodeURIComponent(process.env.DOCDB_PASSWORD)}@\` +
  \`\${process.env.DOCDB_HOST}:\${process.env.DOCDB_PORT}/?\${tlsOptions}\`;

// Instantiate MongoClient with explicit connection pool options
const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 1,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
});`
    },
    {
      id: 'search',
      title: '2. Search Implementation: $regex instead of $text',
      filePath: 'backend/controllers/reportController.js',
      description:
        'DocumentDB has text indexes but tokenisation differs from MongoDB. We use case-insensitive $regex matching to avoid tokenisation differences and ensure predictable behaviour.',
      code: `// controllers/reportController.js — Case-insensitive regex filter
// ❌ MongoDB pattern (may produce different results in DocumentDB due to tokenisation differences)
// const filter = { $text: { $search: searchTerm } };

// ✅ DocumentDB safe pattern: $regex with 'i' flag
const filter = {};
if (type) filter.type = type;
if (status) filter.status = status;
if (city) filter['location.city'] = { $regex: city, $options: 'i' };
if (inspector) filter['inspector.name'] = { $regex: inspector, $options: 'i' };

// Execute query with sorting & pagination
const reports = await db.collection('reports')
  .find(filter)
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(parseInt(limit))
  .toArray();`
    },
    {
      id: 'driver',
      title: '3. Node.js Driver Compatibility: mongodb@5.9.2',
      filePath: 'backend/package.json',
      description:
        'DocumentDB emulates MongoDB 5.0 wire protocols. Pinning mongodb to ^5.9.2 ensures TLS CA bundle stability and avoids authentication handshake issues that can occur with newer driver versions.',
      code: `// backend/package.json
{
  "name": "inspection-app-backend",
  "version": "1.0.0",
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "mongodb": "^5.9.2"
  }
}

// Key considerations:
// 1. mongodb v5.x supports TLS CA file parameters reliably with AWS global-bundle.pem
// 2. Stay on v5 unless a newer version has been tested on our cluster
// 3. directConnection=true — choice still to be tested on the cluster`
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Zap className="w-3 h-3 text-blue-600" />
              Phase 5
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Advanced Queries &amp; Bottleneck Handling
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            MongoDB vs DocumentDB Compatibility &amp; Optimization
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-3xl">
            A comprehensive overview of architectural mitigations, API compatibility differences,
            cost optimization techniques, and driver configurations implemented in this project.
            Sources: SKILL.md §5 and AWS documentation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-50 rounded-lg border border-slate-200 text-right">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              DocumentDB Engine
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              v5.0 Compatible
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Confirmed Compatibility Table */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                MongoDB vs Amazon DocumentDB Compatibility Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Confirmed items from SKILL.md §5 and AWS documentation. Items not yet tested on the cluster are in the "To test on cluster" section below.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({confirmedItems.length})
            </button>
            <button
              onClick={() => setFilterType('supported')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterType === 'supported'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Supported ({confirmedItems.filter(i => i.docdb.status === 'supported').length})
            </button>
            <button
              onClick={() => setFilterType('limited')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterType === 'limited'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Limited ({confirmedItems.filter(i => i.docdb.status === 'limited').length})
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-1/4">Feature / Operator</th>
                  <th className="py-3.5 px-4 w-1/6">MongoDB</th>
                  <th className="py-3.5 px-4 w-1/6">DocumentDB</th>
                  <th className="py-3.5 px-4 w-1/3">Our Fix &amp; Engineering Solution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredFeatures.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {row.feature}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{row.category}</div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      {getBadge(row.mongo.status, row.mongo.label)}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      {getBadge(row.docdb.status, row.docdb.label)}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-medium text-slate-900 flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold">→</span>
                        <span>{row.fix}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 pl-4 leading-relaxed">
                        {row.detail}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 2: To Test on Cluster */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              To Test on Cluster
            </h2>
            <p className="text-xs text-slate-500">
              These items cannot be classified until tested on our live cluster. None are used in production code.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-1/4">Feature</th>
                  <th className="py-3.5 px-4 w-1/6">Category</th>
                  <th className="py-3.5 px-4">Note</th>
                  <th className="py-3.5 px-4 w-1/4">Observed Error (live test)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {toTestItems.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 align-top font-mono font-bold text-slate-900 text-sm">{row.feature}</td>
                    <td className="py-3.5 px-4 align-top text-xs text-slate-500">{row.category}</td>
                    <td className="py-3.5 px-4 align-top text-xs text-slate-600 leading-relaxed">{row.note}</td>
                    <td className="py-3.5 px-4 align-top">
                      <span className="text-xs font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                        {row.observedError}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 3: Cost Optimization Panel */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Cost Optimization Strategy
            </h2>
            <p className="text-xs text-slate-500">
              Pragmatic AWS resource sizing and lifecycle management to minimize cloud expenses.
            </p>
          </div>
        </div>

        {/* 4 Strategy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Instance Sizing</span>
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">db.t3.medium</div>
            <p className="text-xs text-slate-500 mt-1">
              One instance, small class. Cheapest burstable tier for demo use.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Topology</span>
              <TrendingDown className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Single Node</div>
            <p className="text-xs text-slate-500 mt-1">
              One instance instead of a 3-node HA replica set. All functionality retained for the demo.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Idle Lifecycle</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Stop When Idle</div>
            <p className="text-xs text-slate-500 mt-1">
              Stop the app, then stop the cluster when not in use. Saves compute cost to zero while stopped.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Post-Demo</span>
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Delete at End</div>
            <p className="text-xs text-slate-500 mt-1">
              Delete the cluster and EC2 instance after the demo to eliminate all ongoing costs.
            </p>
          </div>
        </div>

        {/* Strategies Detail */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Cost-Saving Approach
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                Single Instance Architecture
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                By default, Amazon DocumentDB provisions 3 instances (1 primary writer + 2 replicas) for high availability across AZs. For the demo, we provision a <strong>single instance</strong>, achieving a significant cost reduction while retaining all database functionality.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">2</span>
                db.t3.medium Instance Class
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Selected the <strong>db.t3.medium</strong> instance class — the smallest available, providing burstable CPU credits that gracefully absorb inspection report aggregation queries without paying for idle compute.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">3</span>
                Stop Cluster When Not In Use
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Amazon DocumentDB supports cluster-level <code>stop</code> and <code>start</code>. Stop the app first, then stop the cluster. AWS automatically restarts a stopped cluster after 7 days.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</span>
                Delete After Demo
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Delete the cluster and the EC2 instance after the demo is complete. This eliminates all ongoing costs. Watch the Learner Lab budget shown on the lab page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Key Code Fixes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Production Code Fixes &amp; Implementation Details
            </h2>
            <p className="text-xs text-slate-500">
              Real code snippets illustrating the exact fixes applied across our Node.js and Express backend.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {codeFixes.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{item.filePath}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(item.code, item.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm self-start sm:self-auto"
                >
                  {copiedKey === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      Copy Snippet
                    </>
                  )}
                </button>
              </div>

              {/* Description */}
              <div className="px-5 py-3 text-xs text-slate-600 bg-white border-b border-slate-100 leading-relaxed">
                {item.description}
              </div>

              {/* Code Area */}
              <div className="bg-[#0D1117] p-4 text-xs font-mono overflow-x-auto text-slate-200">
                <pre className="leading-relaxed whitespace-pre font-mono">
                  <code>{item.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
