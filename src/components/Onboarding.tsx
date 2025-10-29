import React, { useState } from 'react';
import { WalletService, WalletData } from '../services/WalletService';

interface OnboardingProps {
  onWalletCreated: (wallet: WalletData) => void;
  onWalletRestored: (wallet: WalletData) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onWalletCreated, onWalletRestored }) => {
  const [step, setStep] = useState<'start' | 'create' | 'restore' | 'show-wallet'>('start');
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHidden, setIsHidden] = useState(false);

  const handleCreateWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const newWallet = await WalletService.generateWallet();
      setWallet(newWallet);
      setStep('show-wallet');
    } catch (err) {
      setError('Failed to generate wallet. Please try again.');
      console.log('Wallet generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreWallet = async () => {
    if (!mnemonic.trim()) {
      setError('Please enter your mnemonic phrase');
      return;
    }

    // Validate mnemonic format
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      setError('Mnemonic phrase must contain exactly 12 words');
      return;
    }

    // Check for empty words
    if (words.some(word => word === '')) {
      setError('Please ensure all 12 words are entered');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const restoredWallet = await WalletService.restoreWallet(mnemonic.trim());
      setWallet(restoredWallet);
      setStep('show-wallet');
    } catch (err) {
      setError('Invalid mnemonic phrase. Please check the words and try again.');
      console.error('Wallet restoration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (wallet) {
      // Check if this was a restored wallet by looking at the step
      if (step === 'show-wallet' && mnemonic) {
        onWalletRestored(wallet);
      } else {
        onWalletCreated(wallet);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleHideMnemonic = () => {
    setIsHidden(!isHidden);
  };

  const getDisplayWord = (word: string) => {
    if (isHidden) {
      return '*'.repeat(word.length);
    }
    return word;
  };

  if (step === 'start') {
    return (
      <div className="min-h-screen bg-brilliance relative">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="absolute top-0 left-2.5 flex items-center text-palladium hover:text-night-black transition-colors z-10"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="text-center mb-12 mt-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-precious-persimmon rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-brilliance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-night-black">CYBERFENCE</h1>
              </div>
              <h2 className="text-3xl font-bold text-night-black mb-2">New to CyberFence?</h2>
            </div>

            {/* Two Card Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Import Wallet Card */}
              <div className="bg-brilliance border-2 h-[330px] border-violet-essence rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-precious-persimmon">
                <div className="text-center relative h-full w-full">
                  <div className="w-16 h-16 bg-violet-essence rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-palladium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-night-black mb-3">No, I already have a seed phrase</h3>
                  <p className="text-palladium mb-8">Import your existing wallet using a 12 word seed phrase</p>
                  <button
                    onClick={() => setStep('restore')}
                    className="w-full absolute bottom-0 left-0 border-precious-persimmon text-precious-persimmon py-4 px-6 rounded-xl hover:bg-opacity-90 transition-colors font-semibold text-lg"
                  >
                    Import wallet
                  </button>
                </div>
              </div>

              {/* Create Wallet Card */}
              <div className="bg-brilliance border-2 border-violet-essence rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-precious-persimmon">
                <div className="text-center relative h-full w-full">
                  <div className="w-16 h-16 bg-violet-essence rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-palladium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-night-black mb-3">Yes, let's get set up!</h3>
                  <p className="text-palladium mb-8">This will create a new wallet and seed phrase</p>
                  <button
                    onClick={() => setStep('create')}
                    className="w-full border-precious-persimmon absolute bottom-0 left-0 text-precious-persimmon py-4 px-6 rounded-xl hover:bg-opacity-90 transition-colors font-semibold text-lg"
                  >
                    Create a Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen bg-brilliance relative">
        {/* Back Button */}
        <button
          onClick={() => setStep('start')}
          className="absolute top-0 left-2.5 flex items-center text-palladium hover:text-night-black transition-colors z-10"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center justify-center p-4 min-h-screen">
          <div className="max-w-md w-full bg-brilliance border border-violet-essence rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-precious-persimmon rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-brilliance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-night-black mb-2">Create New Wallet</h2>
              <p className="text-palladium">Generate a new cryptographic wallet for secure operations</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <button
              onClick={handleCreateWallet}
              disabled={loading}
              className="w-full bg-precious-persimmon text-brilliance py-4 px-6 rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brilliance" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Generate Wallet
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'restore') {
    return (
      <div className="min-h-screen bg-brilliance relative">
        <button
          onClick={() => setStep('start')}
          className="absolute top-2.5 left-2.5 flex items-center text-palladium hover:text-night-black transition-colors z-10"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center justify-center p-4 min-h-screen">
          <div className="max-w-2xl w-full bg-brilliance border border-violet-essence rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-precious-persimmon rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-brilliance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-night-black mb-2">Import Wallet</h2>
              <p className="text-palladium text-lg">Enter your 12-word mnemonic phrase to restore your wallet</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-medium text-night-black mb-3">
                Secret Recovery Phrase
              </label>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="Enter your 12-word mnemonic phrase separated by spaces..."
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-precious-persimmon focus:border-precious-persimmon resize-none transition-colors ${
                  mnemonic.trim() && mnemonic.trim().split(/\s+/).length !== 12 
                    ? 'border-red-300 bg-red-50' 
                    : mnemonic.trim() && mnemonic.trim().split(/\s+/).length === 12
                    ? 'border-green-300 bg-green-50'
                    : 'border-violet-essence'
                }`}
                rows={4}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-palladium">
                  Enter your 12-word recovery phrase in the correct order
                </p>
                <div className={`text-xs font-medium ${
                  mnemonic.trim() && mnemonic.trim().split(/\s+/).length !== 12 
                    ? 'text-red-600' 
                    : mnemonic.trim() && mnemonic.trim().split(/\s+/).length === 12
                    ? 'text-green-600'
                    : 'text-palladium'
                }`}>
                  {mnemonic.trim() ? `${mnemonic.trim().split(/\s+/).length}/12 words` : '0/12 words'}
                </div>
              </div>
            </div>

            {/* Mnemonic Words Grid - Show entered words */}
            {mnemonic.trim() && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-night-black mb-4">Your Recovery Phrase:</h3>
                <div className="bg-violet-essence border-2 border-violet-essence rounded-2xl p-6">
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 12 }, (_, index) => {
                      const words = mnemonic.trim().split(/\s+/);
                      const word = words[index] || '';
                      return (
                        <div
                          key={index}
                          className={`bg-brilliance border rounded-xl p-3 text-center transition-colors ${
                            word 
                              ? 'border-precious-persimmon' 
                              : 'border-violet-essence'
                          }`}
                        >
                          <div className="text-xs text-palladium mb-1">{index + 1}.</div>
                          <div className="text-sm font-medium text-night-black">{word}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleRestoreWallet}
              disabled={loading || !mnemonic.trim()}
              className="w-full bg-precious-persimmon text-brilliance py-4 px-6 rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brilliance" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Restoring...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Wallet
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'show-wallet' && wallet) {
    const mnemonicWords = wallet.mnemonic.split(' ');
    
    return (
      <div className="min-h-screen bg-brilliance relative">
        {/* Back Button */}
        <button
          onClick={() => setStep('start')}
          className="absolute top-0 left-2.5 flex items-center text-palladium hover:text-night-black transition-colors z-10"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-brilliance border border-violet-essence rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-precious-persimmon rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-brilliance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-night-black mb-2">Secret Recovery Phrase</h2>
              <p className="text-palladium text-lg">
                Write down this 12-word Secret Recovery Phrase and save it in a place that you trust and only you can access.
              </p>
            </div>

            {/* Tips Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-night-black mb-3">Tips:</h3>
              <ul className="text-palladium space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-precious-persimmon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save in a password manager
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-precious-persimmon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Store in a safe deposit box
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-precious-persimmon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Write down and store in multiple secret places
                </li>
              </ul>
            </div>

            {/* Machine ID Display */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-night-black mb-3">Machine ID</h3>
              <div className="bg-violet-essence border-2 border-violet-essence rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-precious-persimmon mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <span className="text-sm text-palladium">Your unique machine identifier:</span>
                  </div>
                  <div className="bg-brilliance border border-precious-persimmon rounded-lg px-4 py-2">
                    <span className="text-lg font-bold text-night-black font-mono">{wallet.machine_id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mnemonic Words Grid */}
            <div className="mb-8">
              <div className="bg-violet-essence border-2 border-violet-essence rounded-2xl p-6">
                <div className="grid grid-cols-3 gap-3">
                  {mnemonicWords.map((word, index) => (
                    <div
                      key={index}
                      className="bg-brilliance border border-violet-essence rounded-xl p-3 text-center hover:border-precious-persimmon transition-colors"
                    >
                      <div className="text-xs text-palladium mb-1">{index + 1}.</div>
                      <div className="text-sm font-medium text-night-black">{getDisplayWord(word)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex space-x-4">
                <button
                  onClick={() => copyToClipboard(wallet.mnemonic)}
                  className="flex items-center text-precious-persimmon hover:text-opacity-80 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy seed phrase
                </button>
                <button
                  onClick={() => copyToClipboard(wallet.machine_id)}
                  className="flex items-center text-precious-persimmon hover:text-opacity-80 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy machine ID
                </button>
              </div>
              <button 
                onClick={toggleHideMnemonic}
                className="flex items-center text-palladium hover:text-night-black transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
                {isHidden ? 'Show seed phrase' : 'Hide seed phrase'}
              </button>
            </div>

            {/* Important Notice */}
            <div className="mb-8 p-4 bg-no-way-rose bg-opacity-20 border border-no-way-rose rounded-xl">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-precious-persimmon mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm text-night-black font-medium mb-1">Important Security Notice</p>
                  <p className="text-sm text-gray-700">
                    Your private key will be stored securely on your device. Make sure to write down your mnemonic phrase and machine ID, and keep them safe! Anyone with access to this phrase can control your wallet. The machine ID is used for device identification.
                  </p>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full bg-precious-persimmon text-brilliance py-4 px-6 rounded-xl hover:bg-opacity-90 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Next
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
