import React from 'react';

function Footer() {
  return (
    <footer className="footer-bar mt-auto py-3">
      <div className="container-fluid px-4">
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <small className="text-muted">
              <i className="bi bi-mortarboard me-1"></i>
              Project <strong>24CC3014-P070</strong> &middot; Team T211 &middot; AWS Hackathon
            </small>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <small className="text-muted">
              Amazon DocumentDB &middot; Node.js &middot; React.js &middot; MongoDB Driver
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
