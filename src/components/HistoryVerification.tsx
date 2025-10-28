import React, { useState, useEffect } from 'react';

interface AlertRecord {
  id: string;
  timestamp: number;
  score: number;
  label: string;
  hash: string;
  blockchainTxHash?: string;
  verificationResult: 'Valid' | 'Invalid' | 'Pending';
  status: 'Pending' | 'Committed';
  source_ip?: string;
  destination_ip?: string;
  packet_count?: number;
}

interface HistoryVerificationProps {
  onBack: () => void;
}

export const HistoryVerification: React.FC<HistoryVerificationProps> = ({ onBack }) => {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [filter, setFilter] = useState({
    timeRange: 'all',
    status: 'all',
    verification: 'all',
  });
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading historical alerts
  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock historical data
      const mockAlerts: AlertRecord[] = Array.from({ length: 20 }, (_, i) => ({
        id: `alert_${i}`,
        timestamp: Date.now() - (i * 3600000), // 1 hour intervals
        score: Math.random(),
        label: Math.random() > 0.7 ? 'Malicious' : 'Normal',
        hash: `0x${Math.random().toString(16).substr(2, 8)}${Math.random().toString(16).substr(2, 8)}`,
        blockchainTxHash: Math.random() > 0.3 ? `0x${Math.random().toString(16).substr(2, 8)}${Math.random().toString(16).substr(2, 8)}` : undefined,
        verificationResult: Math.random() > 0.1 ? 'Valid' : 'Invalid',
        status: Math.random() > 0.2 ? 'Committed' : 'Pending',
        source_ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        destination_ip: `10.0.0.${Math.floor(Math.random() * 255)}`,
        packet_count: Math.floor(Math.random() * 1000) + 100,
      }));
      
      setAlerts(mockAlerts);
      setIsLoading(false);
    };

    loadAlerts();
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filter.timeRange !== 'all') {
      const now = Date.now();
      const timeRanges = {
        '1h': 3600000,
        '24h': 86400000,
        '7d': 604800000,
        '30d': 2592000000,
      };
      if (now - alert.timestamp > timeRanges[filter.timeRange as keyof typeof timeRanges]) {
        return false;
      }
    }
    
    if (filter.status !== 'all' && alert.status !== filter.status) {
      return false;
    }
    
    if (filter.verification !== 'all' && alert.verificationResult !== filter.verification) {
      return false;
    }
    
    return true;
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getAlertIcon = (label: string) => {
    return label === 'Malicious' ? '🔴' : '🟢';
  };

  const getAlertColor = (label: string) => {
    return label === 'Malicious' ? 'text-red-600' : 'text-green-600';
  };

  const getVerificationColor = (result: string) => {
    switch (result) {
      case 'Valid': return 'text-green-600 bg-green-100';
      case 'Invalid': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Alert History & Verification</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                <select
                  value={filter.timeRange}
                  onChange={(e) => setFilter(prev => ({ ...prev, timeRange: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Committed">Committed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                <select
                  value={filter.verification}
                  onChange={(e) => setFilter(prev => ({ ...prev, verification: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Verification</option>
                  <option value="Valid">Valid</option>
                  <option value="Invalid">Invalid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Alert History ({filteredAlerts.length} alerts)
            </h2>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-gray-600">Loading alerts...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(alert.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.score.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getAlertColor(alert.label)}`}>
                          {getAlertIcon(alert.label)} {alert.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          alert.status === 'Committed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVerificationColor(alert.verificationResult)}`}>
                          {alert.verificationResult}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {alert.hash.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAlerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No alerts found matching your filters.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Alert Details</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <p className="text-sm text-gray-900">{formatTime(selectedAlert.timestamp)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Score</label>
                  <p className="text-sm text-gray-900">{selectedAlert.score.toFixed(3)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Label</label>
                  <p className={`text-sm font-medium ${getAlertColor(selectedAlert.label)}`}>
                    {getAlertIcon(selectedAlert.label)} {selectedAlert.label}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedAlert.status === 'Committed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedAlert.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verification</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVerificationColor(selectedAlert.verificationResult)}`}>
                    {selectedAlert.verificationResult}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hash</label>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-900 font-mono flex-1">{selectedAlert.hash}</p>
                    <button
                      onClick={() => copyToClipboard(selectedAlert.hash)}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                {selectedAlert.blockchainTxHash && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blockchain Transaction</label>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-900 font-mono flex-1">{selectedAlert.blockchainTxHash}</p>
                      <button
                        onClick={() => copyToClipboard(selectedAlert.blockchainTxHash!)}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                {selectedAlert.source_ip && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source IP</label>
                    <p className="text-sm text-gray-900">{selectedAlert.source_ip}</p>
                  </div>
                )}
                {selectedAlert.destination_ip && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Destination IP</label>
                    <p className="text-sm text-gray-900">{selectedAlert.destination_ip}</p>
                  </div>
                )}
                {selectedAlert.packet_count && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Packet Count</label>
                    <p className="text-sm text-gray-900">{selectedAlert.packet_count}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
