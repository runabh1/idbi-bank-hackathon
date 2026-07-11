import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const LogoIcon = () => (
  <div className="w-8 h-8 rounded-[10px] bg-[#6972ef] flex items-center justify-center shadow-md">
    <Activity className="w-5 h-5 text-white" />
  </div>
);

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAction = () => {
    if (user) {
      navigate(user.role === 'admin' ? '/dashboard' : `/my-score/${user.id}`);
    } else {
      navigate('/login');
    }
  };

  const scrollTo = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="w-full max-w-5xl bg-[#2B2644]/40 backdrop-blur-xl border border-white/20 rounded-full px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 pl-1">
          <LogoIcon />
          <span className="text-lg font-semibold tracking-tight text-white">CreditPulse</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/70 font-medium">
          <a href="#applicant-search" onClick={(e) => scrollTo(e, 'applicant-search')} className="hover:text-white transition-colors duration-200 cursor-pointer">Applicant Search</a>
          <a href="#ai-committee" onClick={(e) => scrollTo(e, 'ai-committee')} className="hover:text-white transition-colors duration-200 cursor-pointer">AI Committee</a>
          <a href="#what-if-analysis" onClick={(e) => scrollTo(e, 'what-if-analysis')} className="hover:text-white transition-colors duration-200 cursor-pointer">"What-If" Analysis</a>
        </div>
        <button 
          onClick={handleAction}
          className="bg-white text-black text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors duration-200 shadow-sm"
        >
          {user ? (user.role === 'admin' ? 'View Dashboard' : 'View My Score') : 'Sign in'}
        </button>
      </nav>
    </div>
  );
}
