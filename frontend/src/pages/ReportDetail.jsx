import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReportById, deleteReport, addFinding } from '../api/api';

function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jsonCollapsed, setJsonCollapsed] = useState(false);

  // Add finding form state
  const [findingForm, setFindingForm] = useState({ component: '', condition: 'good', severity: 'medium', notes: '' });

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const res = await getReportById(id);
      setReport(res.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this report?')) return;
    try {
      await deleteReport(id);
      navigate('/reports');
    } catch (e) {
      alert('Delete failed');
    }
  };

  const submitFinding = async () => {
    if (!findingForm.component) { alert('Component is required'); return; }
    try {
      await addFinding(id, findingForm);
      document.getElementById('closeFindingModal').click(); // close modal
      setFindingForm({ component: '', condition: 'good', severity: 'medium', notes: '' });
      fetchReport(); // reload
    } catch (e) {
      alert('Failed to add finding');
    }
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
  };

  const syntaxHighlight = (jsonObj) => {
    let json = JSON.stringify(jsonObj, null, jsonCollapsed ? 0 : 2);
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) { cls = 'json-key'; } else { cls = 'json-string'; }
      } else if (/true|false/.test(match)) { cls = 'json-bool'; }
      else if (/null/.test(match)) { cls = 'json-null'; }
      return `<span class="${cls}">${match}</span>`;
    });
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <>
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link to="/reports" className="text-decoration-none">Reports</Link></li>
          <li className="breadcrumb-item active">{report.reportId}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row">
            <div className="col-lg-8">
              <div className="d-flex align-items-start gap-3 mb-3">
                <div className="report-type-icon rounded-3 p-3 fs-2 bg-primary bg-opacity-10 text-primary">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-1">{report.reportId}</h4>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    <span className="badge bg-primary">{report.type.replace(/_/g, ' ')}</span>
                    <span className={`badge ${report.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`}>{report.status}</span>
                    <span className={`badge ${report.overallRating === 'pass' ? 'bg-success' : report.overallRating === 'fail' ? 'bg-danger' : 'bg-warning text-dark'}`}>{report.overallRating || 'N/A'}</span>
                  </div>
                  <p className="text-muted mb-0 small">Created: {new Date(report.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button className="btn btn-outline-primary btn-sm me-1" data-bs-toggle="modal" data-bs-target="#addFindingModal"><i className="bi bi-plus-circle me-1"></i>Add Finding</button>
              <button className="btn btn-outline-secondary btn-sm me-1" onClick={copyJSON}><i className="bi bi-clipboard me-1"></i>Copy JSON</button>
              <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}><i className="bi bi-trash3 me-1"></i>Delete</button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted small fw-semibold text-uppercase mb-3"><i className="bi bi-person-badge me-1"></i>Inspector</h6>
              {report.inspector ? (
                <>
                  <div className="fw-semibold">{report.inspector.name || '—'}</div>
                  <div className="small text-muted">{report.inspector.department || ''}</div>
                  {report.inspector.employeeId && <div className="small text-muted">ID: <code>{report.inspector.employeeId}</code></div>}
                </>
              ) : '—'}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted small fw-semibold text-uppercase mb-3"><i className="bi bi-geo-alt me-1"></i>Location</h6>
              {report.location ? (
                <>
                  {report.location.establishmentName && <div className="fw-semibold">{report.location.establishmentName}</div>}
                  {report.location.address && <div className="small">{report.location.address}</div>}
                  {(report.location.city || report.location.state) && <div className="small">{report.location.city} {report.location.state}</div>}
                </>
              ) : '—'}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-info">
            <div className="card-body">
              <h6 className="text-muted small fw-semibold text-uppercase mb-3"><i className="bi bi-braces me-1"></i>Document Schema</h6>
              <div className="small mb-1"><strong>{Object.keys(report).length}</strong> total fields</div>
              <div className="small mb-1">Specific fields:</div>
              {Object.keys(report).filter(f => !['reportId','type','status','createdAt','updatedAt','inspector','location','findings','overallRating','tags','_id'].includes(f)).map(f => (
                <code key={f} className="badge bg-info bg-opacity-10 text-info me-1 mb-1">{f}</code>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center pt-3">
          <h6 className="fw-semibold mb-0"><i className="bi bi-code-slash me-2"></i>Full Document (Raw JSON)</h6>
          <div>
            <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setJsonCollapsed(!jsonCollapsed)}><i className={`bi bi-arrows-${jsonCollapsed ? 'expand' : 'collapse'}`}></i></button>
            <button className="btn btn-sm btn-outline-secondary" onClick={copyJSON}><i className="bi bi-clipboard me-1"></i>Copy</button>
          </div>
        </div>
        <div className="card-body p-0">
          <pre 
            className="bg-dark p-4 mb-0 rounded-bottom" 
            style={{ maxHeight: '600px', overflow: 'auto', fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: jsonCollapsed ? 'nowrap' : 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: syntaxHighlight(report) }}
          ></pre>
        </div>
      </div>

      {/* Add Finding Modal */}
      <div className="modal fade" id="addFindingModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title fw-semibold"><i className="bi bi-plus-circle me-2"></i>Add Finding</h6>
              <button type="button" className="btn-close" id="closeFindingModal" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label small fw-semibold">Component / Category</label>
                <input type="text" className="form-control" value={findingForm.component} onChange={e => setFindingForm({...findingForm, component: e.target.value})} placeholder="e.g. brakes" />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold">Condition</label>
                  <select className="form-select" value={findingForm.condition} onChange={e => setFindingForm({...findingForm, condition: e.target.value})}>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="worn">Worn</option>
                    <option value="faulty">Faulty</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Severity</label>
                  <select className="form-select" value={findingForm.severity} onChange={e => setFindingForm({...findingForm, severity: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="mb-0">
                <label className="form-label small fw-semibold">Notes</label>
                <textarea className="form-control" rows="2" value={findingForm.notes} onChange={e => setFindingForm({...findingForm, notes: e.target.value})}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={submitFinding}><i className="bi bi-check-lg me-1"></i>Add Finding</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ReportDetail;
