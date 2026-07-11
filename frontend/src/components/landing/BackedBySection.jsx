import React from 'react';

const BACKERS = [
  { name: 'React', style: { fontFamily: '"Times New Roman", serif', fontWeight: 400, letterSpacing: '0.02em', fontSize: '14px' } },
  { name: 'FastAPI', style: { fontFamily: '"Arial Black", sans-serif', fontWeight: 900, letterSpacing: '0.08em', fontSize: '16px' } },
  { name: 'XGBoost', style: { fontFamily: 'Impact, sans-serif', fontWeight: 700, letterSpacing: '0.05em', fontSize: '18px' } },
  { name: 'OpenAI', style: { fontFamily: 'Georgia, serif', fontWeight: 600, letterSpacing: '-0.02em', fontSize: '17px' } },
  { name: 'Anthropic', style: { fontFamily: 'Helvetica, sans-serif', fontWeight: 700, letterSpacing: '-0.01em', fontSize: '15px' } },
  { name: 'Gemini', style: { fontFamily: 'Verdana, sans-serif', fontWeight: 700, letterSpacing: '0.06em', fontSize: '14px', textTransform: 'uppercase' } },
  { name: 'Tailwind CSS', style: { fontFamily: '"Courier New", monospace', fontWeight: 700, letterSpacing: '0.18em', fontSize: '14px' } },
  { name: 'Python', style: { fontFamily: 'Palatino, serif', fontWeight: 500, letterSpacing: '0.03em', fontSize: '15px' } },
];

export default function BackedBySection() {
  return (
    <section className="bg-[#F5F5F5] px-6 py-10 overflow-hidden">
      <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
        <div className="md:col-span-1 text-black/70 text-base leading-relaxed">
          Powered by next-gen infrastructure<br/>and advanced machine learning.
        </div>
        <div className="md:col-span-3 w-full overflow-hidden">
          <div className="backers-track">
            {[...BACKERS, ...BACKERS].map((backer, i) => (
              <div key={i} className="mx-10 shrink-0 text-black/50 whitespace-nowrap" style={backer.style}>
                {backer.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
