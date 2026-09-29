import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createReport, getTemplateByType } from '../api/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, X, Save, FileJson, AlertCircle } from 'lucide-react';

function CreateReport() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [type, setType] = useState('');
  const [customType, setCustomType] = useState('');
  const [status, setStatus] = useState('completed');
  const [rating, setRating] = useState('pass');
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorDept, setInspectorDept] = useState('');
  const [city, setCity] = useState('');
  const [tags, setTags] = useState('');
  
  const [dynamicFieldsDef, setDynamicFieldsDef] = useState([]);
  const [dynamicFields, setDynamicFields] = useState({});
  const [findings, setFindings] = useState([{ id: 1, component: '', condition: 'good', severity: 'medium', notes: '' }]);
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    if (!type || type === 'custom') {
      setDynamicFieldsDef([]);
      setDynamicFields({});
      return;
    }
    getTemplateByType(type).then(res => {
      if (res.data.success) {
        setDynamicFieldsDef(res.data.data.fields);
        const initFields = {};
        res.data.data.fields.forEach(f => initFields[f.name] = '');
        setDynamicFields(initFields);
      }
    }).catch(() => setDynamicFieldsDef([]));
  }, [type]);

  const buildJSON = () => {
    const finalType = type === 'custom' ? (customType || 'custom') : type;
    const doc = {
      type: finalType || '...',
      status,
      overallRating: rating
    };

    if (inspectorName || inspectorDept) {
      doc.inspector = {};
      if (inspectorName) doc.inspector.name = inspectorName;
      if (inspectorDept) doc.inspector.department = inspectorDept;
    }
    if (city) doc.location = { city };
    if (tags) doc.tags = tags.split(',').map(t => t.trim()).filter(Boolean);

    if (Object.keys(dynamicFields).length > 0) {
      doc[`${finalType}Details`] = dynamicFields;
    }

    const validFindings = findings.filter(f => f.component.trim());
    if (validFindings.length > 0) {
      doc.findings = validFindings.map(f => ({ component: f.component, condition: f.condition, severity: f.severity, notes: f.notes }));
    }

    customFields.forEach(cf => {
      if (cf.key.trim() && cf.value.trim()) {
        let val = cf.value.trim();
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(val)) val = Number(val);
        doc[cf.key.trim()] = val;
      }
    });

    return doc;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type) { toast.error('Please select a report type'); return; }
    
    setIsSubmitting(true);
    const tid = toast.loading('Creating report...');
    
    try {
      const res = await createReport(buildJSON());
      if (res.data.success) {
        toast.success('Report created successfully!', { id: tid });
        navigate(`/reports/${res.data.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create report', { id: tid });
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      
      <div className="flex items-center gap-4 mb-6">
        <Link to="/reports" className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Report</h1>
          <p className="text-slate-500 text-sm">Build a dynamic DocumentDB JSON document.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <form id="create-report-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs">1</span> 
                Core Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Report Type <span className="text-red-500">*</span></label>
                  <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={type} onChange={e => setType(e.target.value)} required>
                    <option value="">Select template...</option>
                    <option value="vehicle">Vehicle Inspection</option>
                    <option value="building">Building Inspection</option>
                    <option value="food_safety">Food Safety</option>
                    <option value="custom">Custom (No Template)</option>
                  </select>
                </div>
                {type === 'custom' && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Custom Type Name <span className="text-red-500">*</span></label>
                    <input type="text" className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. electrical" value={customType} onChange={e => setCustomType(e.target.value)} required />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Rating</label>
                  <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={rating} onChange={e => setRating(e.target.value)}>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="conditional_pass">Conditional</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">City</label>
                  <input type="text" className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={city} onChange={e => setCity(e.target.value)} placeholder="Location" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Inspector Name</label>
                  <input type="text" className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Full Name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tags</label>
                  <input type="text" className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={tags} onChange={e => setTags(e.target.value)} placeholder="urgent, routine..." />
                </div>
              </div>
            </div>

            {/* Dynamic Template Fields */}
            {dynamicFieldsDef.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs">2</span> 
                  Template Specific
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {dynamicFieldsDef.map(f => (
                    <div className="space-y-1.5" key={f.name}>
                      <label className="text-sm font-medium text-slate-700 capitalize">{f.label}</label>
                      {f.type === 'select' ? (
                        <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={dynamicFields[f.name] || ''} onChange={e => setDynamicFields({...dynamicFields, [f.name]: e.target.value})}>
                          <option value="">Select...</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={f.type === 'number' ? 'number' : 'text'} className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={dynamicFields[f.name] || ''} onChange={e => setDynamicFields({...dynamicFields, [f.name]: e.target.value})} placeholder={f.placeholder} />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Arrays & Custom Schemas */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs">{dynamicFieldsDef.length > 0 ? '3' : '2'}</span> 
                Nested Arrays & Variable Schema
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">Findings Array (Nested Documents)</label>
                <div className="space-y-3">
                  {findings.map((f, idx) => (
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100" key={f.id}>
                      <input type="text" className="flex-1 min-w-[120px] h-9 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 outline-none" placeholder="Component" value={f.component} onChange={e => { const arr = [...findings]; arr[idx].component = e.target.value; setFindings(arr); }} />
                      <select className="w-24 h-9 rounded-md border border-slate-300 px-2 text-sm focus:border-blue-500 outline-none bg-white" value={f.condition} onChange={e => { const arr = [...findings]; arr[idx].condition = e.target.value; setFindings(arr); }}>
                        <option value="good">Good</option><option value="worn">Worn</option><option value="faulty">Faulty</option>
                      </select>
                      <select className="w-24 h-9 rounded-md border border-slate-300 px-2 text-sm focus:border-blue-500 outline-none bg-white" value={f.severity} onChange={e => { const arr = [...findings]; arr[idx].severity = e.target.value; setFindings(arr); }}>
                        <option value="low">Low</option><option value="medium">Med</option><option value="high">High</option>
                      </select>
                      <input type="text" className="flex-1 min-w-[150px] h-9 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 outline-none" placeholder="Notes..." value={f.notes} onChange={e => { const arr = [...findings]; arr[idx].notes = e.target.value; setFindings(arr); }} />
                      <button type="button" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" onClick={() => setFindings(findings.filter(item => item.id !== f.id))}><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <button type="button" className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors" onClick={() => setFindings([...findings, { id: Date.now(), component: '', condition: 'good', severity: 'medium', notes: '' }])}>
                  <Plus className="w-4 h-4" /> Add Finding
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Arbitrary Custom Fields</label>
                <p className="text-xs text-slate-500 mb-3">Add any key-value pairs to demonstrate schema flexibility.</p>
                
                <div className="space-y-3">
                  {customFields.map((cf, idx) => (
                    <div className="flex gap-2 items-center" key={cf.id}>
                      <input type="text" className="flex-1 h-9 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 outline-none" placeholder="Key (e.g. voltage)" value={cf.key} onChange={e => { const arr = [...customFields]; arr[idx].key = e.target.value; setCustomFields(arr); }} />
                      <input type="text" className="flex-[2] h-9 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 outline-none" placeholder="Value (e.g. 220, true, 'ok')" value={cf.value} onChange={e => { const arr = [...customFields]; arr[idx].value = e.target.value; setCustomFields(arr); }} />
                      <button type="button" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" onClick={() => setCustomFields(customFields.filter(item => item.id !== cf.id))}><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <button type="button" className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors" onClick={() => setCustomFields([...customFields, { id: Date.now(), key: '', value: '' }])}>
                  <Plus className="w-4 h-4" /> Add Custom Field
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Report</>
                )}
              </button>
            </div>
            
          </form>
        </div>

        {/* Live JSON Preview */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 sticky top-24 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-400" /> Live JSON Preview
              </h3>
            </div>
            <div className="p-4 overflow-auto flex-1 custom-scrollbar">
              <pre className="text-xs font-mono text-green-400 leading-relaxed">
                {JSON.stringify(buildJSON(), null, 2).replace(/"(.*?)":/g, '<span class="text-blue-400">"$1"</span>:').replace(/\b(true|false)\b/g, '<span class="text-purple-400">$1</span>').replace(/\b(null)\b/g, '<span class="text-red-400">$1</span>')}
              </pre>
            </div>
            {!type && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border-t border-slate-800">
                <AlertCircle className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm text-slate-300 font-medium">Select a Report Type</p>
                <p className="text-xs text-slate-500 mt-1">The JSON structure will adapt automatically.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default CreateReport;
