import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BRANDS = [
  { name: 'IDBI Bank', style: { fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em', fontSize: '15px' } },
  { name: 'Account Aggregator', style: { fontFamily: 'Arial, sans-serif', fontWeight: 900, letterSpacing: '0.08em', fontSize: '13px', textTransform: 'uppercase' } },
  { name: 'GSTN', style: { fontFamily: '"Trebuchet MS", sans-serif', fontWeight: 600, letterSpacing: '0.01em', fontSize: '15px', fontStyle: 'italic' } },
  { name: 'EPFO', style: { fontFamily: '"Courier New", monospace', fontWeight: 700, letterSpacing: '0.12em', fontSize: '13px', textTransform: 'uppercase' } },
  { name: 'UPI', style: { fontFamily: 'Palatino, "Book Antiqua", serif', fontWeight: 400, letterSpacing: '-0.01em', fontSize: '16px' } },
  { name: 'ONDC', style: { fontFamily: 'Impact, "Arial Narrow", sans-serif', fontWeight: 400, letterSpacing: '0.04em', fontSize: '14px' } },
];

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="flex-1 px-6 pt-20 pb-6 flex items-end">
      <div className="relative w-full rounded-2xl overflow-hidden max-w-[88rem] mx-auto" style={{ height: 'calc(100vh - 96px)' }}>
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="object-cover absolute inset-0 w-full h-full"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4" type="video/mp4" />
        </video>
        
        <div className="relative z-10 flex flex-col items-start justify-start h-full p-12 pt-36">
          <h1 className="text-black text-5xl md:text-6xl font-medium leading-tight max-w-xl mb-4" style={{ letterSpacing: '-0.04em' }}>
            Your Business<br/>Fully Scored
          </h1>
          <p className="text-black/70 text-base md:text-lg max-w-md mb-8 leading-relaxed" style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' }}>
            An AI-driven MSME Financial Health Card leveraging alternative data to unlock frictionless credit access.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-3 bg-black text-white text-base md:text-lg font-medium pl-8 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
          >
            View Dashboard
            <div className="bg-white rounded-full p-2">
              <ArrowRight className="w-5 h-5 text-black" />
            </div>
          </button>
          
          <div className="mt-24 w-full max-w-md overflow-hidden">
            <div className="marquee-track">
              {[...BRANDS, ...BRANDS].map((brand, i) => (
                <div key={i} className="mx-7 shrink-0 text-black/60 whitespace-nowrap" style={brand.style}>
                  {brand.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
