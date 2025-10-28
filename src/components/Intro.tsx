import React from 'react';

interface IntroProps {
  onNext: () => void;
}

export const Intro: React.FC<IntroProps> = ({ onNext }) => {
  return (
    <div className="min-h-screen bg-brilliance flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Logo and Title */}
        <div className="mb-12">
          <div className="w-20 h-20 bg-precious-persimmon rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-brilliance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-night-black mb-4">Welcome to CyberFence</h1>
          <p className="text-lg text-palladium leading-relaxed">
            Your advanced desktop cybersecurity application designed to detect network anomalies in real-time,
            cryptographically sign alerts, and securely send them for storage and blockchain logging.
            Protect your digital perimeter with tamper-proof, verifiable, and auditable security.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 bg-precious-persimmon rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-brilliance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-night-black font-medium">Real-time Detection</span>
          </div>
          
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 bg-precious-persimmon rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-brilliance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <span className="text-night-black font-medium">Cryptographic Security</span>
          </div>
          
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 bg-precious-persimmon rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-brilliance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-night-black font-medium">Blockchain Audit</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onNext}
          className="w-full bg-precious-persimmon text-brilliance py-4 px-8 rounded-xl hover:bg-opacity-90 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Get Started
          </div>
        </button>
      </div>
    </div>
  );
};
