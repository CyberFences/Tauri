import React, { useState, useEffect } from 'react';
import { WalletData } from '../services/WalletService';
import { BlockchainService } from '../services/BlockchainService';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Settings, 
  Eye,
  EyeOff,
  Copy,
  Key,
  Wifi,
  RefreshCw
} from 'lucide-react';

interface SettingsPageProps {
  wallet: WalletData;
  onLogout: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToNetwork: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  wallet, 
  onLogout, 
  onNavigateToDashboard,
  onNavigateToNetwork 
}) => {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showMachineId, setShowMachineId] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<{
    isRegistered: boolean;
    isLoading: boolean;
  }>({
    isRegistered: false,
    isLoading: true
  });

  const refreshBlockchainStatus = async () => {
    setBlockchainStatus(prev => ({ ...prev, isLoading: true }));
    try {
      const isRegistered = await BlockchainService.verifyMachineRegistration(wallet);
      setBlockchainStatus({
        isRegistered,
        isLoading: false
      });
      console.log('Blockchain status refreshed:', isRegistered);
    } catch (error) {
      console.error('Failed to refresh blockchain status:', error);
      setBlockchainStatus({
        isRegistered: false,
        isLoading: false
      });
    }
  };

  useEffect(() => {
    const checkBlockchainStatus = async () => {
      try {
        const isRegistered = await BlockchainService.verifyMachineRegistration(wallet);
        setBlockchainStatus({
          isRegistered,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to check blockchain status:', error);
        setBlockchainStatus({
          isRegistered: false,
          isLoading: false
        });
      }
    };

    checkBlockchainStatus();
  }, [wallet]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getDisplayValue = (value: string, isHidden: boolean) => {
    if (isHidden) {
      return '*'.repeat(Math.min(value.length, 20));
    }
    return value;
  };

  const formatKey = (key: string, isHidden: boolean) => {
    if (isHidden) {
      return '*'.repeat(20);
    }
    if (key.length > 20) {
      return `${key.slice(0, 10)}...${key.slice(-10)}`;
    }
    return key;
  };

  return (
    <div className="min-h-screen bg-brilliance flex">
      <div className="w-64 bg-brilliance border-r border-violet-essence flex flex-col fixed left-0 top-0 h-full z-10">
        <div className="p-6 border-b border-violet-essence">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-precious-persimmon rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-brilliance" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-night-black">CyberFence</h1>
              <p className="text-xs text-palladium">Settings</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            <button 
              onClick={onNavigateToDashboard}
              className="flex items-center space-x-3 px-3 py-2 w-full text-left text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors"
            >
              <Activity className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={onNavigateToNetwork}
              className="flex items-center space-x-3 px-3 py-2 w-full text-left text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors"
            >
              <Wifi className="w-5 h-5" />
              <span>Network</span>
            </button>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors">
              <CheckCircle className="w-5 h-5" />
              <span>Alerts</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors">
              <Clock className="w-5 h-5" />
              <span>History</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span>Analytics</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 bg-precious-persimmon bg-opacity-10 text-brilliance rounded-lg">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </a>
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-violet-essence">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-violet-essence rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-night-black">CF</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-night-black">CyberFence User</p>
              <p className="text-xs text-palladium">{wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-3 text-left text-sm text-palladium hover:text-night-black transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <div className="bg-brilliance border-b border-violet-essence px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-night-black">Settings</h1>
              <p className="text-palladium">Manage your wallet and application preferences</p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Wallet Information Section */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-precious-persimmon rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-brilliance" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-night-black">Wallet Information</h2>
                  <p className="text-palladium">Your encrypted wallet data and credentials</p>
                </div>
              </div>

              {/* Machine ID */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-night-black mb-2">Machine ID</label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-violet-essence border border-violet-essence rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-night-black">
                        {getDisplayValue(wallet.machine_id, !showMachineId)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowMachineId(!showMachineId)}
                          className="p-1 text-palladium hover:text-night-black transition-colors"
                        >
                          {showMachineId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(wallet.machine_id)}
                          className="p-1 text-precious-persimmon hover:text-opacity-80 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-palladium mt-1">Unique identifier for this device</p>
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-night-black mb-2">Wallet Address</label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-violet-essence border border-violet-essence rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-night-black">
                        {getDisplayValue(wallet.address, !showAddress)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowAddress(!showAddress)}
                          className="p-1 text-palladium hover:text-night-black transition-colors"
                        >
                          {showAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(wallet.address)}
                          className="p-1 text-precious-persimmon hover:text-opacity-80 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-palladium mt-1">Your public wallet address</p>
              </div>

              {/* Public Key */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-night-black mb-2">Public Key</label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-violet-essence border border-violet-essence rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-night-black text-sm">
                        {formatKey(wallet.public_key, !showPublicKey)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowPublicKey(!showPublicKey)}
                          className="p-1 text-palladium hover:text-night-black transition-colors"
                        >
                          {showPublicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(wallet.public_key)}
                          className="p-1 text-precious-persimmon hover:text-opacity-80 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-palladium mt-1">Used for encryption and verification</p>
              </div>

              {/* Private Key */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-night-black mb-2">Private Key</label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-violet-essence border border-violet-essence rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-night-black text-sm">
                        {formatKey(wallet.private_key, !showPrivateKey)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="p-1 text-palladium hover:text-night-black transition-colors"
                        >
                          {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(wallet.private_key)}
                          className="p-1 text-precious-persimmon hover:text-opacity-80 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-palladium mt-1">⚠️ Keep this secret! Used for signing transactions</p>
              </div>

              {/* Mnemonic Phrase */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-night-black mb-2">Mnemonic Phrase</label>
                <div className="bg-violet-essence border border-violet-essence rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-palladium">12-word recovery phrase</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowMnemonic(!showMnemonic)}
                        className="flex items-center space-x-1 px-2 py-1 text-palladium hover:text-night-black transition-colors"
                      >
                        {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="text-xs">{showMnemonic ? 'Hide' : 'Show'}</span>
                      </button>
                      <button
                        onClick={() => copyToClipboard(wallet.mnemonic)}
                        className="flex items-center space-x-1 px-2 py-1 text-precious-persimmon hover:text-opacity-80 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="text-xs">Copy</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {wallet.mnemonic.split(' ').map((word, index) => (
                      <div
                        key={index}
                        className="bg-brilliance border border-violet-essence rounded-lg p-2 text-center"
                      >
                        <div className="text-xs text-palladium mb-1">{index + 1}.</div>
                        <div className="text-sm font-medium text-night-black">
                          {showMnemonic ? word : '*'.repeat(word.length)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-palladium mt-1">⚠️ Store this safely! Can restore your wallet</p>
              </div>
            </div>

            {/* Blockchain Status Section */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-precious-persimmon rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brilliance" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-night-black">Blockchain Registration</h2>
                    <p className="text-palladium">Your machine's on-chain identity status</p>
                  </div>
                </div>
                <button
                  onClick={refreshBlockchainStatus}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh blockchain status"
                >
                  <RefreshCw className="w-5 h-5 text-palladium hover:text-night-black" />
                </button>
              </div>

              <div className="bg-violet-essence rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      blockchainStatus.isLoading 
                        ? 'bg-gray-400' 
                        : blockchainStatus.isRegistered 
                          ? 'bg-green-500' 
                          : 'bg-orange-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-night-black">
                        {blockchainStatus.isLoading 
                          ? 'Checking registration...' 
                          : blockchainStatus.isRegistered 
                            ? 'Machine Registered on Blockchain' 
                            : 'Machine Not Registered'
                        }
                      </p>
                      <p className="text-sm text-palladium">
                        {blockchainStatus.isLoading 
                          ? 'Verifying blockchain status...' 
                          : blockchainStatus.isRegistered 
                            ? 'Your machine is registered and verified on the blockchain' 
                            : 'Your machine needs to be registered on the blockchain'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {blockchainStatus.isLoading ? (
                      <div className="w-6 h-6 border-2 border-palladium border-t-transparent rounded-full animate-spin"></div>
                    ) : blockchainStatus.isRegistered ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-orange-600" />
                    )}
                  </div>
                </div>
              </div>

              {!blockchainStatus.isLoading && !blockchainStatus.isRegistered && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-orange-800 mb-1">Registration Required</h3>
                      <p className="text-sm text-orange-700">
                        Your machine needs to be registered on the blockchain to participate in the network. 
                        This will happen automatically when you create a new wallet or restore an existing one.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-1">Security Warning</h3>
                  <p className="text-sm text-red-700">
                    Your private key and mnemonic phrase are stored encrypted on your device. 
                    Never share these with anyone. Anyone with access to these credentials can control your wallet.
                  </p>
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-precious-persimmon rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-brilliance" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-night-black">Application Settings</h2>
                  <p className="text-palladium">Configure your CyberFence preferences</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-violet-essence">
                  <div>
                    <h3 className="text-sm font-medium text-night-black">Auto-start monitoring</h3>
                    <p className="text-xs text-palladium">Start network monitoring when application launches</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-precious-persimmon rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-precious-persimmon"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-violet-essence">
                  <div>
                    <h3 className="text-sm font-medium text-night-black">Real-time alerts</h3>
                    <p className="text-xs text-palladium">Receive notifications for security threats</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-precious-persimmon rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-precious-persimmon"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-violet-essence">
                  <div>
                    <h3 className="text-sm font-medium text-night-black">Data encryption</h3>
                    <p className="text-xs text-palladium">Encrypt all stored data for enhanced security</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-precious-persimmon rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-precious-persimmon"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="text-sm font-medium text-night-black">Auto-logout</h3>
                    <p className="text-xs text-palladium">Automatically logout after 30 minutes of inactivity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-precious-persimmon rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-precious-persimmon"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
