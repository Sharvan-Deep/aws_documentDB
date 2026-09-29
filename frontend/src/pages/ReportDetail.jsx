import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReportById, deleteReport, addFinding } from '../api/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileText, Plus, Copy, Trash2, Expand, Shrink, X, MapPin, UserSquare2, Info, LayoutTemplate } from 'lucide-react';

function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jsonCollapsed, setJsonCollapsed] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [findingForm, setFindingForm] = useState({ component: '', condition: 'good', severity: 'medium', notes: '' });

  useEffect(() => { fetchReport(); }, [id]);

  const fetchReport = async () => {
    try {
      const res = await getReportById(id);
      setReport(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this report? This cannot be undone.')) return;
    const tid = toast.loading('Deleting...');
    try {
      await deleteReport(id);
      toast.success('Report deleted', { id: tid });
      navigate('/reports');
    } catch (e) {
      toast.error('Failed to delete', { id: tid });
    }
  };

  const submitFinding = async (e) => {
    e.preventDefault();
    if (!findingForm.component.trim()) { toast.error('Component is required'); return; }
    const tid = toast.loading('Adding finding...');
    try {
      await addFinding(id, findingForm);
      setIsModalOpen(false);
      setFindingForm({ component: '', condition: 'good', severity: 'medium', notes: '' });
      toast.success('Finding added', { id: tid });
      fetchReport(); 
    } catch (e) {
      toast.error('Failed to add finding', { id: tid });
    }
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    toast.success('JSON copied to clipboard');
  };

  const syntaxHighlight = (jsonObj) => {
    let json = JSON.stringify(jsonObj, null, jsonCollapsed ? 0 : 2);
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'text-orange-500'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) { cls = 'text-blue-400 font-medium'; } // key
        else { cls = 'text-green-400'; } // string
      } else if (/true|false/.test(match)) { cls = 'text-purple-400'; } // bool
      else if (/null/.test(match)) { cls = 'text-red-400 font-medium'; } // null
      return `<span class="${cls}">${match}</span>`;
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading document...</p>
    </div>
  );
  if (error) return <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Breadcrumb */}
      <nav className="flex text-sm text-slate-500 font-medium">
        <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-2 text-slate-400" />
        <Link to="/reports" className="hover:text-blue-600 transition-colors">Reports</Link>
        <ChevronRight className="w-4 h-4 mx-2 text-slate-400" />
        <span className="text-slate-900">{report.reportId}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{report.reportId}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 capitalize border border-slate-200">
                {report.type.replace(/_/g, ' ')}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                report.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {report.status.replace(/_/g, ' ')}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                report.overallRating === 'pass' ? 'bg-emerald-100 text-emerald-800' : 
                report.overallRating === 'fail' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {(report.overallRating || 'N/A').replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-2">Created on {new Date(report.createdAt).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Finding
          </button>
          <button onClick={handleDelete} className="inline-flex justify-center items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors shadow-sm">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <UserSquare2 className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Inspector</h3>
          </div>
          {report.inspector ? (
            <div>
              <p className="font-semibold text-slate-900">{report.inspector.name || '—'}</p>
              <p className="text-sm text-slate-500 mt-0.5">{report.inspector.department || 'No department'}</p>
              {report.inspector.employeeId && <p className="text-xs font-mono text-slate-400 mt-2 bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-100">ID: {report.inspector.employeeId}</p>}
            </div>
          ) : <p className="text-slate-400 italic text-sm">Not assigned</p>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <MapPin className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Location</h3>
          </div>
          {report.location ? (
            <div>
              <p className="font-semibold text-slate-900">{report.location.establishmentName || report.location.city || '—'}</p>
              {report.location.address && <p className="text-sm text-slate-500 mt-0.5">{report.location.address}</p>}
              {report.location.city && <p className="text-sm text-slate-500">{report.location.city} {report.location.state}</p>}
            </div>
          ) : <p className="text-slate-400 italic text-sm">No location data</p>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <LayoutTemplate className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Schema Info</h3>
          </div>
          <div>
            <p className="text-sm text-slate-700 mb-2"><strong>{Object.keys(report).length}</strong> total top-level fields</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.keys(report).filter(f => !['reportId','type','status','createdAt','updatedAt','inspector','location','findings','overallRating','tags','_id'].includes(f)).map(f => (
                <span key={f} className="font-mono text-[11px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800">
        <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            Raw Document Tree
          </h3>
          <div className="flex gap-2">
            <button onClick={() => setJsonCollapsed(!jsonCollapsed)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Toggle collapse">
              {jsonCollapsed ? <Expand className="w-4 h-4" /> : <Shrink className="w-4 h-4" />}
            </button>
            <button onClick={copyJSON} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5 text-xs font-medium">
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
        </div>
        <div className="p-4 overflow-auto max-h-[600px] text-sm font-mono leading-relaxed custom-scrollbar">
          <pre 
            style={{ whiteSpace: jsonCollapsed ? 'nowrap' : 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: syntaxHighlight(report) }}
          ></pre>
        </div>
      </div>

      {/* React Modal (Replace Bootstrap Modal) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Add Finding</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={submitFinding}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Component / Category <span className="text-red-500">*</span></label>
                    <input type="text" required autoFocus className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. brakes, hvac, hygiene" value={findingForm.component} onChange={e => setFindingForm({...findingForm, component: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                      <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={findingForm.condition} onChange={e => setFindingForm({...findingForm, condition: e.target.value})}>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="worn">Worn</option>
                        <option value="faulty">Faulty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                      <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={findingForm.severity} onChange={e => setFindingForm({...findingForm, severity: e.target.value})}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" rows="3" placeholder="Observations..." value={findingForm.notes} onChange={e => setFindingForm({...findingForm, notes: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Save Finding</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

// Add simple Code2 icon component since it was imported but not standard in lucid-react maybe? Wait, Code2 is valid.
const Code2 = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>;

export default ReportDetail;
