import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createReport, getTemplateByType } from '../api/api';

function CreateReport() {
  const navigate = useNavigate();
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
    if (!type) { alert('Please select a report type'); return; }
    try {
      const res = await createReport(buildJSON());
      if (res.data.success) {
        navigate(`/reports/${res.data.data._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create report');
    }
  };

  return (
    <div className="row">
      <div className="col-md-7">
        <div className="d-flex align-items-center mb-4">
          <Link to="/reports" className="btn btn-outline-secondary btn-sm me-3"><i className="bi bi-arrow-left"></i></Link>
          <h3 className="fw-bold mb-0"><i className="bi bi-plus-circle me-2 text-primary"></i>Create Report</h3>
        </div>
        
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <h5 className="mb-3">1. Report Type</h5>
              <div className="row g-2 mb-4">
                <div className="col-md-6">
                  <select className="form-select" value={type} onChange={e => setType(e.target.value)} required>
                    <option value="">Select type...</option>
                    <option value="vehicle">🚗 Vehicle Inspection</option>
                    <option value="building">🏢 Building Inspection</option>
                    <option value="food_safety">🍽️ Food Safety Inspection</option>
                    <option value="custom">🔧 Custom Type</option>
                  </select>
                </div>
                {type === 'custom' && (
                  <div className="col-md-6">
                    <input type="text" className="form-control" placeholder="Custom type name" value={customType} onChange={e => setCustomType(e.target.value)} required />
                  </div>
                )}
              </div>

              <h5 className="mb-3">2. Basic Info</h5>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label small">Status</label>
                  <select className="form-select form-select-sm" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Rating</label>
                  <select className="form-select form-select-sm" value={rating} onChange={e => setRating(e.target.value)}>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="conditional_pass">Conditional</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small">City</label>
                  <input type="text" className="form-control form-control-sm" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Inspector</label>
                  <input type="text" className="form-control form-control-sm" value={inspectorName} onChange={e => setInspectorName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Tags (comma-separated)</label>
                  <input type="text" className="form-control form-control-sm" value={tags} onChange={e => setTags(e.target.value)} />
                </div>
              </div>

              {dynamicFieldsDef.length > 0 && (
                <>
                  <h5 className="mb-3">3. Type-Specific Details</h5>
                  <div className="row g-3 mb-4">
                    {dynamicFieldsDef.map(f => (
                      <div className="col-md-6" key={f.name}>
                        <label className="form-label small">{f.label}</label>
                        {f.type === 'select' ? (
                          <select className="form-select form-select-sm" value={dynamicFields[f.name] || ''} onChange={e => setDynamicFields({...dynamicFields, [f.name]: e.target.value})}>
                            <option value="">...</option>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={f.type === 'number' ? 'number' : 'text'} className="form-control form-control-sm" value={dynamicFields[f.name] || ''} onChange={e => setDynamicFields({...dynamicFields, [f.name]: e.target.value})} placeholder={f.placeholder} />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h5 className="mb-3">Findings Array</h5>
              <div className="mb-4">
                {findings.map((f, idx) => (
                  <div className="row g-2 mb-2 align-items-center" key={f.id}>
                    <div className="col-3"><input type="text" className="form-control form-control-sm" placeholder="Component" value={f.component} onChange={e => { const arr = [...findings]; arr[idx].component = e.target.value; setFindings(arr); }} /></div>
                    <div className="col-2">
                      <select className="form-select form-select-sm" value={f.condition} onChange={e => { const arr = [...findings]; arr[idx].condition = e.target.value; setFindings(arr); }}>
                        <option value="good">Good</option><option value="worn">Worn</option><option value="faulty">Faulty</option>
                      </select>
                    </div>
                    <div className="col-2">
                      <select className="form-select form-select-sm" value={f.severity} onChange={e => { const arr = [...findings]; arr[idx].severity = e.target.value; setFindings(arr); }}>
                        <option value="low">Low</option><option value="medium">Med</option><option value="high">High</option>
                      </select>
                    </div>
                    <div className="col-4"><input type="text" className="form-control form-control-sm" placeholder="Notes" value={f.notes} onChange={e => { const arr = [...findings]; arr[idx].notes = e.target.value; setFindings(arr); }} /></div>
                    <div className="col-1"><button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => setFindings(findings.filter(item => item.id !== f.id))}><i className="bi bi-x"></i></button></div>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setFindings([...findings, { id: Date.now(), component: '', condition: 'good', severity: 'medium', notes: '' }])}>+ Add Finding</button>
              </div>

              <h5 className="mb-3">Custom Fields <small className="text-muted fw-normal">(Variable Schema Demo)</small></h5>
              <div className="mb-4">
                {customFields.map((cf, idx) => (
                  <div className="row g-2 mb-2" key={cf.id}>
                    <div className="col-4"><input type="text" className="form-control form-control-sm" placeholder="Key (e.g. engineVol)" value={cf.key} onChange={e => { const arr = [...customFields]; arr[idx].key = e.target.value; setCustomFields(arr); }} /></div>
                    <div className="col-7"><input type="text" className="form-control form-control-sm" placeholder="Value (e.g. 2.0)" value={cf.value} onChange={e => { const arr = [...customFields]; arr[idx].value = e.target.value; setCustomFields(arr); }} /></div>
                    <div className="col-1"><button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => setCustomFields(customFields.filter(item => item.id !== cf.id))}><i className="bi bi-x"></i></button></div>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCustomFields([...customFields, { id: Date.now(), key: '', value: '' }])}>+ Add Field</button>
              </div>

              <button type="submit" className="btn btn-success btn-lg"><i className="bi bi-check-circle me-2"></i>Save Report to DB</button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-md-5">
        <div className="card shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
          <div className="card-header bg-dark text-light"><i className="bi bi-code-slash me-2"></i>Live Document Preview</div>
          <div className="card-body p-0">
            <pre className="bg-dark text-light p-3 m-0" style={{ fontSize: '0.8rem', maxHeight: '70vh', overflow: 'auto' }}>
              {JSON.stringify(buildJSON(), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateReport;
