import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getHealth } from '../api/api';

function Navbar() {
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [dbColor, setDbColor] = useState('info');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await getHealth();
        if (res.data.status === 'healthy') {
          setDbStatus('Connected');
          setDbColor('success');
        } else {
          setDbStatus('Disconnected');
          setDbColor('danger');
        }
      } catch (err) {
        setDbStatus('Offline');
        setDbColor('danger');
      }
    };
    checkHealth();
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container-fluid px-4">
        <NavLink className="navbar-brand fw-bold" to="/">
          <i className="bi bi-database-fill-check me-2 text-success"></i>InspectDB
        </NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/"><i className="bi bi-speedometer2 me-1"></i>Dashboard</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/reports" end><i className="bi bi-file-earmark-text me-1"></i>Reports</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/reports/new"><i className="bi bi-plus-circle me-1"></i>New Report</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/query-playground"><i className="bi bi-terminal me-1"></i>Query Playground</NavLink>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2">
              <i className="bi bi-cloud-fill me-1"></i>Amazon DocumentDB
            </span>
            <span className={`badge bg-${dbColor} bg-opacity-25 text-${dbColor} border border-${dbColor} px-2 py-2`} title={dbStatus}>
              <i className="bi bi-circle-fill me-1 small"></i>DB {dbStatus}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
