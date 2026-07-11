import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const LogoIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-[#6972ef] flex items-center justify-center shadow-md">
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

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
      <div className="max-w-[88rem] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogoIcon />
          <span className="text-2xl font-medium tracking-tight text-black">CreditPulse</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-base text-gray-700 font-medium">
          <Link to="/dashboard" className="hover:text-black transition-colors duration-200">Dashboard</Link>
          <Link to="/dashboard" className="hover:text-black transition-colors duration-200">Applicant Search</Link>
          <Link to="/dashboard" className="hover:text-black transition-colors duration-200">AI Committee</Link>
          <Link to={user?.role === 'applicant' ? `/my-score/${user.id}` : "/my-score/1"} className="hover:text-black transition-colors duration-200">"What-If" Analysis</Link>
        </div>
        <button 
          onClick={handleAction}
          className="bg-black text-white text-base font-medium px-7 py-2.5 rounded-full hover:bg-gray-800 transition-colors duration-200"
        >
          {user ? (user.role === 'admin' ? 'View Dashboard' : 'View My Score') : 'Sign in'}
        </button>
      </div>
    </nav>
  );
}
