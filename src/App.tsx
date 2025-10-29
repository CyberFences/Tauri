import { useState, useEffect } from "react";
import { Intro } from "./components/Intro";
import { TermsAndConditions } from "./components/TermsAndConditions";
import { Onboarding } from "./components/Onboarding";
import { DashboardPage } from "./components/DashboardPage";
import { NetworkPage } from "./components/NetworkPage";
import { SettingsPage } from "./components/SettingsPage";
import { HistoryVerification } from "./components/HistoryVerification";
import { WalletData } from "./services/WalletService";
import { EncryptedStorage } from "./services/EncryptedStorage";
import "./App.css";

function App() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'intro' | 'terms' | 'onboarding' | 'dashboard' | 'network' | 'settings' | 'history'>('intro');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    const loadApp = async () => {
      try {
        // Check if terms are accepted
        const termsAccepted = EncryptedStorage.areTermsAccepted();
        setTermsAccepted(termsAccepted);
        console.log('Terms accepted:', termsAccepted);
        
        if (termsAccepted) {
          // Check if wallet exists in encrypted storage
          const walletData = await EncryptedStorage.getWallet();
          console.log('Wallet data loaded:', walletData ? 'Yes' : 'No');
          
          if (walletData) {
            // Verify wallet integrity
            const isValid = await EncryptedStorage.verifyWallet();
            console.log('Wallet validity:', isValid);
            
            if (isValid) {
              setWallet(walletData);
              setCurrentView('dashboard');
              console.log('Navigating to dashboard');
            } else {
              console.error('Invalid wallet data detected');
              EncryptedStorage.clearWallet();
            }
          } else {
            console.log('No wallet found, staying on intro');
          }
        }
      } catch (error) {
        console.error('Failed to load app data:', error);
        // Don't clear wallet on error, just log it
        console.error('Error details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApp();
  }, []);

  const handleWalletCreated = async (walletData: WalletData) => {
    try {
      // Store wallet data encrypted
      await EncryptedStorage.storeWallet(walletData);
      setWallet(walletData);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to store wallet:', error);
      alert('Failed to store wallet securely. Please try again.');
    }
  };

  const handleWalletRestored = async (walletData: WalletData) => {
    await handleWalletCreated(walletData);
  };

  const handleLogout = () => {
    EncryptedStorage.clearWallet();
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

  const handleNavigateToNetwork = () => {
    setCurrentView('network');
  };

  const handleNavigateToSettings = () => {
    setCurrentView('settings');
  };

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleIntroNext = () => {
    setCurrentView('terms');
  };

  const handleTermsAccept = () => {
    EncryptedStorage.setTermsAccepted(true);
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

  if (currentView === 'network' && wallet) {
    return (
      <NetworkPage 
        wallet={wallet}
        onLogout={handleLogout}
        onNavigateToDashboard={handleNavigateToDashboard}
        onNavigateToSettings={handleNavigateToSettings}
      />
    );
  }

  if (currentView === 'settings' && wallet) {
    return (
      <SettingsPage 
        wallet={wallet}
        onLogout={handleLogout}
        onNavigateToDashboard={handleNavigateToDashboard}
        onNavigateToNetwork={handleNavigateToNetwork}
      />
    );
  }

  if (currentView === 'dashboard' && wallet) {
    return (
      <DashboardPage 
        wallet={wallet}
        onLogout={handleLogout}
        onViewHistory={handleShowHistory}
        onNavigateToNetwork={handleNavigateToNetwork}
        onNavigateToSettings={handleNavigateToSettings}
      />
    );
  }

  // Fallback: If we have a wallet but view isn't set to dashboard, show dashboard
  if (wallet && termsAccepted) {
    return (
      <DashboardPage 
        wallet={wallet}
        onLogout={handleLogout}
        onViewHistory={handleShowHistory}
        onNavigateToNetwork={handleNavigateToNetwork}
        onNavigateToSettings={handleNavigateToSettings}
      />
    );
  }

  // Fallback: If we're on onboarding but wallet exists, go to dashboard
  if (currentView === 'onboarding' && wallet) {
    return (
      <DashboardPage 
        wallet={wallet}
        onLogout={handleLogout}
        onViewHistory={handleShowHistory}
        onNavigateToNetwork={handleNavigateToNetwork}
        onNavigateToSettings={handleNavigateToSettings}
      />
    );
  }

  return null;
}

export default App;