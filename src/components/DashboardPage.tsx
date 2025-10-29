import React, { useState, useEffect } from 'react';
import { WalletData } from '../services/WalletService';
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
  Settings, 
  Bell, 
  Search,
  Download,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

interface DashboardPageProps {
  wallet: WalletData;
  onLogout: () => void;
  onViewHistory: () => void;
  onNavigateToNetwork: () => void;
  onNavigateToSettings: () => void;
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
  onNavigateToSettings 
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            <button 
              onClick={onNavigateToNetwork}
              className="flex items-center space-x-3 px-3 py-2 w-full text-left text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Network</span>
            </button>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors">
              <CheckCircle className="w-5 h-5" />
              <span>Alerts</span>
            </a>
            <button 
              onClick={onViewHistory}
              className="flex items-center space-x-3 px-3 py-2 w-full text-left text-palladium hover:text-night-black hover:bg-violet-essence rounded-lg transition-colors"
            >
              <Clock className="w-5 h-5" />
              <span>History</span>
            </button>
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
              <button className="flex items-center space-x-2 px-4 py-2 bg-precious-persimmon text-brilliance rounded-lg hover:bg-opacity-90 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-violet-essence text-night-black rounded-lg hover:bg-violet-essence transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-y-auto">
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
                <button className="text-precious-persimmon hover:text-opacity-80 text-sm">View Details</button>
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
                    className="text-precious-persimmon hover:text-opacity-80 text-sm"
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
