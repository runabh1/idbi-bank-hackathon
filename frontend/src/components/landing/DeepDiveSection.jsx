import React from 'react';
import { Search, Brain, SlidersHorizontal } from 'lucide-react';

export default function DeepDiveSection() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="max-w-[88rem] mx-auto space-y-32">
        {/* Applicant Search */}
        <div id="applicant-search" className="flex flex-col md:flex-row items-center gap-16 scroll-mt-32">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-medium tracking-tight text-black">Applicant Search</h2>
            <p className="text-lg text-black/70 leading-relaxed">
              Instantly search through thousands of MSME loan applications using advanced filtering and AI-driven sorting. Identify high-potential applicants based on synthetic alternative data, cash flow health, and GST compliance, reducing manual underwriting time by up to 80%.
            </p>
          </div>
          <div className="flex-1 bg-[#F5F5F5] p-8 rounded-3xl border border-gray-200/50 w-full h-80 flex flex-col justify-center gap-4 hover:shadow-xl transition-shadow duration-300">
             {/* Mockup UI */}
             <div className="h-12 bg-white rounded-xl w-full flex items-center px-4 gap-3 shadow-sm">
               <Search className="w-5 h-5 text-gray-400" />
               <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
             </div>
             <div className="space-y-3 mt-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex gap-4 items-center bg-white p-3 rounded-xl shadow-sm">
                   <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                   <div className="flex-1 space-y-2">
                     <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                     <div className="h-2 w-1/4 bg-gray-100 rounded"></div>
                   </div>
                   <div className="h-6 w-16 bg-emerald-100 rounded-full"></div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* AI Committee */}
        <div id="ai-committee" className="flex flex-col md:flex-row-reverse items-center gap-16 scroll-mt-32">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-medium tracking-tight text-black">AI Committee</h2>
            <p className="text-lg text-black/70 leading-relaxed">
              Experience the future of underwriting with a panel of specialized LLM agents. The Risk Analyst, Compliance Officer, and Financial Strategist collaboratively debate the merits of an application, providing a comprehensive, bias-free, and explainable decision in seconds.
            </p>
          </div>
          <div className="flex-1 bg-[#F5F5F5] p-8 rounded-3xl border border-gray-200/50 w-full h-80 flex flex-col justify-center gap-4 hover:shadow-xl transition-shadow duration-300">
             {/* Mockup UI */}
             <div className="flex justify-between items-end mb-4">
               <div className="flex gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm"><Brain className="w-5 h-5 text-blue-600"/></div>
                 <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shadow-sm"><Brain className="w-5 h-5 text-purple-600"/></div>
                 <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm"><Brain className="w-5 h-5 text-emerald-600"/></div>
               </div>
             </div>
             <div className="bg-white rounded-xl p-5 text-sm text-gray-600 italic border border-gray-100 shadow-sm relative">
               <div className="absolute -top-2 left-6 w-4 h-4 bg-white transform rotate-45 border-t border-l border-gray-100"></div>
               "The applicant's strong cash flow health mitigates the recent drop in banking discipline. I recommend approval."
             </div>
             <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-700 font-medium border border-emerald-100 mt-2 shadow-sm">
               Consensus reached: Recommend Approval (85% confidence)
             </div>
          </div>
        </div>

        {/* What-If Analysis */}
        <div id="what-if-analysis" className="flex flex-col md:flex-row items-center gap-16 scroll-mt-32">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-medium tracking-tight text-black">"What-If" Analysis</h2>
            <p className="text-lg text-black/70 leading-relaxed">
              Empower MSME owners and loan officers with interactive scenario modeling. Adjust key metrics like GST Punctuality or Cashflow Health to instantly simulate how these changes would impact the overall credit score and loan eligibility, fostering transparency.
            </p>
          </div>
          <div className="flex-1 bg-[#F5F5F5] p-8 rounded-3xl border border-gray-200/50 w-full h-80 flex flex-col justify-center gap-6 hover:shadow-xl transition-shadow duration-300">
             {/* Mockup UI */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
               {[1, 2].map(i => (
                 <div key={i} className="space-y-3">
                   <div className="flex justify-between text-sm">
                     <span className="font-medium text-gray-700">Metric {i}</span>
                     <span className="text-brand-600 font-bold">8{i}</span>
                   </div>
                   <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div className="h-full bg-brand-500 w-4/5 rounded-full relative">
                       <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50"></div>
                     </div>
                   </div>
                 </div>
               ))}
               <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                 <span className="text-sm font-medium text-gray-500">Projected Score</span>
                 <span className="text-4xl font-bold text-black tracking-tight">742</span>
               </div>
             </div>
          </div>
        </div>

      </div>
    </section>
  );
}
