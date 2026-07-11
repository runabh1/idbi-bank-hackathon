import React from 'react';
import { Activity, Shield, TrendingUp, Users } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-black text-4xl md:text-5xl font-medium leading-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
            Built for Scale and Precision
          </h2>
          <p className="text-black/60 text-lg leading-relaxed">
            CreditPulse goes beyond simple credit scoring. It provides a complete financial health infrastructure tailored for the modern Indian MSME ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 rounded-2xl bg-[#F5F5F5]">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-black text-xl font-medium mb-3">Time Machine Projections</h3>
            <p className="text-black/70 text-sm leading-relaxed">
              Rewind an applicant's historical credit score and run probabilistic Monte Carlo simulations to project future credit trajectories across Median, P90, and P10 scenarios.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F5F5F5]">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-black text-xl font-medium mb-3">MSME Owner Portal</h3>
            <p className="text-black/70 text-sm leading-relaxed">
              A dedicated view for business owners providing actionable, AI-driven tips on how to improve their credit score over time, demystifying the lending process.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F5F5F5]">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-black text-xl font-medium mb-3">Compliance & Fairness</h3>
            <p className="text-black/70 text-sm leading-relaxed">
              Built-in fairness monitoring ensures that the XGBoost models do not discriminate across tiers. The AI Compliance Officer constantly reviews decisions for regulatory adherence.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F5F5F5]">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-black text-xl font-medium mb-3">What-If Simulator</h3>
            <p className="text-black/70 text-sm leading-relaxed">
              Interactive analysis allows MSMEs to simulate business changes (e.g., "What if I reduce my EMI bounces?") and see the potential impact on their score instantly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
