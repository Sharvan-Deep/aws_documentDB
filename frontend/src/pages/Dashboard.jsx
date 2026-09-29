import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOverviewStats, querySchemaAnalysis } from '../api/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, RadialLinearScale } from 'chart.js';
import { Doughnut, Bar, PolarArea } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, RadialLinearScale);

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [schemas, setSchemas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, schemaRes] = await Promise.all([
          getOverviewStats(),
          querySchemaAnalysis()
        ]);
        setStats(statsRes.data.data);
        setSchemas(schemaRes.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Error loading dashboard data');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="mt-2 text-muted">Loading Dashboard...</p></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  // Chart Data Preparation
  const palette = ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0', '#4895ef', '#560bad'];
  const statusColors = { completed: '#2dc653', in_progress: '#ffbe0b', draft: '#adb5bd' };
  const ratingColors = { pass: '#2dc653', fail: '#ef233c', conditional_pass: '#ffbe0b' };

  const typeChartData = {
    labels: stats.byType.map(t => (t._id || 'other').replace(/_/g, ' ')),
    datasets: [{
      data: stats.byType.map(t => t.count),
      backgroundColor: palette,
      borderWidth: 0
    }]
  };

  const statusChartData = {
    labels: stats.byStatus.map(s => (s._id || 'other').replace(/_/g, ' ')),
    datasets: [{
      label: 'Reports',
      data: stats.byStatus.map(s => s.count),
      backgroundColor: stats.byStatus.map(s => statusColors[s._id] || '#6c757d'),
      borderRadius: 6
    }]
  };

  const ratingChartData = {
    labels: stats.byRating.map(r => (r._id || 'N/A').replace(/_/g, ' ')),
    datasets: [{
      data: stats.byRating.map(r => r.count),
      backgroundColor: stats.byRating.map(r => (ratingColors[r._id] || '#6c757d') + '99'),
      borderWidth: 0
    }]
  };

  const completedCount = stats.byStatus.find(s => s._id === 'completed')?.count || 0;
  const failedCount = stats.byRating.find(s => s._id === 'fail')?.count || 0;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1"><i className="bi bi-speedometer2 me-2 text-primary"></i>Dashboard</h3>
          <p className="text-muted mb-0">Real-time overview of inspection reports — powered by Amazon DocumentDB</p>
        </div>
        <Link to="/reports/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-1"></i>New Report
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {[
          { icon: 'bi-file-earmark-text', color: 'primary', val: stats.total, label: 'Total Reports' },
          { icon: 'bi-check-circle', color: 'success', val: completedCount, label: 'Completed' },
          { icon: 'bi-exclamation-triangle', color: 'danger', val: failedCount, label: 'Failed' },
          { icon: 'bi-layers', color: 'info', val: stats.byType.length, label: 'Report Types' }
        ].map((c, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div className="card stat-card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className={`stat-icon bg-${c.color} bg-opacity-10 text-${c.color} rounded-3 p-3 me-3`}>
                  <i className={`bi ${c.icon} fs-4`}></i>
                </div>
                <div>
                  <div className="fs-3 fw-bold">{c.val}</div>
                  <div className="text-muted small">{c.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-3">
              <h6 className="fw-semibold mb-0"><i className="bi bi-pie-chart-fill me-2 text-primary"></i>Reports by Type</h6>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '280px' }}>
              <Doughnut data={typeChartData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-3">
              <h6 className="fw-semibold mb-0"><i className="bi bi-bar-chart-fill me-2 text-success"></i>Reports by Status</h6>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '280px' }}>
              <Bar data={statusChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }} />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-3">
              <h6 className="fw-semibold mb-0"><i className="bi bi-award-fill me-2 text-warning"></i>Overall Ratings</h6>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '280px' }}>
              <PolarArea data={ratingChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center pt-3">
              <h6 className="fw-semibold mb-0"><i className="bi bi-clock-history me-2 text-secondary"></i>Recent Reports</h6>
              <Link to="/reports" className="btn btn-sm btn-outline-primary">View All <i className="bi bi-arrow-right ms-1"></i></Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th className="ps-3">Report ID</th><th>Type</th><th>Rating</th><th>Inspector</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentReports.length === 0 ? (
                      <tr><td colSpan="5" className="text-center text-muted py-4">No reports yet.</td></tr>
                    ) : stats.recentReports.map(r => (
                      <tr key={r._id} onClick={() => window.location.href = `/reports/${r._id}`}>
                        <td className="ps-3"><code className="text-primary">{r.reportId}</code></td>
                        <td><span className="badge rounded-pill bg-primary bg-opacity-10 text-primary">{r.type}</span></td>
                        <td>
                          <span className={`badge rounded-pill ${r.overallRating === 'pass' ? 'bg-success' : r.overallRating === 'fail' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                            {(r.overallRating || '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{r.inspector?.name || '—'}</td>
                        <td className="text-muted small">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-info">
            <div className="card-header bg-white pt-3">
              <h6 className="fw-semibold mb-0"><i className="bi bi-diagram-3-fill me-2 text-info"></i>Variable Schema Proof</h6>
              <small className="text-muted">Each report type has different fields — all in one collection</small>
            </div>
            <div className="card-body">
              {schemas && schemas.map(s => {
                const uniqueFields = s.fields.filter(f => !['reportId','type','status','createdAt','updatedAt','inspector','location','findings','overallRating','tags'].includes(f));
                return (
                  <div key={s.type} className="mb-3 p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-secondary me-2">{s.type.replace(/_/g, ' ')}</span>
                      <small className="text-muted">{s.fieldCount} fields</small>
                    </div>
                    <div className="small">
                      <strong>Unique fields:</strong> {uniqueFields.length > 0 ? uniqueFields.map(f => <code key={f} className="me-1">{f}</code>) : <span className="text-muted">none</span>}
                    </div>
                  </div>
                );
              })}
              <div className="alert alert-info small mb-0 mt-2">
                <i className="bi bi-lightbulb me-1"></i>
                <strong>Key takeaway:</strong> Different types store completely different fields (e.g. <code>vehicleDetails</code> vs <code>buildingDetails</code>) without schema migrations!
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
