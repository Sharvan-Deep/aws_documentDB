import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getReports, getReportTypes, deleteReport } from '../api/api';

function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [types, setTypes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({ type: '', status: '', rating: '', city: '', inspector: '' });
  const [pageToFetch, setPageToFetch] = useState(1);

  useEffect(() => {
    getReportTypes().then(res => setTypes(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [pageToFetch]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { page: pageToFetch, limit: 10 };
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.rating) params.rating = filters.rating;
      if (filters.city) params.city = filters.city;
      if (filters.inspector) params.inspector = filters.inspector;

      const res = await getReports(params);
      setReports(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPageToFetch(1);
    fetchReports(); // Will trigger immediately because page might not change if already 1, so explicit call
  };

  const clearFilters = () => {
    setFilters({ type: '', status: '', rating: '', city: '', inspector: '' });
    setPageToFetch(1);
    // Use timeout to allow state to update before fetch if we wanted effect to trigger, but better to call explicit:
    setTimeout(fetchReports, 0); 
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await deleteReport(id);
      fetchReports();
    } catch (e) {
      alert('Delete failed');
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1"><i className="bi bi-file-earmark-text me-2 text-primary"></i>Inspection Reports</h3>
          <p className="text-muted mb-0">Browse, filter and manage all inspection reports</p>
        </div>
        <Link to="/reports/new" className="btn btn-primary"><i className="bi bi-plus-circle me-1"></i>New Report</Link>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <form className="row g-2 align-items-end" onSubmit={handleFilterSubmit}>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">Type</label>
              <select className="form-select form-select-sm" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
                <option value="">All Types</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">Status</label>
              <select className="form-select form-select-sm" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">Rating</label>
              <select className="form-select form-select-sm" value={filters.rating} onChange={e => setFilters({...filters, rating: e.target.value})}>
                <option value="">All</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="conditional_pass">Conditional</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">City</label>
              <input type="text" className="form-control form-control-sm" value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} placeholder="e.g. Mumbai" />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">Inspector</label>
              <input type="text" className="form-control form-control-sm" value={filters.inspector} onChange={e => setFilters({...filters, inspector: e.target.value})} placeholder="Name..." />
            </div>
            <div className="col-md-2 d-flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm flex-fill"><i className="bi bi-funnel me-1"></i>Filter</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearFilters}><i className="bi bi-x-lg"></i></button>
            </div>
          </form>
        </div>
      </div>

      <div className="mb-2">
        <small className="text-muted">{pagination.total} report{pagination.total !== 1 && 's'} found — page {pagination.page} of {pagination.pages}</small>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr className="table-light">
                <th className="ps-3">Report ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Inspector</th>
                <th>City</th>
                <th>Created</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-4"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-5 text-muted">No reports found</td></tr>
              ) : (
                reports.map(r => (
                  <tr key={r._id}>
                    <td className="ps-3" onClick={() => navigate(`/reports/${r._id}`)}><code className="cursor-pointer">{r.reportId}</code></td>
                    <td onClick={() => navigate(`/reports/${r._id}`)}><span className="badge bg-primary bg-opacity-10 text-primary">{r.type}</span></td>
                    <td><span className={`badge ${r.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`}>{r.status}</span></td>
                    <td><span className={`badge ${r.overallRating === 'pass' ? 'bg-success' : r.overallRating === 'fail' ? 'bg-danger' : 'bg-warning text-dark'}`}>{r.overallRating || '—'}</span></td>
                    <td>{r.inspector?.name || '—'}</td>
                    <td>{r.location?.city || r.location?.establishmentName || '—'}</td>
                    <td className="small text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="text-end pe-3">
                      <Link to={`/reports/${r._id}`} className="btn btn-sm btn-outline-primary me-1"><i className="bi bi-eye"></i></Link>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r._id)}><i className="bi bi-trash3"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.pages > 1 && (
        <nav className="d-flex justify-content-center mt-4">
          <ul className="pagination pagination-sm">
            <li className={`page-item ${pagination.page <= 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPageToFetch(pagination.page - 1)}>«</button>
            </li>
            {[...Array(pagination.pages)].map((_, i) => (
              <li key={i+1} className={`page-item ${i+1 === pagination.page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPageToFetch(i + 1)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${pagination.page >= pagination.pages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPageToFetch(pagination.page + 1)}>»</button>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}

export default Reports;
