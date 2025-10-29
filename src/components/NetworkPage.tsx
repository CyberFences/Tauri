import React, { useState, useEffect } from 'react';
import { WalletData } from '../services/WalletService';
import { NetworkService } from '../services/NetworkService';
import { FlowRow, NetworkStats } from '../types/FlowRow';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { 
  Shield, 
  Activity, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Settings, 
  Bell, 
  Search,
  Download,
  Filter,
  Play,
  Square,
  Wifi,
  HardDrive
} from 'lucide-react';

interface NetworkPageProps {
  wallet: WalletData;
  onLogout: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToSettings: () => void;
}

export const NetworkPage: React.FC<NetworkPageProps> = ({ 
  wallet, 
  onLogout, 
  onNavigateToDashboard,
  onNavigateToSettings 
}) => {
  const [flows, setFlows] = useState<FlowRow[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState('');
  const [maxFlows, setMaxFlows] = useState(200);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAdminPrivileges, setHasAdminPrivileges] = useState(false);
  
  // Loading states for buttons
  const [isStartingCapture, setIsStartingCapture] = useState(false);
  const [isStoppingCapture, setIsStoppingCapture] = useState(false);
  const [isResettingCapture, setIsResettingCapture] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  // Network monitoring effects
  useEffect(() => {
    const loadInitialData = async () => {
      // Set a timeout to ensure loading doesn't get stuck
      const timeoutId = setTimeout(() => {
        console.log('Network loading timeout - forcing load complete');
        setIsLoading(false);
      }, 3000); // 3 second timeout

      try {
        // Check admin privileges first
        const hasAdmin = await NetworkService.checkAdminPrivileges();
        setHasAdminPrivileges(hasAdmin);
        
        if (!hasAdmin) {
          console.warn('No administrator privileges detected. Packet capture may not work.');
        }

        // Check if capture is already active
        const captureActive = await NetworkService.isCaptureActive();
        setIsCapturing(captureActive);
        
        if (captureActive) {
          console.log('Network capture is already active');
        } else {
          console.log('Network capture is not active. Click "Start Capture" to begin.');
        }

        // Initialize with default stats
        setNetworkStats({
          flowsPerSecond: 0,
          packetsPerSecond: 0,
          bytesPerSecond: 0,
          totalFlows: 0,
          totalPackets: 0,
          totalBytes: 0,
          activeConnections: 0,
        });
        
        // Try to load recent flows, but don't fail if it doesn't work
        try {
          const recentFlows = await NetworkService.getRecentFlows(100);
          setFlows(recentFlows);
          console.log('Loaded initial flows:', recentFlows.length);
        } catch (error) {
          console.error('Failed to load recent flows:', error);
          // Initialize with empty flows array
          setFlows([]);
        }

        // Start listening for real-time events (non-blocking)
        try {
          await NetworkService.startListeningForFlows(
            (flow) => {
              console.log('Received real-time flow:', flow);
              setFlows(prevFlows => {
                const newFlows = [flow, ...prevFlows];
                return newFlows.slice(0, maxFlows); // Keep only the latest flows
              });
            },
            (stats) => {
              console.log('Received real-time stats:', stats);
              setNetworkStats(stats);
            },
            (packet) => {
              console.log('Received real-time packet:', packet);
              // You can add packet-level updates here if needed
            }
          );
        } catch (error) {
          console.error('Failed to start listening for flows:', error);
          // Continue without real-time updates
        }
      } catch (error) {
        console.error('Failed to load initial network data:', error);
        // Set default stats even if there's an error
        setNetworkStats({
          flowsPerSecond: 0,
          packetsPerSecond: 0,
          bytesPerSecond: 0,
          totalFlows: 0,
          totalPackets: 0,
          totalBytes: 0,
          activeConnections: 0,
        });
      } finally {
        // Clear timeout and set loading to false
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (isCapturing) {
      const startListening = async () => {
        try {
          await NetworkService.startListeningForFlows(
            (flow) => {
              console.log('Received flow event:', flow);
              setFlows(prev => {
                const newFlows = [flow, ...prev];
                return newFlows.slice(0, maxFlows); // Keep only last maxFlows flows
              });
            },
            (stats) => {
              console.log('Received stats update:', stats);
              setNetworkStats(stats);
            },
            (packet) => {
              console.log('Received packet:', packet);
              // You can add packet-level updates here if needed
            }
          );
        } catch (error) {
          console.error('Failed to start listening for flows:', error);
        }
      };

      startListening();
      
      // Listen for capture errors
      const handleCaptureError = (event: any) => {
        console.error('Capture error:', event.payload);
        alert(`Network capture failed: ${event.payload}\n\nPlease try running the application as administrator.`);
        setIsCapturing(false);
      };

      const unlisten = listen('capture_error', handleCaptureError);
      
      // Also set up periodic refresh to show flows
      const refreshInterval = setInterval(async () => {
        try {
          const recentFlows = await NetworkService.getRecentFlows(100);
          setFlows(recentFlows);
          console.log('Refreshed flows:', recentFlows.length);
        } catch (error) {
          console.error('Failed to refresh flows:', error);
        }
      }, 2000); // Refresh every 2 seconds

      return () => {
        clearInterval(refreshInterval);
        unlisten.then((unlistenFn: any) => unlistenFn());
        NetworkService.stopListeningForFlows();
      };
    } else {
      NetworkService.stopListeningForFlows();
    }
  }, [isCapturing, maxFlows]);

  // Update stats every second when capturing
  useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(async () => {
      try {
        const stats = await NetworkService.getNetworkStats();
        setNetworkStats(stats);
      } catch (error) {
        console.error('Failed to update network stats:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCapturing]);

  // Network monitoring functions
  const handleStartCapture = async () => {
    if (isCapturing || isStartingCapture) {
      console.log('Capture is already running or starting');
      return;
    }
    setIsStartingCapture(true);
    try {
      await NetworkService.startCapture(selectedInterface);
      setIsCapturing(true);
      console.log('Network capture started successfully');
    } catch (error) {
      console.error('Failed to start capture:', error);
      setIsCapturing(false);
      // Show error message to user
      alert(`Failed to start packet capture: ${error}`);
    } finally {
      setIsStartingCapture(false);
    }
  };

  const handleStopCapture = async () => {
    if (isStoppingCapture) {
      console.log('Stop operation already in progress');
      return;
    }
    setIsStoppingCapture(true);
    
    // Immediately update UI state
    setIsCapturing(false);
    
    try {
      await NetworkService.stopCapture();
      console.log('Packet capture stopped successfully');
    } catch (error) {
      console.error('Failed to stop capture:', error);
      // Keep the UI state as stopped even if there was an error
    } finally {
      setIsStoppingCapture(false);
    }
  };

  const handleResetCapture = async () => {
    if (isResettingCapture) {
      console.log('Reset operation already in progress');
      return;
    }
    setIsResettingCapture(true);
    
    // Immediately clear UI state
    setIsCapturing(false);
    setFlows([]);
    setNetworkStats({
      flowsPerSecond: 0,
      packetsPerSecond: 0,
      bytesPerSecond: 0,
      totalFlows: 0,
      totalPackets: 0,
      totalBytes: 0,
      activeConnections: 0,
    });
    
    try {
      await NetworkService.resetCapture();
      console.log('Capture state reset successfully');
    } catch (error) {
      console.error('Failed to reset capture:', error);
      // Keep the UI state as reset even if there was an error
    } finally {
      setIsResettingCapture(false);
    }
  };

  const handleExportCSV = async () => {
    if (isExportingCSV) {
      console.log('Export operation already in progress');
      return;
    }
    setIsExportingCSV(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `cic-ids2017-flows-${timestamp}.csv`;
      const result = await invoke('export_cic_csv', { filename });
      alert(result);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatFlowTime = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brilliance flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-precious-persimmon rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Wifi className="w-8 h-8 text-brilliance" />
          </div>
          <p className="text-palladium">Loading network monitor...</p>
          <p className="text-sm text-palladium mt-2">This should only take a moment</p>
        </div>
      </div>
    );
  }

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
              <p className="text-xs text-palladium">Network Monitor</p>
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
            <a href="#" className="flex items-center space-x-3 px-3 py-2 bg-precious-persimmon bg-opacity-10 text-brilliance rounded-lg">
              <Wifi className="w-5 h-5" />
              <span className="font-medium">Network</span>
            </a>
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
            <button 
              onClick={onNavigateToSettings}
              className="flex items-center space-x-3 px-3 py-2 w-full text-left text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
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
              <h1 className="text-2xl font-bold text-night-black">Network Monitor</h1>
              <p className="text-palladium">Real-time network traffic analysis and monitoring</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-palladium" />
                <input
                  type="text"
                  placeholder="Search flows..."
                  className="pl-10 pr-4 py-2 border border-violet-essence rounded-lg bg-brilliance text-night-black placeholder-palladium focus:outline-none focus:ring-2 focus:ring-precious-persimmon"
                />
              </div>
              <button className="p-2 text-palladium hover:text-night-black transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={handleExportCSV}
                disabled={isExportingCSV}
                className={`flex items-center space-x-2 px-4 py-2 border border-violet-essence text-night-black rounded-lg transition-colors ${
                  isExportingCSV 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-400'
                    : 'hover:bg-violet-essence'
                }`}
              >
                {isExportingCSV ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </>
                )}
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-violet-essence text-night-black rounded-lg hover:bg-violet-essence transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Network Monitor Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Network Monitor Header */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h2 className="text-2xl font-bold text-night-black">Network Traffic Monitor</h2>
                   <p className="text-palladium">Real-time network flow analysis and monitoring</p>
                   {!hasAdminPrivileges && (
                     <div className="mt-2 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                       <p className="text-orange-800 text-sm font-medium">
                         ⚠️ Administrator privileges required for packet capture
                       </p>
                       <p className="text-orange-700 text-xs mt-1">
                         Right-click the application and select "Run as administrator" to enable packet capture functionality.
                       </p>
                     </div>
                   )}
                 </div>
                <div className="flex items-center space-x-4">
                   <select
                     value={selectedInterface}
                     onChange={(e) => setSelectedInterface(e.target.value)}
                     className="px-3 py-2 border border-violet-essence rounded-lg bg-brilliance text-night-black focus:outline-none focus:ring-2 focus:ring-precious-persimmon"
                   >
                     <option value="">All Interfaces</option>
                     <option value="192.168.1.1">Local Network</option>
                     <option value="10.0.0.1">Private Network</option>
                     <option value="172.16.0.1">Corporate Network</option>
                   </select>
                  <button
                    onClick={isCapturing ? handleStopCapture : handleStartCapture}
                    disabled={!hasAdminPrivileges || isStartingCapture || isStoppingCapture}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      !hasAdminPrivileges || isStartingCapture || isStoppingCapture
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : isCapturing
                        ? 'bg-red-600 text-brilliance hover:bg-red-700'
                        : 'bg-green-600 text-brilliance hover:bg-green-700'
                    }`}
                  >
                    {isStartingCapture ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : isStoppingCapture ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Stopping...</span>
                      </>
                    ) : isCapturing ? (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Stop Capture</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Start Capture</span>
                      </>
                    )}
                  </button>
                 <button
                   onClick={handleResetCapture}
                   disabled={isResettingCapture}
                   className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                     isResettingCapture
                       ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                       : 'bg-orange-600 text-brilliance hover:bg-orange-700'
                   }`}
                 >
                   {isResettingCapture ? (
                     <>
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       <span>Resetting...</span>
                     </>
                   ) : (
                     <>
                       <Square className="w-4 h-4" />
                       <span>Reset</span>
                     </>
                   )}
                 </button>
                  </div>
                </div>

                {/* Network Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-violet-essence rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-precious-persimmon rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-brilliance" />
                      </div>
                      <div>
                        <p className="text-sm text-palladium">Flows/sec</p>
                        <p className="text-xl font-bold text-night-black">{networkStats?.flowsPerSecond?.toFixed(1) || '0.0'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-violet-essence rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-precious-persimmon rounded-lg flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-brilliance" />
                      </div>
                      <div>
                        <p className="text-sm text-palladium">Packets/sec</p>
                        <p className="text-xl font-bold text-night-black">{networkStats?.packetsPerSecond?.toFixed(1) || '0.0'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-violet-essence rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-precious-persimmon rounded-lg flex items-center justify-center">
                        <HardDrive className="w-5 h-5 text-brilliance" />
                      </div>
                      <div>
                        <p className="text-sm text-palladium">Bytes/sec</p>
                        <p className="text-xl font-bold text-night-black">{formatBytes(networkStats?.bytesPerSecond || 0)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-violet-essence rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-precious-persimmon rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-brilliance" />
                      </div>
                      <div>
                        <p className="text-sm text-palladium">Active Flows</p>
                        <p className="text-xl font-bold text-night-black">{networkStats?.activeConnections || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Flows Table */}
            <div className="bg-brilliance border border-violet-essence rounded-xl shadow-sm">
              <div className="p-6 border-b border-violet-essence">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-night-black">Live Network Flows</h3>
                      <p className="text-sm text-palladium">Real-time network traffic analysis</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-palladium">
                        Showing {Math.min(flows.length, maxFlows)} of {flows.length} flows
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-palladium">
                          Max: 
                        </p>
                        <select 
                          value={maxFlows} 
                          onChange={(e) => setMaxFlows(Number(e.target.value))}
                          className="text-xs border border-violet-essence rounded px-2 py-1 bg-brilliance text-night-black"
                        >
                          <option value={100}>100</option>
                          <option value={200}>200</option>
                          <option value={500}>500</option>
                          <option value={1000}>1000</option>
                        </select>
                        <span className="text-xs text-palladium">flows</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full">
                    <thead className="bg-violet-essence sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-palladium uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-palladium uppercase tracking-wider">Source → Destination</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-palladium uppercase tracking-wider">Duration (ms)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-palladium uppercase tracking-wider">Fwd Pkts</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-palladium uppercase tracking-wider">Bwd Pkts</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-palladium uppercase tracking-wider">Bytes/s</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-palladium uppercase tracking-wider">Pkts/s</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-palladium uppercase tracking-wider">SYN</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-palladium uppercase tracking-wider">ACK</th>
                      </tr>
                    </thead>
                    <tbody className="bg-brilliance divide-y divide-violet-essence">
                      {(flows || []).slice(0, maxFlows).map((flow, index) => (
                        <tr key={index} className="hover:bg-violet-essence transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-night-black">
                            {formatFlowTime(flow.start_ts * 1000)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-night-black">
                            <div className="flex flex-col">
                              <span className="font-medium">{flow.key.src}:{flow.key.src_port}</span>
                              <span className="text-palladium">→ {flow.key.dst}:{flow.key.dst_port}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-night-black text-right">
                            {(flow.duration * 1000).toFixed(0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-night-black text-right">
                            {flow.total_fwd_packets}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-night-black text-right">
                            {flow.total_bwd_packets}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-night-black text-right">
                            {formatBytes(flow.bytes_per_sec)}/s
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-night-black text-right">
                            {flow.pkts_per_sec.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-night-black text-right">
                            {flow.syn_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-night-black text-right">
                            {flow.ack_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {(!flows || flows.length === 0) && (
                    <div className="text-center py-12">
                      <Wifi className="w-12 h-12 text-palladium mx-auto mb-4" />
                      <p className="text-palladium">No network flows captured yet</p>
                      <p className="text-sm text-palladium">Start capture to begin monitoring network traffic</p>
                    </div>
                  )}
                </div>
              </div>
        </div>
      </div>
    </div>
  );
};
