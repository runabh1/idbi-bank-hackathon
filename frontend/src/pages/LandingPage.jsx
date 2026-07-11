import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DeepDiveSection from '../components/landing/DeepDiveSection';
import InfoSection from '../components/landing/InfoSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import BackedBySection from '../components/landing/BackedBySection';
import UseCasesSection from '../components/landing/UseCasesSection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-[#F5F5F5] min-h-screen font-ttnorms">
      <div className="h-screen flex flex-col overflow-hidden relative">
        <Navbar />
        <HeroSection />
      </div>
      <InfoSection />
      <DeepDiveSection />
      <FeaturesSection />
      <BackedBySection />
      <UseCasesSection />
      <Footer />
    </div>
  );
}
