import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import CreateReport from './pages/CreateReport';
import QueryPlayground from './pages/QueryPlayground';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-right" richColors />
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
