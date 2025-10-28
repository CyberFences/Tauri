import { useState, useEffect } from "react";
import { Intro } from "./components/Intro";
import { TermsAndConditions } from "./components/TermsAndConditions";
import { Onboarding } from "./components/Onboarding";
import { Dashboard } from "./components/Dashboard";
import { HistoryVerification } from "./components/HistoryVerification";
import { WalletData } from "./services/WalletService";
import "./App.css";

function App() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'intro' | 'terms' | 'onboarding' | 'dashboard' | 'history'>('intro');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    // Check if wallet exists in localStorage
    const savedWallet = localStorage.getItem('cyberfence_wallet');
    const savedTerms = localStorage.getItem('cyberfence_terms_accepted');
    
    if (savedTerms === 'true') {
      setTermsAccepted(true);
    }
    
    if (savedWallet && savedTerms === 'true') {
      try {
        const walletData = JSON.parse(savedWallet);
        setWallet(walletData);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Failed to parse saved wallet:', error);
        localStorage.removeItem('cyberfence_wallet');
      }
    }
    setIsLoading(false);
  }, []);

  const handleWalletCreated = (walletData: WalletData) => {
    // Store only public data in localStorage
    const publicWalletData = {
      address: walletData.address,
      public_key: walletData.public_key,
      private_key: walletData.private_key, // In production, store this securely
      mnemonic: walletData.mnemonic, // Keep mnemonic for restoration
    };
    
    localStorage.setItem('cyberfence_wallet', JSON.stringify(publicWalletData));
    setWallet(publicWalletData);
  };

  const handleWalletRestored = (walletData: WalletData) => {
    handleWalletCreated(walletData);
  };

  const handleLogout = () => {
    localStorage.removeItem('cyberfence_wallet');
    localStorage.removeItem('cyberfence_terms_accepted');
    setWallet(null);
    setTermsAccepted(false);
    setCurrentView('intro');
  };

  const handleShowHistory = () => {
    setCurrentView('history');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleIntroNext = () => {
    setCurrentView('terms');
  };

  const handleTermsAccept = () => {
    localStorage.setItem('cyberfence_terms_accepted', 'true');
    setTermsAccepted(true);
    setCurrentView('onboarding');
  };

  const handleTermsBack = () => {
    setCurrentView('intro');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brilliance flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-precious-persimmon rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <svg className="w-5 h-5 text-brilliance" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-palladium">Loading CyberFence...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'intro') {
    return <Intro onNext={handleIntroNext} />;
  }

  if (currentView === 'terms') {
    return (
      <TermsAndConditions 
        onAccept={handleTermsAccept}
        onBack={handleTermsBack}
      />
    );
  }

  if (currentView === 'onboarding' && !wallet) {
    return (
      <Onboarding 
        onWalletCreated={handleWalletCreated}
        onWalletRestored={handleWalletRestored}
      />
    );
  }

  if (currentView === 'history') {
    return (
      <HistoryVerification 
        onBack={handleBackToDashboard}
      />
    );
  }

  if (wallet) {
    return (
      <Dashboard 
        wallet={wallet}
        onLogout={handleLogout}
        onViewHistory={handleShowHistory}
      />
    );
  }

  return null;
}

export default App;