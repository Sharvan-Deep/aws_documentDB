import React, { useState } from 'react';
import { queryNested, queryByType, queryByStatus, queryByCity, queryHighSeverity, querySearchTags, querySchemaAnalysis, queryCustom } from '../api/api';

function QueryPlayground() {
  const [results, setResults] = useState(null);
  const [meta, setMeta] = useState('');
  const [loading, setLoading] = useState(false);

  const [customQuery, setCustomQuery] = useState({
    filter: '{\n  "type": "vehicle",\n  "findings.severity": "high"\n}',
    projection: '{\n  "reportId": 1,\n  "type": 1,\n  "findings": 1\n}',
    sort: '{\n  "createdAt": -1\n}',
    limit: 10
  });

  const handleRun = async (apiCall, label) => {
    setLoading(true);
    setResults(null);
    setMeta('Running...');
    try {
      const start = Date.now();
      const res = await apiCall();
      const time = Date.now() - start;
      const data = res.data;
      setResults(data);
      const count = data.count ?? data.data?.length ?? '?';
      setMeta(`${label} — ${count} results in ${time}ms`);
    } catch (err) {
      setResults({ error: err.response?.data?.error || err.message });
      setMeta('Query failed');
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

  return (
    <div className="row">
      <div className="col-12 mb-3">
        <h3 className="fw-bold mb-1"><i className="bi bi-terminal me-2 text-primary"></i>Query Playground</h3>
        <p className="text-muted">Test Amazon DocumentDB's native JSON capabilities (nested fields, arrays, aggregations)</p>
      </div>

      <div className="col-md-4">
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-primary text-white py-2"><i className="bi bi-lightning me-2"></i>Preset Queries</div>
          <div className="list-group list-group-flush">
            {[
              { label: 'Reports by Type', desc: 'Aggregation: group by type', call: queryByType },
              { label: 'Reports by Status', desc: 'Aggregation: group by status', call: queryByStatus },
              { label: 'High Severity Findings', desc: 'Nested: findings.severity = "high"', call: queryHighSeverity },
              { label: 'Reports by City', desc: 'Aggregation: group by location.city', call: queryByCity },
              { label: 'Schema Analysis', desc: 'Map/Reduce equivalent: unique fields', call: querySchemaAnalysis },
              { label: 'Nested: city = Bengaluru', desc: 'Object nested query', call: () => queryNested('location.city', 'Bengaluru') },
              { label: 'Search Tags (urgent)', desc: 'Array $in operator', call: () => querySearchTags('urgent') }
            ].map(q => (
              <button key={q.label} className="list-group-item list-group-item-action preset-btn py-2" onClick={() => handleRun(q.call, q.label)}>
                <strong>{q.label}</strong><br/><small className="text-muted">{q.desc}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="col-md-8">
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-2 fw-semibold"><i className="bi bi-code-square me-2"></i>Custom Query Editor</div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Filter (JSON)</label>
                <textarea className="form-control font-monospace small" rows="4" value={customQuery.filter} onChange={e => setCustomQuery({...customQuery, filter: e.target.value})}></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Projection (JSON)</label>
                <textarea className="form-control font-monospace small" rows="4" value={customQuery.projection} onChange={e => setCustomQuery({...customQuery, projection: e.target.value})}></textarea>
              </div>
              <div className="col-md-8">
                <label className="form-label small fw-semibold">Sort (JSON)</label>
                <input type="text" className="form-control font-monospace small" value={customQuery.sort} onChange={e => setCustomQuery({...customQuery, sort: e.target.value})} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Limit</label>
                <div className="d-flex gap-2">
                  <input type="number" className="form-control" value={customQuery.limit} onChange={e => setCustomQuery({...customQuery, limit: e.target.value})} />
                  <button className="btn btn-primary px-4" onClick={handleCustom}><i className="bi bi-play-fill"></i> Run</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-dark text-white py-2 d-flex justify-content-between align-items-center">
            <span><i className="bi bi-terminal me-2"></i>Results Output</span>
            <small className="text-secondary">{meta}</small>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5 bg-dark text-light"><div className="spinner-border"></div></div>
            ) : (
              <pre className="bg-dark text-light p-3 m-0" style={{ maxHeight: '500px', overflow: 'auto', fontSize: '0.85rem' }}>
                {results ? JSON.stringify(results, null, 2) : 'Run a query to see results...'}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueryPlayground;
