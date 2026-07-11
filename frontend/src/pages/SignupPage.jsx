import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../AuthContext';

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
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    // Since this is a mock hackathon frontend, we just redirect to login
    // In a real app, we would hit the backend API to create a user
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F5] font-ttnorms">
      {/* Left side - Branding with Animation */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#E2E4E9]">
        {/* Full cover background video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-[75%_center]"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4" type="video/mp4" />
        </video>
        
        {/* Light overlay to ensure dark text remains readable over the animation */}
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
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 bg-white relative shadow-2xl">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-medium tracking-tight text-black mb-2">Create an account</h2>
            <p className="text-gray-500">Sign up to get your AI-driven Financial Health Card.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">
                    Full name
                  </label>
                  <input 
                    id="name"
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] focus:border-transparent transition-all outline-none text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="company">
                    Company name
                  </label>
                  <input 
                    id="company"
                    type="text" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] focus:border-transparent transition-all outline-none text-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                  Email address
                </label>
                <input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@app.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] focus:border-transparent transition-all outline-none text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <input 
                  id="password"
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6972ef] focus:border-transparent transition-all outline-none text-black"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#6972ef] hover:bg-[#5861d8] text-white font-medium py-3 rounded-xl transition-colors duration-200"
            >
              Sign up
            </button>
            
            <button 
              type="button" 
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm font-medium text-gray-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.47 18.63 12 18.63C9.16 18.63 6.75 16.71 5.86 14.14H2.18V16.99C4.01 20.63 7.71 23 12 23Z" fill="#34A853"/>
                <path d="M5.86 14.14C5.63 13.47 5.5 12.75 5.5 12C5.5 11.25 5.63 10.53 5.86 9.86V7.01H2.18C1.43 8.5 1 10.19 1 12C1 13.81 1.43 15.5 2.18 16.99L5.86 14.14Z" fill="#FBBC05"/>
                <path d="M12 5.38C13.62 5.38 15.07 5.94 16.22 7.02L19.35 3.89C17.45 2.12 14.97 1 12 1C7.71 1 4.01 3.37 2.18 7.01L5.86 9.86C6.75 7.29 9.16 5.38 12 5.38Z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account? <Link to="/login" className="text-black font-medium hover:underline">Sign in</Link>
          </p>
          
          <div className="text-center text-xs text-gray-400 mt-12">
            © CreditPulse · Privacy · Terms
          </div>
        </div>
      </div>
    </div>
  );
}
