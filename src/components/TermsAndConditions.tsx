import React, { useState } from 'react';

interface TermsAndConditionsProps {
  onAccept: () => void;
  onBack: () => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onAccept, onBack }) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-brilliance relative">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-0 left-2.5 flex items-center text-palladium hover:text-night-black transition-colors z-10"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-night-black mb-4">Terms & Conditions</h1>
          <p className="text-palladium text-lg">Please read and accept our terms to continue</p>
        </div>

        <div className="bg-brilliance border border-violet-essence rounded-2xl p-8 mb-8 max-h-96 overflow-y-auto">
          <div className="space-y-6 text-night-black">
            <section>
              <h2 className="text-2xl font-semibold text-precious-persimmon mb-4">1. Service Agreement</h2>
              <p className="text-palladium leading-relaxed">
                By using CyberFence, you agree to our cybersecurity monitoring service. We provide real-time threat detection, 
                cryptographic verification, and blockchain audit capabilities for your network security needs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-precious-persimmon mb-4">2. Data Privacy & Security</h2>
              <p className="text-palladium leading-relaxed">
                Your network data is processed locally and encrypted before transmission. We implement end-to-end encryption 
                and never store your private keys. All cryptographic operations are performed on your device.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-precious-persimmon mb-4">3. Cryptographic Operations</h2>
              <p className="text-palladium leading-relaxed">
                CyberFence uses industry-standard cryptographic algorithms for wallet generation, digital signatures, 
                and data encryption. Your private keys are generated locally and never transmitted to our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-precious-persimmon mb-4">4. Blockchain Integration</h2>
              <p className="text-palladium leading-relaxed">
                Alert data may be committed to blockchain for immutable audit trails. This ensures tamper-proof 
                security logs and compliance with regulatory requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-precious-persimmon mb-4">5. Service Availability</h2>
              <p className="text-palladium leading-relaxed">
                We strive for 99.9% uptime but cannot guarantee uninterrupted service. Maintenance windows will be 
                communicated in advance when possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-precious-persimmon mb-4">6. Limitation of Liability</h2>
              <p className="text-palladium leading-relaxed">
                CyberFence is provided "as is" without warranties. We are not liable for any damages arising from 
                the use of our service, including but not limited to data loss or security breaches.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-precious-persimmon mb-4">7. Updates & Changes</h2>
              <p className="text-palladium leading-relaxed">
                We may update these terms and our service features. Continued use constitutes acceptance of any changes. 
                We will notify users of significant updates via the application interface.
              </p>
            </section>
          </div>
        </div>

        {/* Acceptance Checkbox */}
        <div className="flex items-center justify-center mb-8">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-5 h-5 text-precious-persimmon bg-brilliance border-violet-essence rounded focus:ring-precious-persimmon focus:ring-2"
            />
            <span className="ml-3 text-night-black font-medium">
              I have read and agree to the Terms & Conditions
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-8 py-3 border border-violet-essence text-palladium rounded-xl hover:border-precious-persimmon hover:text-precious-persimmon transition-colors font-medium"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!accepted}
            className="px-8 py-3 bg-precious-persimmon text-brilliance rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
