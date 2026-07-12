import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

const LogoIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-[#6972ef] flex items-center justify-center shadow-md">
    <Activity className="w-5 h-5 text-white" />
  </div>
);

export default function Footer() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      // We've used the prompt, and can't use it again, throw it away
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Installation prompt is not available. You can manually install the app using your browser menu (e.g., "Add to Home Screen" or the install icon in the address bar).');
    }
  };

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
          <div className="flex items-center gap-4 mb-6">
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} CreditPulse. All rights reserved.
            </p>
            <button
              onClick={handleInstallClick}
              className="px-5 py-2.5 bg-[#6972ef] hover:bg-[#5861d8] text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Activity className="w-4 h-4 hidden" /> {/* To prevent lucide import error if Download isn't there, but we can just use the Download icon instead */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Install App
            </button>
          </div>
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
