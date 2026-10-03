import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// ── Reports ──────────────────────────────────────────
export const getReports = (params) => API.get('/reports', { params });
export const getReportById = (id) => API.get(`/reports/${id}`);
export const createReport = (data) => API.post('/reports', data);
export const updateReport = (id, data) => API.put(`/reports/${id}`, data);
export const deleteReport = (id) => API.delete(`/reports/${id}`);
export const addFinding = (id, data) => API.patch(`/reports/${id}/findings`, data);
export const getOverviewStats = () => API.get('/reports/stats/overview');
export const getReportTypes = () => API.get('/reports/types/list');

// ── Queries ──────────────────────────────────────────
export const queryNested = (field, value) => API.get('/queries/nested', { params: { field, value } });
export const queryByType = () => API.get('/queries/by-type');
export const queryByStatus = () => API.get('/queries/by-status');
export const queryByCity = () => API.get('/queries/by-city');
export const queryHighSeverity = () => API.get('/queries/high-severity');
export const querySearchTags = (tags) => API.get('/queries/search-tags', { params: { tags } });
export const queryDateRange = (startDate, endDate) => API.get('/queries/date-range', { params: { startDate, endDate } });
export const queryInspectorStats = () => API.get('/queries/inspector-stats');
export const querySchemaAnalysis = () => API.get('/queries/schema-analysis');
export const queryCustom = (body) => API.post('/queries/custom', body);
// Always-on: returns the allow-list (not gated by ENABLE_QUERY_PLAYGROUND)
export const queryAllowedOperators = () => API.get('/queries/allowed-operators');

// ── Templates ────────────────────────────────────────
export const getTemplates = () => API.get('/templates');
export const getTemplateByType = (type) => API.get(`/templates/${type}`);

// ── Health ───────────────────────────────────────────
export const getHealth = () => API.get('/health');
export const getHealthDb = () => API.get('/health/db');

export default API;

