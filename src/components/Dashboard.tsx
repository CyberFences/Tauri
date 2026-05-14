import React, { useState, useEffect } from 'react';
import { WalletData } from '../services/WalletService';
import { NetworkService } from '../services/NetworkService';
import { FlowRow, NetworkStats } from '../types/FlowRow';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Settings, 
  Bell, 
  Search,
  Download,
  Filter,
  Eye,
  EyeOff,
  Play,
  Square,
  Wifi,
  HardDrive
} from 'lucide-react';

interface DashboardProps {
  wallet: WalletData;
  onLogout: () => void;
  onViewHistory: () => void;
}

interface Alert {
  id: string;
  timestamp: Date;
  score: number;
  label: string;
  status: 'Pending' | 'Committed';
  source_ip?: string;
  destination_ip?: string;
  packet_count?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ wallet, onLogout, onViewHistory }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flows, setFlows] = useState<FlowRow[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState('');
  const [showNetworkMonitor, setShowNetworkMonitor] = useState(false);
  const [maxFlows, setMaxFlows] = useState(200);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAdminPrivileges, setHasAdminPrivileges] = useState(false);
  
  // Loading states for buttons
  const [isStartingCapture, setIsStartingCapture] = useState(false);
  const [isStoppingCapture, setIsStoppingCapture] = useState(false);
  const [isResettingCapture, setIsResettingCapture] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  // Mock data for charts
  const networkData = [
    { time: '00:00', packets: 1200, threats: 2 },
    { time: '04:00', packets: 800, threats: 1 },
    { time: '08:00', packets: 2100, threats: 5 },
    { time: '12:00', packets: 1800, threats: 3 },
    { time: '16:00', packets: 2500, threats: 8 },
    { time: '20:00', packets: 1900, threats: 4 },
  ];

  const threatTypes = [
    { name: 'Malicious', value: 45, color: '#ef4444' },
    { name: 'Suspicious', value: 30, color: '#f97316' },
    { name: 'Normal', value: 25, color: '#22c55e' },
  ];

  const topThreats = [
    { name: 'DDoS Attack', count: 127, severity: 'High' },
    { name: 'Port Scan', count: 89, severity: 'Medium' },
    { name: 'Malware', count: 45, severity: 'High' },
    { name: 'Brute Force', count: 32, severity: 'Medium' },
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        score: 0.94,
        label: 'Malicious',
        status: 'Pending',
        source_ip: '192.168.1.100',
        destination_ip: '10.0.0.1',
        packet_count: 1250
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        score: 0.02,
        label: 'Normal',
        status: 'Committed',
        source_ip: '192.168.1.101',
        destination_ip: '8.8.8.8',
        packet_count: 45
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        score: 0.87,
        label: 'Suspicious',
        status: 'Pending',
        source_ip: '192.168.1.102',
        destination_ip: '1.1.1.1',
        packet_count: 890
      }
    ];

    setAlerts(mockAlerts);
    setIsLoading(false);
  }, []);

  // Network monitoring effects
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Assume admin privileges are available (handled by Tauri backend)
        setHasAdminPrivileges(true);

        // Check if capture is already active
        const captureActive = await NetworkService.isCaptureActive();
        setIsCapturing(captureActive);
        
        if (captureActive) {
          console.log('Network capture is already active');
        } else {
          console.log('Network capture is not active. Click "Start Capture" to begin.');
        }

        // Start listening for real-time events
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
        
        // Initialize with default stats if not available
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
          const recentFlows = await NetworkService.getRecentFlows(100);
          setFlows(recentFlows);
          console.log('Loaded initial flows:', recentFlows.length);
        } catch (error) {
          console.error('Failed to load recent flows:', error);
          // Initialize with empty flows array
          setFlows([]);
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'Committed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Malicious':
        return 'text-red-600 bg-red-100';
      case 'Suspicious':
        return 'text-orange-600 bg-orange-100';
      case 'Normal':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

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
            <Shield className="w-8 h-8 text-brilliance" />
          </div>
          <p className="text-palladium">Loading dashboard...</p>
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
              <p className="text-xs text-palladium">Security Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            <a href="#" className="flex items-center space-x-3 px-3 py-2 bg-precious-persimmon bg-opacity-10 text-brilliance rounded-lg">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors">
              <AlertTriangle className="w-5 h-5" />
              <span>Threats</span>
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
              onClick={() => setShowNetworkMonitor(!showNetworkMonitor)}
              className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                showNetworkMonitor 
                  ? 'bg-precious-persimmon bg-opacity-10 text-brilliance' 
                  : 'text-palladium hover:text-night-black hover:bg-violet-essence'
              }`}
            >
              <Wifi className="w-5 h-5" />
              <span>Network</span>
            </button>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
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
              <h1 className="text-2xl font-bold text-night-black">Dashboard</h1>
              <p className="text-palladium">Track your network security and performance</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-palladium" />
                <input
                  type="text"
                  placeholder="Search for anything..."
                  className="pl-10 pr-4 py-2 border border-violet-essence rounded-lg bg-brilliance text-night-black placeholder-palladium focus:outline-none focus:ring-2 focus:ring-precious-persimmon"
                />
              </div>
              <button className="p-2 text-palladium hover:text-night-black transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors shadow-md">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-night-black rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!showNetworkMonitor ? (
            <>
              {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-palladium mb-1">Total Threats</p>
                  <p className="text-3xl font-bold text-night-black">1,247</p>
                  <p className="text-sm text-green-600">+12% from last week</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-palladium mb-1">Active Alerts</p>
                  <p className="text-3xl font-bold text-night-black">23</p>
                  <p className="text-sm text-orange-600">3 new today</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-palladium mb-1">Network Health</p>
                  <p className="text-3xl font-bold text-night-black">98.5%</p>
                  <p className="text-sm text-green-600">Excellent</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-palladium mb-1">Response Time</p>
                  <p className="text-3xl font-bold text-night-black">&lt;50ms</p>
                  <p className="text-sm text-green-600">Optimal</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Network Activity Chart */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-night-black">Network Activity</h3>
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-palladium hover:text-night-black">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-palladium hover:text-night-black">
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={networkData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e4e6" />
                    <XAxis dataKey="time" stroke="#b1b1b1" />
                    <YAxis stroke="#b1b1b1" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fdfcfc', 
                        border: '1px solid #e6e4e6',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="packets" 
                      stroke="#f87941" 
                      fill="#f87941" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Threat Distribution */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-night-black">Threat Distribution</h3>
                <button className="px-4 py-2 bg-white border border-gray-300 text-night-black rounded-lg hover:bg-gray-50 text-sm transition-colors">View Details</button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={threatTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {threatTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fdfcfc', 
                        border: '1px solid #e6e4e6',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-6 mt-4">
                {threatTypes.map((threat, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: threat.color }}></div>
                    <span className="text-sm text-palladium">{threat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Alerts and Top Threats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <div className="bg-brilliance border border-violet-essence rounded-xl shadow-sm">
              <div className="p-6 border-b border-violet-essence">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-night-black">Recent Alerts</h3>
                  <button
                    onClick={onViewHistory}
                    className="px-4 py-2 bg-white border border-gray-300 text-night-black rounded-lg hover:bg-gray-50 text-sm transition-colors"
                  >
                    View All
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-violet-essence rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-palladium" />
                    </div>
                    <p className="text-palladium">No alerts detected</p>
                    <p className="text-sm text-palladium">Your network is secure</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 bg-violet-essence rounded-lg hover:bg-opacity-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            alert.label === 'Malicious' ? 'bg-red-500' : 
                            alert.label === 'Suspicious' ? 'bg-orange-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-night-black">{formatTime(alert.timestamp)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLabelColor(alert.label)}`}>
                                {alert.label}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                                {alert.status}
                              </span>
                            </div>
                            <div className="text-sm text-palladium">
                              Score: {alert.score.toFixed(2)} | 
                              {alert.source_ip && ` From: ${alert.source_ip}`}
                              {alert.destination_ip && ` To: ${alert.destination_ip}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-night-black">{alert.score.toFixed(2)}</div>
                          <div className="text-xs text-palladium">Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Threats */}
            <div className="bg-brilliance border border-violet-essence rounded-xl shadow-sm">
              <div className="p-6 border-b border-violet-essence">
                <h3 className="text-lg font-semibold text-night-black">Top Threats</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {topThreats.map((threat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-violet-essence rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-precious-persimmon rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-brilliance">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-night-black">{threat.name}</p>
                          <p className="text-sm text-palladium">{threat.count} incidents</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          threat.severity === 'High' ? 'text-red-600 bg-red-100' : 'text-orange-600 bg-orange-100'
                        }`}>
                          {threat.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
            </>
          ) : (
            /* Network Monitoring UI */
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
                      onClick={handleExportCSV}
                      disabled={isExportingCSV}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors shadow-md ${
                        isExportingCSV 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
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
          )}
        </div>
      </div>
    </div>
  );
};
