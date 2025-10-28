// Online statistics structure matching backend
export type OnlineStats = {
  n: number;
  mean: number;
  m2: number;
  min: number;
  max: number;
  sum: number;
};

// Flow key structure matching backend
export type FlowKey = {
  src: string;
  dst: string;
  src_port: number;
  dst_port: number;
  proto: number;
};

// Main flow record structure matching backend FlowRecord
export type FlowRow = {
  key: FlowKey;
  start_ts: number;
  end_ts: number;
  duration: number;

  // Packet counts
  total_fwd_packets: number;
  total_bwd_packets: number;
  total_packets: number;

  // Byte counts
  total_len_fwd: number;
  total_len_bwd: number;
  total_bytes: number;

  // Packet length statistics
  fwd_len_stats: OnlineStats;
  bwd_len_stats: OnlineStats;

  // Inter-arrival time statistics
  fwd_iat_stats: OnlineStats;
  bwd_iat_stats: OnlineStats;

  // TCP flags counts
  fin_count: number;
  syn_count: number;
  rst_count: number;
  psh_count: number;
  ack_count: number;
  urg_count: number;
  ece_count: number;
  cwr_count: number;

  // Flow rates
  bytes_per_sec: number;
  pkts_per_sec: number;
  fwd_pkts_per_sec: number;
  bwd_pkts_per_sec: number;

  // Additional features
  avg_packet_size: number;
  fwd_avg_packet_size: number;
  bwd_avg_packet_size: number;
  down_up_ratio: number;
  min_packet_length: number;
  max_packet_length: number;
  packet_length_variance: number;

  // Extended flow metrics
  fwd_header_length: number;
  bwd_header_length: number;
  fwd_psh_flags: number;
  bwd_psh_flags: number;
  fwd_urg_flags: number;
  bwd_urg_flags: number;
  fwd_iat_total: number;
  bwd_iat_total: number;
  fwd_iat_mean: number;
  fwd_iat_std: number;
  fwd_iat_max: number;
  fwd_iat_min: number;
  bwd_iat_mean: number;
  bwd_iat_std: number;
  bwd_iat_max: number;
  bwd_iat_min: number;
  flow_iat_mean: number;
  flow_iat_std: number;
  flow_iat_max: number;
  flow_iat_min: number;
  fwd_pkt_len_max: number;
  fwd_pkt_len_min: number;
  fwd_pkt_len_mean: number;
  fwd_pkt_len_std: number;
  bwd_pkt_len_max: number;
  bwd_pkt_len_min: number;
  bwd_pkt_len_mean: number;
  bwd_pkt_len_std: number;
  avg_fwd_seg_size: number;
  avg_bwd_seg_size: number;
  fwd_avg_bytes_per_bulk: number;
  fwd_avg_pkts_per_bulk: number;
  fwd_avg_bulk_rate: number;
  bwd_avg_bytes_per_bulk: number;
  bwd_avg_pkts_per_bulk: number;
  bwd_avg_bulk_rate: number;
  subflow_fwd_pkts: number;
  subflow_fwd_bytes: number;
  subflow_bwd_pkts: number;
  subflow_bwd_bytes: number;
  init_win_bytes_fwd: number;
  init_win_bytes_bwd: number;
  act_data_pkt_fwd: number;
  min_seg_size_fwd: number;
  active_mean: number;
  active_std: number;
  active_max: number;
  active_min: number;
  idle_mean: number;
  idle_std: number;
  idle_max: number;
  idle_min: number;

  // Flow classification
  label: string;

  // Legacy fields for backward compatibility
  ts?: number;                 // epoch ms for the flow record
  srcIP?: string;
  srcPort?: number;
  dstIP?: string;
  dstPort?: number;
  destinationPort?: number; 
  flowDuration?: number;
  totalFwdPackets?: number; 
  totalBwdPackets?: number;
  totalLenFwdPkts?: number; 
  totalLenBwdPkts?: number;
  fwdPktLenMax?: number; 
  fwdPktLenMin?: number; 
  fwdPktLenMean?: number; 
  fwdPktLenStd?: number;
  bwdPktLenMax?: number; 
  bwdPktLenMin?: number; 
  bwdPktLenMean?: number; 
  bwdPktLenStd?: number;
  flowBytesPerSec?: number; 
  flowPktsPerSec?: number;
  flowIatMean?: number; 
  flowIatStd?: number; 
  flowIatMax?: number; 
  flowIatMin?: number;
  fwdIatTotal?: number; 
  fwdIatMean?: number; 
  fwdIatStd?: number; 
  fwdIatMax?: number; 
  fwdIatMin?: number;
  bwdIatTotal?: number; 
  bwdIatMean?: number; 
  bwdIatStd?: number; 
  bwdIatMax?: number; 
  bwdIatMin?: number;
  fwdPshFlags?: number; 
  bwdPshFlags?: number; 
  fwdUrgFlags?: number; 
  bwdUrgFlags?: number;
  fwdHeaderLen?: number; 
  bwdHeaderLen?: number;
  fwdPktsPerSec?: number; 
  bwdPktsPerSec?: number;
  minPktLen?: number; 
  maxPktLen?: number; 
  pktLenMean?: number; 
  pktLenStd?: number; 
  pktLenVar?: number;
  finFlagCnt?: number; 
  synFlagCnt?: number; 
  rstFlagCnt?: number; 
  pshFlagCnt?: number; 
  ackFlagCnt?: number; 
  urgFlagCnt?: number; 
  cweFlagCnt?: number; 
  eceFlagCnt?: number;
  downUpRatio?: number; 
  avgPktSize?: number; 
  avgFwdSegSize?: number; 
  avgBwdSegSize?: number;
  fwdHeaderLength?: number;
  fwdAvgBytesPerBulk?: number; 
  fwdAvgPktsPerBulk?: number; 
  fwdAvgBulkRate?: number;
  bwdAvgBytesPerBulk?: number; 
  bwdAvgPktsPerBulk?: number; 
  bwdAvgBulkRate?: number;
  subflowFwdPkts?: number; 
  subflowFwdBytes?: number; 
  subflowBwdPkts?: number; 
  subflowBwdBytes?: number;
  initWinBytesFwd?: number; 
  initWinBytesBwd?: number; 
  actDataPktFwd?: number; 
  minSegSizeFwd?: number;
  activeMean?: number; 
  activeStd?: number; 
  activeMax?: number; 
  activeMin?: number;
  idleMean?: number; 
  idleStd?: number; 
  idleMax?: number; 
  idleMin?: number;
};

export type NetworkStats = {
  flowsPerSecond: number;
  packetsPerSecond: number;
  bytesPerSecond: number;
  totalFlows: number;
  totalPackets: number;
  totalBytes: number;
  activeConnections: number;
};
