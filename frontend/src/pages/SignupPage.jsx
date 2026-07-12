import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowLeft, Zap } from 'lucide-react';
import { useAuth } from '../AuthContext';
import api from '../api';

const DEMO_SIGNUPS = [
  { label: 'Tech Startup', name: 'Alice Smith', company: 'NovaTech', email: 'founder@novatech.in', password: 'password123', sector: 'Technology', region: 'Urban', years_in_business: 2.5, employee_count: 12, gstin: '27AADCB2230M1Z2' },
  { label: 'Manufacturing Unit', name: 'Bob Jones', company: 'Forge Steel', email: 'admin@forgesteel.in', password: 'password123', sector: 'Manufacturing', region: 'Semi-Urban', years_in_business: 15.0, employee_count: 150, gstin: '27BBACB1234M1Z2' },
  { label: 'Retail Shop', name: 'Charlie Day', company: 'FreshMart', email: 'owner@freshmart.in', password: 'password123', sector: 'Retail', region: 'Rural', years_in_business: 5.0, employee_count: 5, gstin: '27CCACB1234M1Z2' }
];

const LogoIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-[#6972ef] flex items-center justify-center shadow-md">
    <Activity className="w-6 h-6 text-white" />
  </div>
);

export default function SignupPage() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [sector, setSector] = useState('');
  const [region, setRegion] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [gstin, setGstin] = useState('');
  
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await api.post('/auth/signup', {
        business_name: company || name,
        sector: sector || 'Technology',
        region: region || 'Urban',
        years_in_business: parseFloat(yearsInBusiness) || 1.0,
        employee_count: parseInt(employeeCount) || 5,
        gstin: gstin,
        email: email,
        password: password
      });
      
      login({
        email,
        role: res.data.role,
        id: res.data.id,
        name: res.data.name,
        is_session_user: res.data.is_session_user
      });
      
      navigate(`/my-score/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during signup');
    }
  };

  const populateDemo = (demo) => {
    setName(demo.name);
    setCompany(demo.company);
    setEmail(demo.email);
    setPassword(demo.password);
    setSector(demo.sector);
    setRegion(demo.region);
    setYearsInBusiness(demo.years_in_business.toString());
    setEmployeeCount(demo.employee_count.toString());
    setGstin(demo.gstin);
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F5] font-ttnorms">
      {/* Left side - Branding with Animation */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#E2E4E9]">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-[75%_center]"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4" type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 flex flex-col items-start justify-start w-full h-full p-12 pt-16 text-left gap-6">
          <LogoIcon />
          <h1 className="text-5xl font-medium tracking-tight text-[#2B2644]">CreditPulse</h1>
          <p className="text-[#2B2644]/80 text-lg max-w-sm mt-2 font-medium">
            Join the network and unlock instant credit visibility for your MSME.
          </p>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex-[1.5] flex flex-col justify-center px-8 sm:px-16 md:px-24 bg-white relative shadow-2xl h-screen overflow-y-auto py-12">
        <Link to="/" className="absolute top-8 left-8 sm:left-12 flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <div className="max-w-2xl w-full mx-auto space-y-10 mt-8">
          <div className="text-center">
            <h2 className="text-3xl font-medium tracking-tight text-black mb-2">Create an account</h2>
            <p className="text-gray-500">Sign up to get your AI-driven Financial Health Card.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] outline-none text-black" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company name</label>
                  <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] outline-none text-black" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@app.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] outline-none text-black" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] outline-none text-black" required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sector</label>
                  <input type="text" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Technology" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] outline-none text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
                  <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Urban" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] outline-none text-black" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Years in Business</label>
                  <input type="number" step="0.5" value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} placeholder="5.0" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] outline-none text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee Count</label>
                  <input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} placeholder="10" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] outline-none text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">GSTIN</label>
                  <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="27AADCB2230M1Z2" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] outline-none text-black" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#6972ef] hover:bg-[#5861d8] text-white font-medium py-3 rounded-xl transition-colors duration-200">
              Sign up
            </button>
            
          </form>

          {/* Demo credentials quick-fill */}
          <div className="mt-8 p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-[#6972ef]" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Demo Signup</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEMO_SIGNUPS.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => populateDemo(acc)}
                  className="flex flex-col items-start justify-center px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-[#6972ef] hover:shadow-sm transition-all text-left group"
                >
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-[#6972ef]">{acc.label}</span>
                  <span className="text-xs text-gray-400 mt-1">{acc.company}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account? <Link to="/login" className="text-black font-medium hover:underline">Sign in</Link>
          </p>
          
          <div className="text-center text-xs text-gray-400 mt-12 pb-8">
            © CreditPulse · Privacy · Terms
          </div>
        </div>
      </div>
    </div>
  );
}
