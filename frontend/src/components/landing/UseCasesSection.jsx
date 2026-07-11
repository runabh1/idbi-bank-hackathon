import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UseCasesSection() {
  const navigate = useNavigate();
  return (
    <section className="bg-[#F5F5F5] px-6 py-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="md:pr-12 md:pt-2">
            <p className="text-black/60 text-sm mb-2">CreditPulse in Practice</p>
            <h2 className="text-5xl md:text-6xl font-medium leading-none mb-6" style={{ letterSpacing: '-0.04em' }}>
              Use modes
            </h2>
            <p className="text-black/60 text-base leading-relaxed max-w-sm">
              CreditPulse powers a wide range of modes for banks, loan officers, and MSME owners wanting accurate risk assessments and financial health tracking.
            </p>
          </div>
          
          <div className="relative rounded-3xl overflow-hidden min-h-[720px]">
            <video 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="object-cover absolute inset-0 w-full h-full"
            >
              <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4" type="video/mp4" />
            </video>
            
            <div className="relative z-10 p-10 md:p-12 h-full flex flex-col justify-end">
              <h3 className="text-black text-4xl md:text-5xl font-medium leading-tight mb-5" style={{ letterSpacing: '-0.03em' }}>
                Lending
              </h3>
              <p className="text-black/70 text-base max-w-md mb-8">
                Accelerate loan origination with confident, data-driven decisions and automated AI assessments. Give MSMEs instant visibility into their credit trajectory.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-3 text-black text-base font-medium transition-colors duration-200 w-fit group"
              >
                <div className="w-9 h-9 rounded-full bg-white/80 backdrop-blur shadow-sm border border-black/5 flex items-center justify-center group-hover:bg-white transition-colors">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
                Know more
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
