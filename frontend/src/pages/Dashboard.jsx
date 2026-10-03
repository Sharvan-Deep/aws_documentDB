import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOverviewStats, querySchemaAnalysis } from '../api/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, RadialLinearScale } from 'chart.js';
import { Doughnut, Bar, PolarArea } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, AlertTriangle, Layers, ArrowRight, Lightbulb, Clock } from 'lucide-react';

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
      } catch (err) {
        setError(err.message || 'We encountered an error loading the dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-xl flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 mb-3 text-red-500" />
        <h3 className="text-lg font-semibold mb-1">Failed to load data</h3>
        <p className="text-sm opacity-90">{error}</p>
      </div>
    );
  }

  // Chart Data Preparation
  const palette = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#059669'];
  const statusColors = { completed: '#10b981', in_progress: '#f59e0b', draft: '#94a3b8' };
  const ratingColors = { pass: '#10b981', fail: '#ef4444', conditional_pass: '#f59e0b' };

  const typeChartData = {
    labels: stats.byType.map(t => (t._id || 'other').replace(/_/g, ' ')),
    datasets: [{ data: stats.byType.map(t => t.count), backgroundColor: palette, borderWidth: 0 }]
  };

  const statusChartData = {
    labels: stats.byStatus.map(s => (s._id || 'other').replace(/_/g, ' ')),
    datasets: [{
      label: 'Reports',
      data: stats.byStatus.map(s => s.count),
      backgroundColor: stats.byStatus.map(s => statusColors[s._id] || '#94a3b8'),
      borderRadius: 4
    }]
  };

  const ratingChartData = {
    labels: stats.byRating.map(r => (r._id || 'N/A').replace(/_/g, ' ')),
    datasets: [{
      data: stats.byRating.map(r => r.count),
      backgroundColor: stats.byRating.map(r => (ratingColors[r._id] || '#94a3b8') + 'CC'),
      borderWidth: 0
    }]
  };

  const completedCount = stats.byStatus.find(s => s._id === 'completed')?.count || 0;
  const failedCount = stats.byRating.find(s => s._id === 'fail')?.count || 0;

  const statCards = [
    { title: 'Total Reports', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Failed Inspections', value: failedCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Report Types', value: stats.byType.length, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time overview of inspection reports powered by DocumentDB.</p>
        </div>
        <Link to="/reports/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none">
          <FileText className="w-4 h-4" />
          Create Report
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div key={idx} variants={itemVariants} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Reports by Type</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={typeChartData} options={{ maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } } }} />
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Reports by Status</h3>
          <div className="h-64">
            <Bar data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' }, border: { display: false } }, x: { grid: { display: false }, border: { display: false } } } }} />
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Overall Ratings</h3>
          <div className="h-64 flex items-center justify-center">
            <PolarArea data={ratingChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } } }} />
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports Table */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Recent Reports
            </h3>
            <Link to="/reports" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Report ID</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">Inspector</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentReports.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No reports generated yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentReports.map(r => (
                    <tr key={r._id} onClick={() => window.location.href = `/reports/${r._id}`} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4 font-mono text-blue-600 group-hover:text-blue-800">{r.reportId}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                          {r.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          r.overallRating === 'pass' ? 'bg-emerald-100 text-emerald-800' : 
                          r.overallRating === 'fail' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {(r.overallRating || '—').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{r.inspector?.name || '—'}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Schema Proof Panel */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">Variable Schema Proof</h3>
            <p className="text-xs text-slate-500 mt-1">Fields of <strong>one sample document</strong> per type — other documents of the same type may have additional fields</p>
          </div>
          <div className="p-6 flex-1 bg-slate-50/50">
            {schemas && schemas.map(s => {
              const uniqueFields = s.fields.filter(f => !['reportId','type','status','createdAt','updatedAt','inspector','location','findings','overallRating','tags'].includes(f));
              return (
                <div key={s.type} className="mb-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-slate-700 capitalize">{s.type.replace(/_/g, ' ')}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">{s.fieldCount} total fields</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 mb-1.5 block">Unique schema fields:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueFields.length > 0 ? uniqueFields.map(f => (
                        <span key={f} className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">{f}</span>
                      )) : <span className="text-slate-400 italic">None</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex gap-3 items-start">
              <Lightbulb className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
              <p>Different report types co-exist in the <strong>same collection</strong> storing completely different structures (e.g. <code>vehicleDetails</code> vs <code>compliance</code>).</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
