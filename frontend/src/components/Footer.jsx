import React from 'react';
import { Code2, Github, Aws } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Code2 className="w-4 h-4" />
            <span>Project <strong>24CC3014-P070</strong> &middot; Team T211 &middot; AWS Hackathon</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>React.js</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>Node.js</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="font-medium text-slate-700">Amazon DocumentDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
