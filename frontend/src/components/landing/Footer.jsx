import React from 'react';
import { Activity } from 'lucide-react';

const LogoIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-[#6972ef] flex items-center justify-center shadow-md">
    <Activity className="w-5 h-5 text-white" />
  </div>
);

export default function Footer() {
  return (
    <footer className="bg-black text-white px-6 py-12">
      <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <LogoIcon />
            <span className="text-xl font-medium tracking-tight">CreditPulse</span>
          </div>
          <p className="text-white/60 text-sm max-w-xs leading-relaxed mb-6">
            An AI-driven MSME Financial Health Card leveraging alternative data to unlock frictionless credit access. Built for the IDBI Bank Hackathon.
          </p>
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} CreditPulse. All rights reserved.
          </p>
        </div>
        
        <div>
          <h4 className="text-white/80 font-medium mb-4">Platform</h4>
          <ul className="space-y-3 text-sm text-white/60">
            <li><a href="#" className="hover:text-white transition-colors">Loan Officer Dashboard</a></li>
            <li><a href="#" className="hover:text-white transition-colors">MSME Owner View</a></li>
            <li><a href="#" className="hover:text-white transition-colors">AI Credit Committee</a></li>
            <li><a href="#" className="hover:text-white transition-colors">What-If Simulator</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white/80 font-medium mb-4">Resources</h4>
          <ul className="space-y-3 text-sm text-white/60">
            <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Data Privacy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
