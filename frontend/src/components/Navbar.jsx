import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Database, LayoutDashboard, FileText, PlusCircle, TerminalSquare, Shield } from 'lucide-react';
import { getHealth } from '../api/api';

function Navbar() {
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [isHealthy, setIsHealthy] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await getHealth();
        if (res.data.status === 'healthy') {
          setDbStatus('Connected');
          setIsHealthy(true);
        } else {
          setDbStatus('Disconnected');
          setIsHealthy(false);
        }
      } catch (err) {
        setDbStatus('Offline');
        setIsHealthy(false);
      }
    };
    checkHealth();
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Reports', path: '/reports', icon: FileText, end: true },
    { name: 'New Report', path: '/reports/new', icon: PlusCircle },
    { name: 'Query Playground', path: '/query-playground', icon: TerminalSquare },
    { name: 'Bottlenecks & Fixes', path: '/bottlenecks', icon: Shield },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <NavLink to="/" className="flex items-center gap-2 text-slate-900 font-bold text-lg hover:opacity-90 transition-opacity">
                <Database className="w-6 h-6 text-blue-600" />
                <span>InspectDB</span>
              </NavLink>
            </div>

            {/* Desktop Nav */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3 py-2 mt-3 mb-3 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right side - Status Badges */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              Amazon DocumentDB
            </div>
            
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isHealthy 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'} ${isHealthy ? 'animate-pulse' : ''}`} />
              DB {dbStatus}
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
