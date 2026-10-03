import React, { useState, useEffect } from 'react';
import { queryNested, queryByType, queryByStatus, queryByCity, queryHighSeverity, querySearchTags, querySchemaAnalysis, queryCustom, queryInspectorStats, queryDateRange, queryAllowedOperators } from '../api/api';
import { motion } from 'framer-motion';
import { Terminal, Code2, Database, Zap, Search, Server, Play, StopCircle, UserCircle, Calendar, FileCheck, TextSearch, Tags, AlertTriangle, Lock, Info } from 'lucide-react';

function QueryPlayground() {
  const [results, setResults] = useState(null);
  const [meta, setMeta] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('custom'); // 'presets' or 'custom'
  const [playgroundError, setPlaygroundError] = useState(null); // 403 disabled message
  const [allowedOps, setAllowedOps] = useState(null); // from /api/queries/allowed-operators
  const [queryError, setQueryError] = useState(null); // 400 disallowed operator

  const [customQuery, setCustomQuery] = useState({
    filter: '{\n  "type": "vehicle",\n  "findings.severity": "high"\n}',
    projection: '{\n  "reportId": 1,\n  "type": 1,\n  "findings": 1\n}',
    sort: '{\n  "createdAt": -1\n}',
    limit: 10
  });

  // Load the allow-list on mount (always-on endpoint, not gated by playground flag)
  useEffect(() => {
    queryAllowedOperators()
      .then(res => setAllowedOps(res.data))
      .catch(() => {
        // Fallback: hardcode the list if the endpoint is unreachable
        // Source: backend/utils/validateQuery.js ALLOWED_DOLLAR_OPS
        setAllowedOps({
          allowedOperators: ['$eq','$ne','$gt','$gte','$lt','$lte','$in','$nin','$all','$regex','$options','$exists','$and','$or','$not','$nor','$elemMatch'],
          blockedOperators: ['$where','$function','$accumulator'],
          _source: 'hardcoded-fallback'
        });
      });
  }, []);

  const handleRun = async (apiCall, label) => {
    setLoading(true);
    setResults(null);
    setMeta('Executing query...');
    setPlaygroundError(null);
    setQueryError(null);
    try {
      const start = Date.now();
      const res = await apiCall();
      const time = Date.now() - start;
      const data = res.data;
      setResults(data);
      const count = data.count ?? data.data?.length ?? '?';
      setMeta(`${label} • ${count} results returned in ${time}ms`);
    } catch (err) {
      const status = err.response?.status;
      const errData = err.response?.data;

      if (status === 403) {
        // Query Playground is disabled — show clear message with the hint from the API
        setPlaygroundError({
          error: errData?.error || 'Query Playground is disabled.',
          hint: errData?.hint || 'Set ENABLE_QUERY_PLAYGROUND=true in .env to enable this endpoint.'
        });
        setMeta('Query Playground disabled (403)');
      } else if (status === 400 && errData?.error?.includes('operator')) {
        // Disallowed operator returned from the backend
        setQueryError(errData?.details || errData?.error || 'Disallowed operator in query');
        setMeta('Query rejected — disallowed operator (400)');
      } else {
        setResults({ error: errData?.error || err.message });
        setMeta('Query failed to execute');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustom = () => {
    handleRun(() => queryCustom({
      filter: customQuery.filter,
      projection: customQuery.projection,
      sort: customQuery.sort,
      limit: customQuery.limit
    }), 'POST /api/queries/custom');
  };

  const presets = [
    { label: 'Reports by Type', desc: 'Aggregation: group by type', call: queryByType, icon: Server },
    { label: 'Reports by Status', desc: 'Aggregation: group by status', call: queryByStatus, icon: Server },
    { label: 'High Severity Findings', desc: 'Nested: findings.severity = "high"', call: queryHighSeverity, icon: Zap },
    { label: 'Reports by City', desc: 'Aggregation: group by location.city', call: queryByCity, icon: Server },
    { label: 'Schema Analysis', desc: 'Map/Reduce: extract unique fields per type', call: querySchemaAnalysis, icon: Database },
    { label: 'Nested Object Query', desc: 'location.city = Bengaluru', call: () => queryNested('location.city', 'Bengaluru'), icon: Search },
    { label: 'Array Search (Tags)', desc: '$in operator: tags includes urgent', call: () => querySearchTags('urgent'), icon: Search },
    { label: 'Inspector Stats', desc: 'Aggregation: group by inspector', call: queryInspectorStats, icon: UserCircle },
    { label: 'Date Range Query', desc: 'Date filter: Oct 2024 reports', call: () => queryDateRange('2024-10-01', '2024-10-31'), icon: Calendar },
    { label: '$exists: Has Temperature Log', desc: '$exists: temperatureLog exists', call: () => queryCustom({ filter: { temperatureLog: { $exists: true } } }), icon: FileCheck },
    { label: "$regex: Cities starting with 'B'", desc: "$regex: location.city starts with 'B'", call: () => queryCustom({ filter: { 'location.city': { $regex: '^B', $options: 'i' } } }), icon: TextSearch },
    { label: '$all: Multiple Tags', desc: '$all: ["urgent", "safety-critical"]', call: () => queryCustom({ filter: { tags: { $all: ['urgent', 'safety-critical'] } } }), icon: Tags }
  ];

  const syntaxHighlight = (jsonObj) => {
    let json = JSON.stringify(jsonObj, null, 2);
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/(\"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*\"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'text-orange-400';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) { cls = 'text-blue-400'; } 
        else { cls = 'text-emerald-400'; } 
      } else if (/true|false/.test(match)) { cls = 'text-purple-400'; }
      else if (/null/.test(match)) { cls = 'text-red-400 font-medium'; }
      return `<span class="${cls}">${match}</span>`;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Terminal className="w-6 h-6 text-blue-600" /> Query Playground
        </h1>
        <p className="text-slate-500 text-sm mt-1">Execute native DocumentDB JSON queries and aggregations directly from the UI.</p>
      </div>

      {/* Allow-list info panel */}
      {allowedOps && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <span className="font-semibold">Allowed operators: </span>
            {allowedOps.allowedOperators.join(', ')}
            {allowedOps._source === 'hardcoded-fallback' && (
              <span className="ml-1 text-blue-500">(source: hardcoded fallback — backend/utils/validateQuery.js)</span>
            )}
            <span className="ml-2 font-semibold text-red-700">Blocked: </span>
            <span className="text-red-700">{allowedOps.blockedOperators?.join(', ')}</span>
          </div>
        </div>
      )}

      {/* 403 Playground Disabled banner */}
      {playgroundError && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg px-4 py-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">{playgroundError.error}</p>
            <p className="text-xs text-amber-700 mt-1">{playgroundError.hint}</p>
          </div>
        </div>
      )}

      {/* 400 Disallowed operator warning */}
      {queryError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-800">
            <span className="font-semibold">Query rejected (disallowed operator): </span>
            {queryError}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Column: Editor & Presets */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button onClick={() => setActiveTab('custom')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'custom' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                Custom Query
              </button>
              <button onClick={() => setActiveTab('presets')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'presets' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                Presets
              </button>
            </div>
            
            <div className="p-5 flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
              {activeTab === 'custom' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Filter (MongoDB Match)</label>
                    <textarea className="w-full h-32 bg-slate-900 text-green-400 font-mono text-xs p-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none custom-scrollbar" value={customQuery.filter} onChange={e => setCustomQuery({...customQuery, filter: e.target.value})} spellCheck="false"></textarea>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Projection (Select fields)</label>
                    <textarea className="w-full h-24 bg-slate-900 text-green-400 font-mono text-xs p-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none custom-scrollbar" value={customQuery.projection} onChange={e => setCustomQuery({...customQuery, projection: e.target.value})} spellCheck="false"></textarea>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Sort</label>
                      <input type="text" className="w-full bg-slate-900 text-green-400 font-mono text-xs p-2.5 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={customQuery.sort} onChange={e => setCustomQuery({...customQuery, sort: e.target.value})} spellCheck="false" />
                    </div>
                    <div className="w-24">
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Limit (max 100)</label>
                      <input type="number" className="w-full bg-slate-900 text-green-400 font-mono text-xs p-2.5 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={customQuery.limit} onChange={e => setCustomQuery({...customQuery, limit: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={handleCustom} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? <StopCircle className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                    {loading ? 'Executing...' : 'Run Query'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {presets.map(q => (
                    <button key={q.label} onClick={() => handleRun(q.call, q.label)} disabled={loading} className="w-full flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group disabled:opacity-70 disabled:cursor-not-allowed">
                      <div className="p-2 bg-slate-100 rounded-md group-hover:bg-blue-100 group-hover:text-blue-700 text-slate-500 transition-colors">
                        <q.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{q.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-mono">{q.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-[#0D1117] rounded-xl shadow-lg border border-slate-800 flex flex-col h-[600px]">
            <div className="flex justify-between items-center px-4 py-3 bg-[#161b22] border-b border-slate-800 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200">Execution Results</h3>
              </div>
              {meta && <span className="text-xs font-mono text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">{meta}</span>}
            </div>
            
            <div className="p-4 flex-1 overflow-auto custom-scrollbar relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1117]/80 backdrop-blur-sm z-10">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-emerald-400 font-mono text-sm mt-3 animate-pulse">Running query on DocumentDB...</p>
                </div>
              ) : null}
              
              {!results && !loading && !playgroundError && !queryError && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Database className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">Ready to run query</p>
                  <p className="text-xs opacity-70">Select a preset or execute a custom query to view results.</p>
                </div>
              )}
              
              {results && (
                <pre className="text-xs font-mono leading-relaxed" dangerouslySetInnerHTML={{ __html: syntaxHighlight(results) }}></pre>
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default QueryPlayground;
