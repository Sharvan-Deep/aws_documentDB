import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import CreateReport from './pages/CreateReport';
import QueryPlayground from './pages/QueryPlayground';

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="container-fluid px-4 py-4 flex-fill">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/new" element={<CreateReport />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/query-playground" element={<QueryPlayground />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
