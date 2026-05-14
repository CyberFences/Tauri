import React, { useState, useEffect } from 'react';
import { WalletData } from '../services/WalletService';
import { BlockchainService } from '../services/BlockchainService';
import { useNodeStatus, NodeStatus } from '../hooks/useNodeStatus';
import { Sidebar } from './Sidebar';
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
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Bell, 
  Search,
  Download,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';

interface DashboardPageProps {
  wallet: WalletData;
  onLogout: () => void;
  onViewHistory: () => void;
  onNavigateToNetwork: () => void;
  onNavigateToSettings: () => void;
  onNavigateToGovernance?: () => void;
  onNavigateToAlerts?: () => void;
  onNavigateToTrafficHistory?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToValidator?: () => void;
  // shared node state from App
  sharedNode?: NodeStatus | null;
  sharedNodeLoading?: boolean;
  onRefreshNode?: () => void;
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

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  wallet, 
  onLogout, 
  onViewHistory, 
  onNavigateToNetwork,
  onNavigateToSettings,
  onNavigateToGovernance,
  onNavigateToAlerts,
  onNavigateToTrafficHistory,
  onNavigateToAnalytics,
  onNavigateToValidator,
  sharedNode,
  sharedNodeLoading,
  onRefreshNode,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blockchainStatus, setBlockchainStatus] = useState<{
    isRegistered: boolean;
    isLoading: boolean;
    isValidating: boolean;
  }>({
    isRegistered: false,
    isLoading: true,
    isValidating: false
  });

  const { node: ownNode, loading: ownNodeLoading, fetch: ownFetchNode } = useNodeStatus(wallet.machine_id || '');
  const node = sharedNode !== undefined ? sharedNode : ownNode;
  const nodeLoading = sharedNodeLoading !== undefined ? sharedNodeLoading : ownNodeLoading;
  const fetchNode = onRefreshNode ?? ownFetchNode;

  const refreshAll = async () => {
    fetchNode();
    setBlockchainStatus(prev => ({ ...prev, isLoading: true, isValidating: false }));
    try {
      const isRegistered = await BlockchainService.verifyMachineRegistration(wallet);
      setBlockchainStatus({ isRegistered, isLoading: false, isValidating: false });
    } catch {
      setBlockchainStatus({ isRegistered: false, isLoading: false, isValidating: false });
    }
  };

  const refreshBlockchainStatus = refreshAll;


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
    const loadData = async () => {
      // Load mock alerts
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

      // Fetch node status from Supabase
      fetchNode();

      // Check blockchain registration status
      try {
        // Check if wallet has validating state
        const isValidating = (wallet as any)?._isValidating || false;
        
        if (isValidating) {
          setBlockchainStatus({
            isRegistered: false,
            isLoading: false,
            isValidating: true
          });
        } else {
          const isRegistered = await BlockchainService.verifyMachineRegistration(wallet);
          setBlockchainStatus({
            isRegistered,
            isLoading: false,
            isValidating: false
          });
        }
      } catch (error) {
        console.error('Failed to check blockchain status:', error);
        setBlockchainStatus({
          isRegistered: false,
          isLoading: false,
          isValidating: false
        });
      }

      setIsLoading(false);
    };

    loadData();
  }, [wallet, fetchNode]);

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

  const handleNavigate = (page: 'dashboard' | 'network' | 'alerts' | 'governance' | 'history' | 'analytics' | 'settings' | 'validator') => {
    switch (page) {
      case 'network':
        onNavigateToNetwork();
        break;
      case 'settings':
        onNavigateToSettings();
        break;
      case 'history':
        if (onNavigateToTrafficHistory) onNavigateToTrafficHistory();
        else onViewHistory();
        break;
      case 'governance':
        if (onNavigateToGovernance) onNavigateToGovernance();
        break;
      case 'alerts':
        if (onNavigateToAlerts) onNavigateToAlerts();
        break;
      case 'analytics':
        if (onNavigateToAnalytics) onNavigateToAnalytics();
        break;
      case 'validator':
        if (onNavigateToValidator) onNavigateToValidator();
        break;
    }
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
      {/* Sidebar */}
      <Sidebar 
        wallet={wallet}
        currentPage="dashboard"
        onNavigate={handleNavigate}
        onLogout={onLogout}
        node={node}
        nodeLoading={nodeLoading}
        onRefreshNode={fetchNode}
      />

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
              <button
                onClick={refreshAll}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-night-black rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh all data"
              >
                <RefreshCw className={`w-4 h-4 ${(blockchainStatus.isLoading || nodeLoading) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
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
          {/* Stats Cards — all 5 in one row */}
          <div className="grid grid-cols-5 gap-4 mb-8">

            {/* Total Threats */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-palladium mb-1">Total Threats</p>
                  <p className="text-3xl font-bold text-night-black">1,247</p>
                  <p className="text-sm text-green-600">+12% from last week</p>
                </div>
                <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>

            {/* Active Alerts */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-palladium mb-1">Active Alerts</p>
                  <p className="text-3xl font-bold text-night-black">23</p>
                  <p className="text-sm text-orange-600">3 new today</p>
                </div>
                <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Network Health */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-palladium mb-1">Network Health</p>
                  <p className="text-3xl font-bold text-night-black">98.5%</p>
                  <p className="text-sm text-green-600">Excellent</p>
                </div>
                <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Validator Status */}
            <div className={`border rounded-xl p-5 shadow-sm ${
              node?.is_validator ? 'bg-green-50 border-green-200' : 'bg-brilliance border-violet-essence'
            }`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm text-palladium">Validator Status</p>
                    <button
                      onClick={fetchNode}
                      disabled={nodeLoading}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Refresh validator status"
                    >
                      <RefreshCw className={`w-3 h-3 text-palladium hover:text-night-black ${nodeLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {nodeLoading ? (
                    <p className="text-2xl font-bold text-palladium">Loading...</p>
                  ) : node?.is_validator ? (
                    <>
                      <p className="text-2xl font-bold text-green-700">Validator</p>
                      <p className="text-sm text-green-600">Active · Trust {node.trust_score}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-night-black">Standard</p>
                      <p className="text-sm text-palladium">Not a validator</p>
                    </>
                  )}
                </div>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                  node?.is_validator ? 'bg-green-200' : 'bg-gray-100'
                }`}>
                  {nodeLoading ? (
                    <div className="w-5 h-5 border-2 border-palladium border-t-transparent rounded-full animate-spin" />
                  ) : node?.is_validator ? (
                    <ShieldCheck className="w-5 h-5 text-green-700" />
                  ) : (
                    <ShieldOff className="w-5 h-5 text-palladium" />
                  )}
                </div>
              </div>
            </div>

            {/* Blockchain */}
            <div className="bg-brilliance border border-violet-essence rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm text-palladium">Blockchain</p>
                    <button
                      onClick={refreshBlockchainStatus}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Refresh blockchain status"
                    >
                      <RefreshCw className="w-3 h-3 text-palladium hover:text-night-black" />
                    </button>
                  </div>
                  {blockchainStatus.isLoading ? (
                    <p className="text-2xl font-bold text-palladium">Loading...</p>
                  ) : blockchainStatus.isValidating ? (
                    <>
                      <p className="text-2xl font-bold text-blue-600">Validating...</p>
                      <p className="text-sm text-blue-600">Confirming on-chain</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-night-black">
                        {blockchainStatus.isRegistered ? 'Registered' : 'Not Registered'}
                      </p>
                      <p className={`text-sm ${blockchainStatus.isRegistered ? 'text-green-600' : 'text-orange-600'}`}>
                        {blockchainStatus.isRegistered ? 'On-chain' : 'Pending'}
                      </p>
                    </>
                  )}
                </div>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                  blockchainStatus.isLoading ? 'bg-gray-100'
                    : blockchainStatus.isValidating ? 'bg-blue-100'
                    : blockchainStatus.isRegistered ? 'bg-green-100'
                    : 'bg-orange-100'
                }`}>
                  {blockchainStatus.isLoading ? (
                    <div className="w-4 h-4 border-2 border-palladium border-t-transparent rounded-full animate-spin" />
                  ) : blockchainStatus.isValidating ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : blockchainStatus.isRegistered ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-orange-600" />
                  )}
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
        </div>
      </div>
    </div>
  );
};
