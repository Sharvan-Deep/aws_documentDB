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

  // Compatibility Data
  const compatibilityData = [
    {
      feature: 'retryWrites',
      category: 'Driver / Protocol',
      mongo: { status: 'supported', label: 'Supported' },
      docdb: { status: 'unsupported', label: 'Not supported' },
      fix: 'Set retryWrites=false in connection string',
      detail: 'DocumentDB does not support retryable writes. Setting retryWrites=true causes write operations to fail immediately.'
    },
    {
      feature: '$lookup (joins)',
      category: 'Aggregation',
      mongo: { status: 'supported', label: 'Full support' },
      docdb: { status: 'limited', label: 'Limited' },
      fix: 'Embed related data instead of referencing',
      detail: 'DocumentDB has query shape constraints on multi-stage $lookup joins across collections; denormalized schema avoids joins completely.'
    },
    {
      feature: 'Change Streams',
      category: 'Real-time Events',
      mongo: { status: 'supported', label: 'Full support' },
      docdb: { status: 'limited', label: 'Limited' },
      fix: 'Use polling instead of real-time streams',
      detail: 'DocumentDB Change Streams require specific cluster parameter groups enabled and have limitations on event filtering.'
    },
    {
      feature: 'Transactions',
      category: 'Concurrency',
      mongo: { status: 'supported', label: 'Multi-doc' },
      docdb: { status: 'limited', label: 'Single-doc only' },
      fix: 'Design for single-document atomicity',
      detail: 'Multi-document ACID transactions across multiple collections have constraints. Embed inspection items within single inspection document.'
    },
    {
      feature: '$merge',
      category: 'Aggregation',
      mongo: { status: 'supported', label: 'Supported' },
      docdb: { status: 'unsupported', label: 'Not supported' },
      fix: 'Use $out or manual insert after aggregate',
      detail: 'The $merge pipeline stage is not available in DocumentDB. Use $out to create a target collection or materialize via client code.'
    },
    {
      feature: '$text search',
      category: 'Search & Indexing',
      mongo: { status: 'supported', label: 'Supported' },
      docdb: { status: 'unsupported', label: 'Not supported' },
      fix: 'Use $regex for text-like searches',
      detail: 'DocumentDB lacks text indexes (text index type and $text query operator). Regex with case-insensitive option "i" provides search capabilities.'
    },
    {
      feature: 'Aggregation Pipelines',
      category: 'Analytics',
      mongo: { status: 'supported', label: 'Full' },
      docdb: { status: 'supported', label: 'Supported' },
      fix: 'Works as expected',
      detail: 'Core aggregation operators like $group, $match, $sort, $project, $unwind, and $facet execute with high performance.'
    },
    {
      feature: 'Nested Document Queries',
      category: 'Querying',
      mongo: { status: 'supported', label: 'Full' },
      docdb: { status: 'supported', label: 'Supported' },
      fix: 'Works as expected',
      detail: 'Dot-notation queries like findings.severity and location.city query seamlessly into subdocuments.'
    },
    {
      feature: 'Array Queries ($in, $all)',
      category: 'Querying',
      mongo: { status: 'supported', label: 'Full' },
      docdb: { status: 'supported', label: 'Supported' },
      fix: 'Works as expected',
      detail: 'Operators such as $in, $nin, $all, and $elemMatch are fully compatible for querying tags, checklist arrays, and items.'
    },
    {
      feature: 'Indexes',
      category: 'Search & Indexing',
      mongo: { status: 'supported', label: 'Full' },
      docdb: { status: 'supported', label: 'Supported' },
      fix: 'Works as expected',
      detail: 'Single-field, compound, unique, and sparse B-tree indexes are supported and heavily utilized to accelerate queries.'
    }
  ];

  const filteredFeatures = compatibilityData.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'supported') return item.docdb.status === 'supported';
    if (filterType === 'limited') return item.docdb.status === 'limited';
    if (filterType === 'unsupported') return item.docdb.status === 'unsupported';
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
        'Amazon DocumentDB does not support retryable writes. In MongoDB 4.2+, retryWrites=true is default. Connecting with retryWrites=true causes write operations to immediately throw error: "Retryable writes are not supported". We configure retryWrites=false explicitly.',
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
        'MongoDB applications typically use $text indexes and queries. Amazon DocumentDB does not support text indexes. We engineered our search to leverage case-insensitive $regex matching across indexed fields with compound queries.',
      code: `// controllers/reportController.js — Case-insensitive regex filter
// ❌ MongoDB pattern (FAILS in DocumentDB: $text index unsupported)
// const filter = { $text: { $search: searchTerm } };

// ✅ DocumentDB compatible pattern: $regex with 'i' flag
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
        'DocumentDB emulates MongoDB 4.0/5.0 wire protocols. Upgrading to mongodb driver v6+ introduces newer client handshakes and authentication behaviors that can fail with DocumentDB. Pinning mongodb to ^5.9.2 ensures 100% protocol and TLS CA bundle stability.',
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
// 2. Avoids unsupported speculative authentication handshakes
// 3. directConnection=true bypasses replica set topology discovery issues in VPC`
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

      {/* Section 1: Compatibility Table */}
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
              Detailed feature comparison and engineered workarounds for DocumentDB cloud limitations.
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
              All ({compatibilityData.length})
            </button>
            <button
              onClick={() => setFilterType('supported')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterType === 'supported'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Supported (4)
            </button>
            <button
              onClick={() => setFilterType('limited')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterType === 'limited'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Limited (3)
            </button>
            <button
              onClick={() => setFilterType('unsupported')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterType === 'unsupported'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unsupported (3)
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

      {/* Section 2: Cost Optimization Panel */}
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
              Pragmatic AWS resource sizing and lifecycle management saving ~66% to 100% on cloud expenses.
            </p>
          </div>
        </div>

        {/* 4 Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Instance Sizing</span>
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">db.t3.medium</div>
            <p className="text-xs text-slate-500 mt-1">
              Cheapest DocumentDB instance class (2 vCPU, 4 GiB RAM, burstable).
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Hourly Compute Rate</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">$0.076 / hr</div>
            <p className="text-xs text-slate-500 mt-1">
              Low on-demand baseline rate for development and evaluation.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Topology Optimization</span>
              <TrendingDown className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">~66% Savings</div>
            <p className="text-xs text-slate-500 mt-1">
              Single instance (1 node) used instead of production 3-node HA replica set.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Idle State Cost</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">100% Savings</div>
            <p className="text-xs text-slate-500 mt-1">
              Cluster stopped during idle hours + deleted after hackathon.
            </p>
          </div>
        </div>

        {/* Detailed Cost Optimization Cards */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Strategies */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Key Cost-Saving Strategies Applied
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    Single Instance Architecture
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    By default, Amazon DocumentDB provisions 3 instances (1 primary writer + 2 replicas) for high availability across AZs. For the hackathon, we provisioned a <strong>single instance</strong>, achieving an immediate <strong>~66% cost reduction</strong> while retaining all database functionality.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    db.t3.medium Instance Class
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Selected the <strong>db.t3.medium</strong> instance class ($0.076/hr in us-east-1). This is the lowest-cost tier available, providing burstable CPU credits that gracefully absorb inspection report aggregation queries without paying for idle r5 compute.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    Stop Cluster When Not In Use
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Amazon DocumentDB supports cluster-level <code>stop</code> and <code>start</code>. During off-hours, pausing the cluster yields <strong>100% compute savings</strong> ($0/hr for compute while stopped, paying only pennies for standard snapshot storage).
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    Post-Hackathon Teardown
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Automated AWS CLI teardown scripts ensure complete deletion of DocumentDB cluster, subnets, and EC2 instances after the hackathon evaluation, guaranteeing <strong>$0 ongoing residual cost</strong>.
                  </p>
                </div>

              </div>
            </div>

            {/* Right 1 Col: Cost Comparison Box */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                  Budget Impact
                </div>
                <div className="text-lg font-bold">Hackathon vs Production Model</div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Comparing estimated monthly spend of standard DocumentDB configuration vs our optimized setup:
                </p>

                <div className="mt-4 space-y-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-400">Standard Production (3x db.r5.large)</div>
                    <div className="text-base font-bold text-red-400 mt-0.5">~$600+/month</div>
                    <div className="text-[11px] text-slate-400">High availability, cross-AZ failover</div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-xs text-emerald-400 font-semibold">Our Hackathon Setup (1x db.t3.medium)</div>
                    <div className="text-xl font-bold text-emerald-300 mt-0.5">~$0.076 / hour</div>
                    <div className="text-[11px] text-emerald-200">
                      Total 48-hr hackathon compute: <strong>~$3.65</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Zero waste, maximum hackathon ROI.</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Key Code Fixes */}
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
