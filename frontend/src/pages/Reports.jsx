import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getReports, getReportTypes, deleteReport } from '../api/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Filter, X, Eye, Trash2, FileText, Search, Plus } from 'lucide-react';

function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [types, setTypes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({ type: '', status: '', rating: '', city: '', inspector: '' });
  const [pageToFetch, setPageToFetch] = useState(1);

  const [error, setError] = useState(null);

  useEffect(() => {
    getReportTypes().then(res => setTypes(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [pageToFetch]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
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
      setError(err.message || 'Failed to load reports from the server.');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPageToFetch(1);
    fetchReports(); 
  };

  const clearFilters = () => {
    setFilters({ type: '', status: '', rating: '', city: '', inspector: '' });
    setPageToFetch(1);
    setTimeout(fetchReports, 0); 
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this report permanently? This action cannot be undone.')) return;
    
    const loadingId = toast.loading('Deleting report...');
    try {
      await deleteReport(id);
      toast.success('Report deleted successfully', { id: loadingId });
      fetchReports();
    } catch (err) {
      toast.error('Failed to delete report', { id: loadingId });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inspection Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Browse, filter and manage all inspection records.</p>
        </div>
        <Link to="/reports/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none">
          <Plus className="w-4 h-4" />
          New Report
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Report Type</label>
            <select className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Status</label>
            <select className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Rating</label>
            <select className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={filters.rating} onChange={e => setFilters({...filters, rating: e.target.value})}>
              <option value="">All Ratings</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="conditional_pass">Conditional</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">City</label>
            <input type="text" className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} placeholder="e.g. Mumbai" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Inspector</label>
            <input type="text" className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={filters.inspector} onChange={e => setFilters({...filters, inspector: e.target.value})} placeholder="Search name..." />
          </div>
          <div className="flex gap-2 h-9">
            <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button type="button" onClick={clearFilters} className="px-3 inline-flex items-center justify-center bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors" title="Clear filters">
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      <div className="flex justify-between items-center text-sm text-slate-500">
        <span>Showing {reports.length} of {pagination.total} results</span>
        <span>Page {pagination.page} of {pagination.pages || 1}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Report ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Inspector</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-500">Loading reports...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-xl flex flex-col items-center justify-center text-center mx-4 my-2">
                      <h3 className="text-lg font-semibold mb-1">Failed to load reports</h3>
                      <p className="text-sm opacity-90">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-slate-900">No reports found</p>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or create a new report.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr key={r._id} onClick={() => navigate(`/reports/${r._id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                    <td className="px-6 py-4 font-mono text-blue-600 font-medium">{r.reportId}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 capitalize border border-slate-200">
                        {r.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                        r.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        r.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        r.overallRating === 'pass' ? 'bg-emerald-100 text-emerald-800' : 
                        r.overallRating === 'fail' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {(r.overallRating || '—').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{r.inspector?.name || '—'}</td>
                    <td className="px-6 py-4 text-slate-700">{r.location?.city || r.location?.establishmentName || '—'}</td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onClick={(e) => handleDelete(r._id, e)} title="Delete report">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow-sm isolate">
            <button 
              onClick={() => setPageToFetch(pagination.page - 1)} 
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 focus:z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPageToFetch(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium focus:z-10 ${
                  i + 1 === pagination.page
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setPageToFetch(pagination.page + 1)} 
              disabled={pagination.page >= pagination.pages}
              className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 focus:z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </motion.div>
  );
}

export default Reports;
