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
import { BlockchainService } from "./services/BlockchainService";
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
              // Retrieve machine ID from blockchain if wallet was restored
              let finalWalletData = walletData;
              if (!walletData.machine_id || walletData.machine_id === '') {
                console.log('Retrieving machine ID from blockchain for existing wallet...');
                const machineId = await BlockchainService.getMachineIdByPublicKey(walletData.public_key);
                if (machineId) {
                  finalWalletData = {
                    ...walletData,
                    machine_id: machineId
                  };
                  // Update stored wallet data with correct machine ID
                  await EncryptedStorage.storeWallet(finalWalletData);
                  console.log('Machine ID retrieved and updated:', machineId);
                }
              }
              
              // Verify blockchain registration
              console.log('Verifying blockchain registration...');
              const isRegistered = await BlockchainService.verifyMachineRegistration(finalWalletData);
              console.log('Blockchain registration status:', isRegistered);
              
              setWallet(finalWalletData);
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
      
      // Register machine on blockchain
      console.log('Registering machine on blockchain...');
      const registrationResult = await BlockchainService.registerMachine(walletData);
      
      if (registrationResult.success) {
        console.log('Machine successfully registered on blockchain:', registrationResult.transactionHash);
        
        // Start polling for registration confirmation
        const pollForRegistration = async () => {
          let attempts = 0;
          const maxAttempts = 30; // 30 seconds max
          
          // Set validating state immediately
          setWallet({...walletData, _isValidating: true});
          
          const checkRegistration = async () => {
            try {
              console.log(`Checking registration status (attempt ${attempts + 1}/${maxAttempts})...`);
              const isRegistered = await BlockchainService.verifyMachineRegistration(walletData);
              
              if (isRegistered) {
                console.log('Registration confirmed on blockchain!');
                // Force re-render by updating wallet state
                setWallet({...walletData, _isValidating: false});
                return;
              }
              
              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(checkRegistration, 1000); // Check every 1 second
              } else {
                console.log('Registration check timeout - will show as pending');
                setWallet({...walletData, _isValidating: false});
              }
            } catch (error) {
              console.error('Failed to check registration status:', error);
              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(checkRegistration, 1000);
              } else {
                setWallet({...walletData, _isValidating: false});
              }
            }
          };
          
          // Start checking after 2 seconds
          setTimeout(checkRegistration, 2000);
        };
        
        pollForRegistration();
      } else {
        console.warn('Failed to register machine on blockchain:', registrationResult.error);
        // Don't show error alerts - just log and continue
        // The wallet is still created and stored locally
      }
      
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to store wallet:', error);
      alert('Failed to store wallet securely. Please try again.');
    }
  };

  const handleWalletRestored = async (walletData: WalletData) => {
    try {
      // Store wallet data encrypted
      await EncryptedStorage.storeWallet(walletData);
      
      // Retrieve machine ID from blockchain
      console.log('Retrieving machine ID from blockchain for restored wallet...');
      const machineId = await BlockchainService.getMachineIdByPublicKey(walletData.public_key);
      
      if (machineId) {
        // Update wallet data with the correct machine ID from blockchain
        const updatedWalletData = {
          ...walletData,
          machine_id: machineId
        };
        
        // Store the updated wallet data
        await EncryptedStorage.storeWallet(updatedWalletData);
        setWallet(updatedWalletData);
        
        console.log('Machine ID retrieved from blockchain:', machineId);
        console.log('Wallet restored and machine ID updated');
      } else {
        // Machine not registered on blockchain
        setWallet(walletData);
        console.log('Wallet restored but machine not registered on blockchain');
      }
      
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      alert('Failed to restore wallet. Please try again.');
    }
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