use pcap::{Device, Capture};
use etherparse::{PacketHeaders, TransportHeader};
use std::collections::HashMap;
use std::net::IpAddr;
use std::time::{SystemTime, Duration, UNIX_EPOCH};
use serde::{Serialize, Deserialize};
use serde_json;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};
use anyhow::Result;

// Constants
const FLOW_TIMEOUT_SECONDS: f64 = 60.0; // 60 seconds timeout for flows
const FLOW_CLEANUP_INTERVAL: u64 = 5; // Cleanup every 5 seconds

// Helper function to get current timestamp in seconds
fn now_ts_secs(ts: SystemTime) -> f64 {
    ts.duration_since(UNIX_EPOCH).unwrap().as_secs_f64()
}

// Online statistics calculator using Welford's algorithm
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct OnlineStats {
    pub n: u64,
    pub mean: f64,
    pub m2: f64,
    pub min: f64,
    pub max: f64,
    pub sum: f64,
}

impl OnlineStats {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add(&mut self, x: f64) {
        if self.n == 0 {
            self.min = x;
            self.max = x;
        } else {
            if x < self.min { self.min = x; }
            if x > self.max { self.max = x; }
        }
        self.n += 1;
        let delta = x - self.mean;
        self.mean += delta / (self.n as f64);
        let delta2 = x - self.mean;
        self.m2 += delta * delta2;
        self.sum += x;
    }

    pub fn variance(&self) -> f64 { 
        if self.n > 1 { 
            self.m2 / ((self.n - 1) as f64) 
        } else { 
            0.0 
        } 
    }

    pub fn std(&self) -> f64 { 
        self.variance().sqrt() 
    }
}

// Flow key for identifying unique flows
#[derive(Serialize, Deserialize, Debug, Clone, Hash, PartialEq, Eq)]
pub struct FlowKey {
    pub src: String,
    pub dst: String,
    pub src_port: u16,
    pub dst_port: u16,
    pub proto: u8,
}

// Comprehensive flow record for ML analysis
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FlowRecord {
    pub key: FlowKey,
    pub start_ts: f64,
    pub end_ts: f64,
    pub duration: f64,

    // Packet counts
    pub total_fwd_packets: u64,
    pub total_bwd_packets: u64,
    pub total_packets: u64,

    // Byte counts
    pub total_len_fwd: u64,
    pub total_len_bwd: u64,
    pub total_bytes: u64,

    // Packet length statistics
    pub fwd_len_stats: OnlineStats,
    pub bwd_len_stats: OnlineStats,

    // Inter-arrival time statistics
    pub fwd_iat_stats: OnlineStats,
    pub bwd_iat_stats: OnlineStats,

    // TCP flags counts
    pub fin_count: u64,
    pub syn_count: u64,
    pub rst_count: u64,
    pub psh_count: u64,
    pub ack_count: u64,
    pub urg_count: u64,
    pub ece_count: u64,
    pub cwr_count: u64,

    // Flow rates
    pub bytes_per_sec: f64,
    pub pkts_per_sec: f64,
    pub fwd_pkts_per_sec: f64,
    pub bwd_pkts_per_sec: f64,

    // Additional features
    pub avg_packet_size: f64,
    pub fwd_avg_packet_size: f64,
    pub bwd_avg_packet_size: f64,
    pub down_up_ratio: f64,
    pub min_packet_length: f64,
    pub max_packet_length: f64,
    pub packet_length_variance: f64,

    // Extended flow metrics
    pub fwd_header_length: f64,
    pub bwd_header_length: f64,
    pub fwd_psh_flags: u64,
    pub bwd_psh_flags: u64,
    pub fwd_urg_flags: u64,
    pub bwd_urg_flags: u64,
    pub fwd_iat_total: f64,
    pub bwd_iat_total: f64,
    pub fwd_iat_mean: f64,
    pub fwd_iat_std: f64,
    pub fwd_iat_max: f64,
    pub fwd_iat_min: f64,
    pub bwd_iat_mean: f64,
    pub bwd_iat_std: f64,
    pub bwd_iat_max: f64,
    pub bwd_iat_min: f64,
    pub flow_iat_mean: f64,
    pub flow_iat_std: f64,
    pub flow_iat_max: f64,
    pub flow_iat_min: f64,
    pub fwd_pkt_len_max: f64,
    pub fwd_pkt_len_min: f64,
    pub fwd_pkt_len_mean: f64,
    pub fwd_pkt_len_std: f64,
    pub bwd_pkt_len_max: f64,
    pub bwd_pkt_len_min: f64,
    pub bwd_pkt_len_mean: f64,
    pub bwd_pkt_len_std: f64,
    pub avg_fwd_seg_size: f64,
    pub avg_bwd_seg_size: f64,
    pub fwd_avg_bytes_per_bulk: f64,
    pub fwd_avg_pkts_per_bulk: f64,
    pub fwd_avg_bulk_rate: f64,
    pub bwd_avg_bytes_per_bulk: f64,
    pub bwd_avg_pkts_per_bulk: f64,
    pub bwd_avg_bulk_rate: f64,
    pub subflow_fwd_pkts: u64,
    pub subflow_fwd_bytes: u64,
    pub subflow_bwd_pkts: u64,
    pub subflow_bwd_bytes: u64,
    pub init_win_bytes_fwd: u64,
    pub init_win_bytes_bwd: u64,
    pub act_data_pkt_fwd: u64,
    pub min_seg_size_fwd: f64,
    pub active_mean: f64,
    pub active_std: f64,
    pub active_max: f64,
    pub active_min: f64,
    pub idle_mean: f64,
    pub idle_std: f64,
    pub idle_max: f64,
    pub idle_min: f64,

    // Flow classification
    pub label: String,
}

// Internal flow state for tracking
struct Flow {
    key: FlowKey,
    start_ts: f64,
    last_ts: f64,
    fwd_addr: String,
    
    // Packet counts
    total_fwd_packets: u64,
    total_bwd_packets: u64,
    
    // Byte counts
    total_len_fwd: u64,
    total_len_bwd: u64,
    
    // Statistics
    fwd_len_stats: OnlineStats,
    bwd_len_stats: OnlineStats,
    
    // Inter-arrival tracking
    last_fwd_ts: Option<f64>,
    last_bwd_ts: Option<f64>,
    fwd_iat_stats: OnlineStats,
    bwd_iat_stats: OnlineStats,
    
    // TCP flags
    fin_count: u64,
    syn_count: u64,
    rst_count: u64,
    psh_count: u64,
    ack_count: u64,
    urg_count: u64,
    ece_count: u64,
    cwr_count: u64,
    
    // Directional TCP flags
    fwd_psh_flags: u64,
    bwd_psh_flags: u64,
    fwd_urg_flags: u64,
    bwd_urg_flags: u64,
    
    // Header length tracking
    fwd_header_length: f64,
    bwd_header_length: f64,
    
    // Window size tracking
    init_win_bytes_fwd: u64,
    init_win_bytes_bwd: u64,
    
    // Activity tracking for active/idle periods
    active_periods: Vec<f64>,
    idle_periods: Vec<f64>,
    last_activity_ts: f64,
    current_active_start: Option<f64>,
    
    // Bulk transfer detection
    fwd_bulk_bytes: u64,
    fwd_bulk_packets: u64,
    bwd_bulk_bytes: u64,
    bwd_bulk_packets: u64,
    fwd_bulk_count: u64,
    bwd_bulk_count: u64,
    
    // Subflow tracking (simplified - same as main flow for now)
    subflow_fwd_packets: u64,
    subflow_fwd_bytes: u64,
    subflow_bwd_packets: u64,
    subflow_bwd_bytes: u64,
}

impl Flow {
    fn new(key: FlowKey, ts: f64, fwd_addr: String) -> Self {
        Flow {
            key,
            start_ts: ts,
            last_ts: ts,
            fwd_addr,
            total_fwd_packets: 0,
            total_bwd_packets: 0,
            total_len_fwd: 0,
            total_len_bwd: 0,
            fwd_len_stats: OnlineStats::new(),
            bwd_len_stats: OnlineStats::new(),
            last_fwd_ts: None,
            last_bwd_ts: None,
            fwd_iat_stats: OnlineStats::new(),
            bwd_iat_stats: OnlineStats::new(),
            fin_count: 0,
            syn_count: 0,
            rst_count: 0,
            psh_count: 0,
            ack_count: 0,
            urg_count: 0,
            ece_count: 0,
            cwr_count: 0,
            fwd_psh_flags: 0,
            bwd_psh_flags: 0,
            fwd_urg_flags: 0,
            bwd_urg_flags: 0,
            fwd_header_length: 0.0,
            bwd_header_length: 0.0,
            init_win_bytes_fwd: 0,
            init_win_bytes_bwd: 0,
            active_periods: Vec::new(),
            idle_periods: Vec::new(),
            last_activity_ts: ts,
            current_active_start: Some(ts),
            fwd_bulk_bytes: 0,
            fwd_bulk_packets: 0,
            bwd_bulk_bytes: 0,
            bwd_bulk_packets: 0,
            fwd_bulk_count: 0,
            bwd_bulk_count: 0,
            subflow_fwd_packets: 0,
            subflow_fwd_bytes: 0,
            subflow_bwd_packets: 0,
            subflow_bwd_bytes: 0,
        }
    }

    fn add_packet(&mut self, ts: f64, src: &str, len: usize, tcp_flags: Option<u8>) {
        let is_fwd = src == self.fwd_addr;
        
        // Update activity tracking
        self.update_activity_tracking(ts);
        
        if is_fwd {
            self.total_fwd_packets += 1;
            self.total_len_fwd += len as u64;
            self.fwd_len_stats.add(len as f64);
            
            // Update subflow tracking
            self.subflow_fwd_packets += 1;
            self.subflow_fwd_bytes += len as u64;
            
            if let Some(prev) = self.last_fwd_ts {
                let iat = ts - prev;
                self.fwd_iat_stats.add(iat);
            }
            self.last_fwd_ts = Some(ts);
            
            // Track header length (simplified - assume 20 bytes for TCP header)
            if self.key.proto == 6 { // TCP
                self.fwd_header_length = 20.0;
            } else if self.key.proto == 17 { // UDP
                self.fwd_header_length = 8.0;
            }
            
            // Bulk transfer detection (simplified heuristic)
            if len > 1000 { // Large packet indicates bulk transfer
                self.fwd_bulk_bytes += len as u64;
                self.fwd_bulk_packets += 1;
                self.fwd_bulk_count += 1;
            }
        } else {
            self.total_bwd_packets += 1;
            self.total_len_bwd += len as u64;
            self.bwd_len_stats.add(len as f64);
            
            // Update subflow tracking
            self.subflow_bwd_packets += 1;
            self.subflow_bwd_bytes += len as u64;
            
            if let Some(prev) = self.last_bwd_ts {
                let iat = ts - prev;
                self.bwd_iat_stats.add(iat);
            }
            self.last_bwd_ts = Some(ts);
            
            // Track header length
            if self.key.proto == 6 { // TCP
                self.bwd_header_length = 20.0;
            } else if self.key.proto == 17 { // UDP
                self.bwd_header_length = 8.0;
            }
            
            // Bulk transfer detection
            if len > 1000 {
                self.bwd_bulk_bytes += len as u64;
                self.bwd_bulk_packets += 1;
                self.bwd_bulk_count += 1;
            }
        }

        // Update TCP flags with directional tracking
        if let Some(flags) = tcp_flags {
            if (flags & 0x01) != 0 { self.fin_count += 1; }
            if (flags & 0x02) != 0 { 
                self.syn_count += 1;
                // Track initial window size on SYN
                if is_fwd && self.init_win_bytes_fwd == 0 {
                    self.init_win_bytes_fwd = len as u64; // Simplified
                } else if !is_fwd && self.init_win_bytes_bwd == 0 {
                    self.init_win_bytes_bwd = len as u64; // Simplified
                }
            }
            if (flags & 0x04) != 0 { self.rst_count += 1; }
            if (flags & 0x08) != 0 { 
                self.psh_count += 1;
                if is_fwd { self.fwd_psh_flags += 1; } else { self.bwd_psh_flags += 1; }
            }
            if (flags & 0x10) != 0 { self.ack_count += 1; }
            if (flags & 0x20) != 0 { 
                self.urg_count += 1;
                if is_fwd { self.fwd_urg_flags += 1; } else { self.bwd_urg_flags += 1; }
            }
            if (flags & 0x40) != 0 { self.ece_count += 1; }
            if (flags & 0x80) != 0 { self.cwr_count += 1; }
        }

        if ts > self.last_ts { 
            self.last_ts = ts; 
        }
    }
    
    fn update_activity_tracking(&mut self, ts: f64) {
        const ACTIVITY_THRESHOLD: f64 = 1.0; // 1 second threshold for activity
        
        let time_since_last = ts - self.last_activity_ts;
        
        if time_since_last > ACTIVITY_THRESHOLD {
            // Gap detected - end current active period and start idle period
            if let Some(active_start) = self.current_active_start {
                let active_duration = self.last_activity_ts - active_start;
                if active_duration > 0.0 {
                    self.active_periods.push(active_duration);
                }
            }
            
            // Record idle period
            if time_since_last > ACTIVITY_THRESHOLD {
                self.idle_periods.push(time_since_last);
            }
            
            self.current_active_start = Some(ts);
        }
        
        self.last_activity_ts = ts;
    }

    fn to_record(&self) -> FlowRecord {
        let duration = (self.last_ts - self.start_ts).max(1e-6);
        let total_bytes = self.total_len_fwd + self.total_len_bwd;
        let total_pkts = self.total_fwd_packets + self.total_bwd_packets;
        
        let bytes_per_sec = total_bytes as f64 / duration;
        let pkts_per_sec = total_pkts as f64 / duration;
        let fwd_pkts_per_sec = self.total_fwd_packets as f64 / duration;
        let bwd_pkts_per_sec = self.total_bwd_packets as f64 / duration;
        
        let avg_packet_size = if total_pkts > 0 { total_bytes as f64 / total_pkts as f64 } else { 0.0 };
        let fwd_avg_packet_size = if self.total_fwd_packets > 0 { self.total_len_fwd as f64 / self.total_fwd_packets as f64 } else { 0.0 };
        let bwd_avg_packet_size = if self.total_bwd_packets > 0 { self.total_len_bwd as f64 / self.total_bwd_packets as f64 } else { 0.0 };
        
        let down_up_ratio = if self.total_len_fwd > 0 { self.total_len_bwd as f64 / self.total_len_fwd as f64 } else { 0.0 };
        
        let min_packet_length = self.fwd_len_stats.min.min(self.bwd_len_stats.min);
        let max_packet_length = self.fwd_len_stats.max.max(self.bwd_len_stats.max);
        
        // Combined packet length variance
        let packet_length_variance = (self.fwd_len_stats.variance() + self.bwd_len_stats.variance()) / 2.0;
        
        // Compute active/idle statistics
        let (active_mean, active_std, active_max, active_min) = self.compute_period_stats(&self.active_periods);
        let (idle_mean, idle_std, idle_max, idle_min) = self.compute_period_stats(&self.idle_periods);
        
        // Compute bulk transfer metrics
        let fwd_avg_bytes_per_bulk = if self.fwd_bulk_count > 0 { self.fwd_bulk_bytes as f64 / self.fwd_bulk_count as f64 } else { 0.0 };
        let fwd_avg_pkts_per_bulk = if self.fwd_bulk_count > 0 { self.fwd_bulk_packets as f64 / self.fwd_bulk_count as f64 } else { 0.0 };
        let fwd_avg_bulk_rate = if duration > 0.0 && self.fwd_bulk_count > 0 { self.fwd_bulk_count as f64 / duration } else { 0.0 };
        
        let bwd_avg_bytes_per_bulk = if self.bwd_bulk_count > 0 { self.bwd_bulk_bytes as f64 / self.bwd_bulk_count as f64 } else { 0.0 };
        let bwd_avg_pkts_per_bulk = if self.bwd_bulk_count > 0 { self.bwd_bulk_packets as f64 / self.bwd_bulk_count as f64 } else { 0.0 };
        let bwd_avg_bulk_rate = if duration > 0.0 && self.bwd_bulk_count > 0 { self.bwd_bulk_count as f64 / duration } else { 0.0 };
        
        // Compute minimum segment size
        let min_seg_size_fwd = if self.total_fwd_packets > 0 { self.fwd_len_stats.min } else { 0.0 };
        
        FlowRecord {
            key: self.key.clone(),
            start_ts: self.start_ts,
            end_ts: self.last_ts,
            duration,
            total_fwd_packets: self.total_fwd_packets,
            total_bwd_packets: self.total_bwd_packets,
            total_packets: total_pkts,
            total_len_fwd: self.total_len_fwd,
            total_len_bwd: self.total_len_bwd,
            total_bytes,
            fwd_len_stats: self.fwd_len_stats.clone(),
            bwd_len_stats: self.bwd_len_stats.clone(),
            fwd_iat_stats: self.fwd_iat_stats.clone(),
            bwd_iat_stats: self.bwd_iat_stats.clone(),
            fin_count: self.fin_count,
            syn_count: self.syn_count,
            rst_count: self.rst_count,
            psh_count: self.psh_count,
            ack_count: self.ack_count,
            urg_count: self.urg_count,
            ece_count: self.ece_count,
            cwr_count: self.cwr_count,
            bytes_per_sec,
            pkts_per_sec,
            fwd_pkts_per_sec,
            bwd_pkts_per_sec,
            avg_packet_size,
            fwd_avg_packet_size,
            bwd_avg_packet_size,
            down_up_ratio,
            min_packet_length,
            max_packet_length,
            packet_length_variance,
            
            // Extended metrics
            fwd_header_length: self.fwd_header_length,
            bwd_header_length: self.bwd_header_length,
            fwd_psh_flags: self.fwd_psh_flags,
            bwd_psh_flags: self.bwd_psh_flags,
            fwd_urg_flags: self.fwd_urg_flags,
            bwd_urg_flags: self.bwd_urg_flags,
            fwd_iat_total: self.fwd_iat_stats.sum,
            bwd_iat_total: self.bwd_iat_stats.sum,
            fwd_iat_mean: self.fwd_iat_stats.mean,
            fwd_iat_std: self.fwd_iat_stats.std(),
            fwd_iat_max: self.fwd_iat_stats.max,
            fwd_iat_min: self.fwd_iat_stats.min,
            bwd_iat_mean: self.bwd_iat_stats.mean,
            bwd_iat_std: self.bwd_iat_stats.std(),
            bwd_iat_max: self.bwd_iat_stats.max,
            bwd_iat_min: self.bwd_iat_stats.min,
            flow_iat_mean: (self.fwd_iat_stats.mean + self.bwd_iat_stats.mean) / 2.0,
            flow_iat_std: ((self.fwd_iat_stats.variance() + self.bwd_iat_stats.variance()) / 2.0).sqrt(),
            flow_iat_max: self.fwd_iat_stats.max.max(self.bwd_iat_stats.max),
            flow_iat_min: self.fwd_iat_stats.min.min(self.bwd_iat_stats.min),
            fwd_pkt_len_max: self.fwd_len_stats.max,
            fwd_pkt_len_min: self.fwd_len_stats.min,
            fwd_pkt_len_mean: self.fwd_len_stats.mean,
            fwd_pkt_len_std: self.fwd_len_stats.std(),
            bwd_pkt_len_max: self.bwd_len_stats.max,
            bwd_pkt_len_min: self.bwd_len_stats.min,
            bwd_pkt_len_mean: self.bwd_len_stats.mean,
            bwd_pkt_len_std: self.bwd_len_stats.std(),
            avg_fwd_seg_size: fwd_avg_packet_size,
            avg_bwd_seg_size: bwd_avg_packet_size,
            fwd_avg_bytes_per_bulk,
            fwd_avg_pkts_per_bulk,
            fwd_avg_bulk_rate,
            bwd_avg_bytes_per_bulk,
            bwd_avg_pkts_per_bulk,
            bwd_avg_bulk_rate,
            subflow_fwd_pkts: self.subflow_fwd_packets,
            subflow_fwd_bytes: self.subflow_fwd_bytes,
            subflow_bwd_pkts: self.subflow_bwd_packets,
            subflow_bwd_bytes: self.subflow_bwd_bytes,
            init_win_bytes_fwd: self.init_win_bytes_fwd,
            init_win_bytes_bwd: self.init_win_bytes_bwd,
            act_data_pkt_fwd: self.total_fwd_packets,
            min_seg_size_fwd,
            active_mean,
            active_std,
            active_max,
            active_min,
            idle_mean,
            idle_std,
            idle_max,
            idle_min,
            label: classify_flow(&self.key),
        }
    }
    
    fn compute_period_stats(&self, periods: &[f64]) -> (f64, f64, f64, f64) {
        if periods.is_empty() {
            return (0.0, 0.0, 0.0, 0.0);
        }
        
        let mean = periods.iter().sum::<f64>() / periods.len() as f64;
        let variance = periods.iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f64>() / periods.len() as f64;
        let std = variance.sqrt();
        let max = periods.iter().fold(0.0_f64, |a, &b| a.max(b));
        let min = periods.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        
        (mean, std, max, min)
    }
}

// Flow classification based on protocol and ports
fn classify_flow(key: &FlowKey) -> String {
    match key.proto {
        6 => { // TCP
            match key.dst_port {
                80 | 8080 => "HTTP".to_string(),
                443 | 8443 => "HTTPS".to_string(),
                21 => "FTP".to_string(),
                22 => "SSH".to_string(),
                25 => "SMTP".to_string(),
                53 => "DNS".to_string(),
                23 => "Telnet".to_string(),
                110 => "POP3".to_string(),
                143 => "IMAP".to_string(),
                993 => "IMAPS".to_string(),
                995 => "POP3S".to_string(),
                _ => "Normal".to_string(),
            }
        },
        17 => { // UDP
            match key.dst_port {
                53 => "DNS".to_string(),
                67 | 68 => "DHCP".to_string(),
                123 => "NTP".to_string(),
                161 => "SNMP".to_string(),
                162 => "SNMP-Trap".to_string(),
                _ => "Normal".to_string(),
            }
        },
        1 => "ICMP".to_string(),
        _ => "Unknown".to_string(),
    }
}

// Global state for packet capture
static mut IS_CAPTURING: bool = false;
static mut SHOULD_STOP: bool = false;
static mut APP_HANDLE: Option<AppHandle> = None;
static mut FLOWS: Option<Arc<Mutex<HashMap<String, Flow>>>> = None;
static mut CAPTURE_THREAD: Option<thread::JoinHandle<()>> = None;
static mut GLOBAL_STATS: Option<Arc<Mutex<NetworkStats>>> = None;

// Network statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub flows_per_second: f64,
    pub packets_per_second: f64,
    pub bytes_per_second: f64,
    pub total_flows: usize,
    pub total_packets: usize,
    pub total_bytes: usize,
    pub active_connections: usize,
}

fn ensure_admin_privileges() -> Result<(), String> {
    if !is_elevated::is_elevated() {
        return Err("Administrator privileges required for packet capture. Please run the application as administrator.".to_string());
    }
    Ok(())
}

pub async fn start_capture(interface: Option<String>) -> Result<(), String> {
    // Check for admin privileges first
    ensure_admin_privileges()?;

    unsafe {
        if IS_CAPTURING {
            return Err("Capture is already running".to_string());
        }
        SHOULD_STOP = false; // Reset stop flag
    }

    // Initialize flow tracker and global stats
    init_flow_tracker();
    init_global_stats();

    // Start packet capture in a separate thread
    let flows_clone = unsafe { FLOWS.as_ref().unwrap().clone() };
    let stats_clone = unsafe { GLOBAL_STATS.as_ref().unwrap().clone() };
    let app_handle_clone = unsafe { APP_HANDLE.as_ref().unwrap().clone() };
    
    let capture_thread = thread::spawn(move || {
        if let Err(e) = run_capture(flows_clone, stats_clone, app_handle_clone, interface) {
            eprintln!("Packet capture error: {}", e);
        }
    });

    unsafe {
        IS_CAPTURING = true;
        CAPTURE_THREAD = Some(capture_thread);
    }

    Ok(())
}

fn run_capture(
    flows: Arc<Mutex<HashMap<String, Flow>>>,
    global_stats: Arc<Mutex<NetworkStats>>,
    app_handle: AppHandle,
    interface: Option<String>,
) -> Result<()> {
    // Choose device
    let device = if let Some(iface_name) = interface {
        Device::list()?
            .into_iter()
            .find(|d| d.name == iface_name)
            .ok_or_else(|| anyhow::anyhow!("Interface {} not found", iface_name))?
    } else {
        // List all available devices for debugging
        let devices = Device::list()?;
        println!("Available network interfaces:");
        for (i, dev) in devices.iter().enumerate() {
            println!("  {}: {} - {:?}", i, dev.name, dev.desc);
        }
        
        // Try to find an active interface (prefer real network adapters over virtual ones)
        let active_device = devices.into_iter()
            .find(|d| {
                let name = d.name.to_lowercase();
                let desc = d.desc.as_ref().map(|s| s.to_lowercase()).unwrap_or_default();
                
                // Skip loopback and virtual adapters
                !name.contains("loopback") && 
                !name.contains("lo") &&
                !desc.contains("wan miniport") &&
                !desc.contains("virtual") &&
                !desc.contains("bluetooth") &&
                !desc.contains("microsoft wi-fi direct")
            })
            .ok_or_else(|| anyhow::anyhow!("No active network interface found"))?;
        
        println!("Selected device: {} - {:?}", active_device.name, active_device.desc);
        active_device
    };

    println!("Using device: {:?}", device.name);
    println!("Device description: {:?}", device.desc);
    println!("Starting packet capture...");

    // Open capture with promiscuous mode and immediate mode
    let mut cap = Capture::from_device(device)?
        .promisc(true)
        .immediate_mode(true)
        .timeout(100) // 100ms timeout
        .open()?;

    // Try to set BPF filter, but continue without it if it fails
    match cap.filter("tcp or udp or icmp", true) {
        Ok(_) => println!("BPF filter set successfully"),
        Err(e) => {
            println!("Warning: Failed to set BPF filter: {}", e);
            println!("Continuing without filter to capture all packets...");
        }
    }

    // Start flow cleanup thread
    let flows_cleanup = flows.clone();
    let app_handle_cleanup = app_handle.clone();
    thread::spawn(move || {
        cleanup_expired_flows(flows_cleanup, app_handle_cleanup);
    });

    // Main packet processing loop
    println!("Starting main packet processing loop...");
    let start_time = std::time::Instant::now();
    let mut packet_count = 0u64;
    let mut byte_count = 0u64;
    let mut timeout_count = 0u64;
    
    loop {
        // Check if we should stop
        unsafe {
            if SHOULD_STOP {
                println!("Stop signal received, exiting capture loop");
                return Ok(());
            }
        }
        
        match cap.next_packet() {
            Ok(packet) => {
                packet_count += 1;
                byte_count += packet.data.len() as u64;
                
                // Debug: Show first few packets
                if packet_count <= 5 {
                    println!("Packet #{}: {} bytes, timestamp: {:.6}", 
                             packet_count, packet.data.len(), 
                             packet.header.ts.tv_sec as f64 + (packet.header.ts.tv_usec as f64 / 1_000_000.0));
                }
                
                // Show every 50th packet to confirm we're receiving packets
                if packet_count % 50 == 0 {
                    println!("Received {} packets so far...", packet_count);
                }
                
                let ts = packet.header.ts.tv_sec as f64 + (packet.header.ts.tv_usec as f64 / 1_000_000.0);
                
                // Emit real-time packet info to frontend (every packet for true real-time)
                let packet_info = serde_json::json!({
                    "timestamp": ts,
                    "packet_count": packet_count,
                    "length": packet.data.len(),
                    "total_bytes": byte_count
                });
                let _ = app_handle.emit("packet_received", &packet_info);
        
                // Update global stats on every packet for real-time updates
                let elapsed = start_time.elapsed().as_secs_f64();
                let mut stats = global_stats.lock().unwrap();
                stats.total_packets = packet_count as usize;
                stats.total_bytes = byte_count as usize;
                stats.packets_per_second = packet_count as f64 / elapsed.max(0.001);
                stats.bytes_per_second = byte_count as f64 / elapsed.max(0.001);
                
                // Update flow stats
                let flows_guard = flows.lock().unwrap();
                stats.total_flows = flows_guard.len();
                stats.active_connections = flows_guard.len();
                stats.flows_per_second = flows_guard.len() as f64 / elapsed.max(0.001);
                drop(flows_guard);
                drop(stats);
                
                // Debug print every 10 packets and emit stats to frontend
                if packet_count % 10 == 0 {
                    let current_stats = global_stats.lock().unwrap().clone();
                    println!("Processed {} packets, {} bytes, {} flows, {:.2} pps, {:.2} bps", 
                             packet_count, byte_count, current_stats.total_flows, 
                             current_stats.packets_per_second, current_stats.bytes_per_second);
                    
                    // Emit real-time stats to frontend
                    let _ = app_handle.emit("stats_update", &current_stats);
                }
                
                if let Ok(headers) = PacketHeaders::from_ethernet_slice(&packet.data) {
                    if let Some(net) = headers.net {
                        // Debug: Show packet parsing
                        if packet_count <= 10 {
                            println!("Parsing packet #{}: IP layer found", packet_count);
                        }
                        let (src_ip, dst_ip) = match net {
                            etherparse::NetHeaders::Ipv4(hdr, _) => {
                                (IpAddr::V4(hdr.source.into()).to_string(), IpAddr::V4(hdr.destination.into()).to_string())
                            },
                            etherparse::NetHeaders::Ipv6(hdr, _) => {
                                (IpAddr::V6(hdr.source.into()).to_string(), IpAddr::V6(hdr.destination.into()).to_string())
                            },
                        };

                        let proto = headers.transport.clone().map(|t| match t {
                            TransportHeader::Tcp(_) => 6u8,
                            TransportHeader::Udp(_) => 17u8,
                            _ => 0u8
                        }).unwrap_or(0u8);

                        let (src_port, dst_port, tcp_flags) = match headers.transport {
                            Some(TransportHeader::Tcp(tcp)) => {
                                if packet_count <= 10 {
                                    println!("TCP packet #{}: {}:{} -> {}:{}", packet_count, src_ip, tcp.source_port, dst_ip, tcp.destination_port);
                                }
                                (tcp.source_port, tcp.destination_port, None) // TODO: Extract TCP flags properly
                            },
                            Some(TransportHeader::Udp(udp)) => {
                                if packet_count <= 10 {
                                    println!("UDP packet #{}: {}:{} -> {}:{}", packet_count, src_ip, udp.source_port, dst_ip, udp.destination_port);
                                }
                                (udp.source_port, udp.destination_port, None)
                            },
                            _ => {
                                if packet_count <= 10 {
                                    println!("Other protocol packet #{}: {} -> {}", packet_count, src_ip, dst_ip);
                                }
                                (0u16, 0u16, None)
                            },
                        };

                        // Create flow keys
                        let key_forward = format!("{}:{}-{}:{}-{}", src_ip, src_port, dst_ip, dst_port, proto);
                        let key_backward = format!("{}:{}-{}:{}-{}", dst_ip, dst_port, src_ip, src_port, proto);
                        
                        let mut table = flows.lock().unwrap();
                        let packet_len = packet.header.len as usize;

                        // Determine which key to use (prefer existing flow)
                        let chosen_key = if table.contains_key(&key_forward) {
                            key_forward.clone()
                        } else if table.contains_key(&key_backward) {
                            key_backward.clone()
                        } else {
                            // New flow: use forward direction
                            key_forward.clone()
                        };

                        // Create new flow if it doesn't exist
                        if !table.contains_key(&chosen_key) {
                            let key_struct = FlowKey {
                                src: src_ip.clone(),
                                dst: dst_ip.clone(),
                                src_port,
                                dst_port,
                                proto,
                            };
                            let flow = Flow::new(key_struct, ts, src_ip.clone());
                            table.insert(chosen_key.clone(), flow);
                            println!("Created new flow: {}:{} -> {}:{} (proto: {})", 
                                     src_ip, src_port, dst_ip, dst_port, proto);
                        }

                        // Add packet to flow
                        if let Some(flow) = table.get_mut(&chosen_key) {
                            flow.add_packet(ts, &src_ip, packet_len, tcp_flags);
                            
                            // Emit real-time flow update to frontend
                            let flow_record = flow.to_record();
                            let _ = app_handle.emit("flow_update", &flow_record);
                        }
                    }
                } else {
                    // Debug: Show when packet parsing fails
                    if packet_count <= 10 {
                        println!("Failed to parse packet #{}: {} bytes", packet_count, packet.data.len());
                    }
                }
            },
            Err(_e) => {
                timeout_count += 1;
                if timeout_count == 1 {
                    println!("First timeout - no packets received yet");
                } else if timeout_count % 100 == 0 {
                    println!("Timeout #{} - no packets received", timeout_count);
                }
                // Continue the loop on timeout
                continue;
            }
        }
    }
}

fn cleanup_expired_flows(flows: Arc<Mutex<HashMap<String, Flow>>>, app_handle: AppHandle) {
    loop {
        std::thread::sleep(Duration::from_secs(FLOW_CLEANUP_INTERVAL));
        
        let mut to_emit = vec![];
        {
            let mut table = flows.lock().unwrap();
            let now = now_ts_secs(SystemTime::now());
            let keys: Vec<String> = table.keys().cloned().collect();
            
            for k in keys {
                if let Some(flow) = table.get(&k) {
                    let idle = now - flow.last_ts;
                    if idle > FLOW_TIMEOUT_SECONDS {
                        to_emit.push(k.clone());
                    }
                }
            }
            
            for k in &to_emit {
                if let Some(flow) = table.remove(k) {
                    let rec = flow.to_record();
                    // Emit flow to frontend
                    let _ = app_handle.emit("flow_completed", &rec);
                    println!("Emitted expired flow: {}:{} -> {}:{} Duration: {:.2}s, Packets: {}, Bytes: {}", 
                             rec.key.src, rec.key.src_port, rec.key.dst, rec.key.dst_port,
                             rec.duration, rec.total_packets, rec.total_bytes);
                }
            }
        }
    }
}

pub async fn stop_capture() -> Result<(), String> {
    unsafe {
        if !IS_CAPTURING {
            return Err("No capture is running".to_string());
        }
        
        println!("Stopping packet capture...");
        SHOULD_STOP = true; // Signal the capture loop to stop
        IS_CAPTURING = false;
        
        // Wait for capture thread to finish
        if let Some(handle) = CAPTURE_THREAD.take() {
            let _ = handle.join();
        }
    }

    println!("Packet capture stopped successfully");
    Ok(())
}

pub fn reset_capture_state() {
    unsafe {
        SHOULD_STOP = true; // Signal to stop if running
        IS_CAPTURING = false;
        if let Some(handle) = CAPTURE_THREAD.take() {
            let _ = handle.join();
        }
    }
}

pub fn set_app_handle(handle: AppHandle) {
    unsafe {
        APP_HANDLE = Some(handle);
    }
}

pub fn is_capturing() -> bool {
    unsafe { IS_CAPTURING }
}

pub fn get_stats() -> NetworkStats {
    unsafe {
        if let Some(global_stats) = &GLOBAL_STATS {
            global_stats.lock().unwrap().clone()
        } else {
            NetworkStats {
                flows_per_second: 0.0,
                packets_per_second: 0.0,
                bytes_per_second: 0.0,
                total_flows: 0,
                total_packets: 0,
                total_bytes: 0,
                active_connections: 0,
            }
        }
    }
}

fn init_flow_tracker() {
    unsafe {
        FLOWS = Some(Arc::new(Mutex::new(HashMap::new())));
    }
}

fn init_global_stats() {
    unsafe {
        GLOBAL_STATS = Some(Arc::new(Mutex::new(NetworkStats {
            flows_per_second: 0.0,
            packets_per_second: 0.0,
            bytes_per_second: 0.0,
            total_flows: 0,
            total_packets: 0,
            total_bytes: 0,
            active_connections: 0,
        })));
    }
}

// Tauri commands
#[tauri::command]
pub async fn start_packet_capture(interface: Option<String>) -> Result<String, String> {
    match start_capture(interface).await {
        Ok(_) => Ok("Packet capture started successfully".to_string()),
        Err(e) => {
            reset_capture_state();
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn stop_packet_capture() -> Result<String, String> {
    match stop_capture().await {
        Ok(_) => Ok("Packet capture stopped successfully".to_string()),
        Err(e) => {
            reset_capture_state();
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn is_capture_active() -> Result<bool, String> {
    Ok(is_capturing())
}

#[tauri::command]
pub async fn get_network_stats() -> Result<NetworkStats, String> {
    Ok(get_stats())
}

#[tauri::command]
pub async fn reset_packet_capture() -> Result<String, String> {
    reset_capture_state();
    Ok("Packet capture state reset successfully".to_string())
}

#[tauri::command]
pub async fn check_admin_privileges() -> Result<bool, String> {
    Ok(is_elevated::is_elevated())
}

// Export flows to CSV format
#[tauri::command]
pub async fn export_cic_csv(filename: String) -> Result<String, String> {
    unsafe {
        if let Some(flows) = &FLOWS {
            let flows_guard = flows.lock().unwrap();
            let mut flows_to_export = Vec::new();
            
            for (_, flow) in flows_guard.iter() {
                flows_to_export.push(flow.to_record());
            }
            
            if flows_to_export.is_empty() {
                return Ok("No flows to export".to_string());
            }
            
            // Get Downloads folder path
            let downloads_path = std::env::var("USERPROFILE")
                .map_err(|e| format!("Failed to get user profile: {}", e))?
                + "\\Downloads\\";
            
            let full_path = downloads_path + &filename;
            
            // Create CSV file
            let mut wtr = csv::Writer::from_path(&full_path)
                .map_err(|e| format!("Failed to create CSV file: {}", e))?;
            
            // Write comprehensive headers
            wtr.write_record(&[
                "Flow ID", "Src IP", "Src Port", "Dst IP", "Dst Port", "Protocol",
                "Start Time", "End Time", "Duration", "Fwd Packets", "Bwd Packets",
                "Fwd Bytes", "Bwd Bytes", "Total Packets", "Total Bytes",
                "Avg Packet Size", "Bytes Per Sec", "Packets Per Sec", "Fwd Pkts Per Sec", "Bwd Pkts Per Sec",
                "Fwd Pkt Len Max", "Fwd Pkt Len Min", "Fwd Pkt Len Mean", "Fwd Pkt Len Std",
                "Bwd Pkt Len Max", "Bwd Pkt Len Min", "Bwd Pkt Len Mean", "Bwd Pkt Len Std",
                "Fwd IAT Mean", "Fwd IAT Std", "Fwd IAT Max", "Fwd IAT Min",
                "Bwd IAT Mean", "Bwd IAT Std", "Bwd IAT Max", "Bwd IAT Min",
                "Flow IAT Mean", "Flow IAT Std", "Flow IAT Max", "Flow IAT Min",
                "Fwd PSH Flags", "Bwd PSH Flags", "Fwd URG Flags", "Bwd URG Flags",
                "FIN Count", "SYN Count", "RST Count", "PSH Count", "ACK Count", "URG Count",
                "Down Up Ratio", "Avg Fwd Seg Size", "Avg Bwd Seg Size",
                "Fwd Avg Bytes Per Bulk", "Fwd Avg Pkts Per Bulk", "Fwd Avg Bulk Rate",
                "Bwd Avg Bytes Per Bulk", "Bwd Avg Pkts Per Bulk", "Bwd Avg Bulk Rate",
                "Subflow Fwd Pkts", "Subflow Fwd Bytes", "Subflow Bwd Pkts", "Subflow Bwd Bytes",
                "Init Win Bytes Fwd", "Init Win Bytes Bwd", "Act Data Pkt Fwd", "Min Seg Size Fwd",
                "Active Mean", "Active Std", "Active Max", "Active Min",
                "Idle Mean", "Idle Std", "Idle Max", "Idle Min",
                "Label"
            ]).map_err(|e| format!("Failed to write CSV headers: {}", e))?;
            
            // Write comprehensive flow data
            for (i, flow) in flows_to_export.iter().enumerate() {
                wtr.write_record(&[
                    &format!("flow_{}", i),
                    &flow.key.src,
                    &flow.key.src_port.to_string(),
                    &flow.key.dst,
                    &flow.key.dst_port.to_string(),
                    &flow.key.proto.to_string(),
                    &flow.start_ts.to_string(),
                    &flow.end_ts.to_string(),
                    &flow.duration.to_string(),
                    &flow.total_fwd_packets.to_string(),
                    &flow.total_bwd_packets.to_string(),
                    &flow.total_len_fwd.to_string(),
                    &flow.total_len_bwd.to_string(),
                    &flow.total_packets.to_string(),
                    &flow.total_bytes.to_string(),
                    &flow.avg_packet_size.to_string(),
                    &flow.bytes_per_sec.to_string(),
                    &flow.pkts_per_sec.to_string(),
                    &flow.fwd_pkts_per_sec.to_string(),
                    &flow.bwd_pkts_per_sec.to_string(),
                    &flow.fwd_pkt_len_max.to_string(),
                    &flow.fwd_pkt_len_min.to_string(),
                    &flow.fwd_pkt_len_mean.to_string(),
                    &flow.fwd_pkt_len_std.to_string(),
                    &flow.bwd_pkt_len_max.to_string(),
                    &flow.bwd_pkt_len_min.to_string(),
                    &flow.bwd_pkt_len_mean.to_string(),
                    &flow.bwd_pkt_len_std.to_string(),
                    &flow.fwd_iat_mean.to_string(),
                    &flow.fwd_iat_std.to_string(),
                    &flow.fwd_iat_max.to_string(),
                    &flow.fwd_iat_min.to_string(),
                    &flow.bwd_iat_mean.to_string(),
                    &flow.bwd_iat_std.to_string(),
                    &flow.bwd_iat_max.to_string(),
                    &flow.bwd_iat_min.to_string(),
                    &flow.flow_iat_mean.to_string(),
                    &flow.flow_iat_std.to_string(),
                    &flow.flow_iat_max.to_string(),
                    &flow.flow_iat_min.to_string(),
                    &flow.fwd_psh_flags.to_string(),
                    &flow.bwd_psh_flags.to_string(),
                    &flow.fwd_urg_flags.to_string(),
                    &flow.bwd_urg_flags.to_string(),
                    &flow.fin_count.to_string(),
                    &flow.syn_count.to_string(),
                    &flow.rst_count.to_string(),
                    &flow.psh_count.to_string(),
                    &flow.ack_count.to_string(),
                    &flow.urg_count.to_string(),
                    &flow.down_up_ratio.to_string(),
                    &flow.avg_fwd_seg_size.to_string(),
                    &flow.avg_bwd_seg_size.to_string(),
                    &flow.fwd_avg_bytes_per_bulk.to_string(),
                    &flow.fwd_avg_pkts_per_bulk.to_string(),
                    &flow.fwd_avg_bulk_rate.to_string(),
                    &flow.bwd_avg_bytes_per_bulk.to_string(),
                    &flow.bwd_avg_pkts_per_bulk.to_string(),
                    &flow.bwd_avg_bulk_rate.to_string(),
                    &flow.subflow_fwd_pkts.to_string(),
                    &flow.subflow_fwd_bytes.to_string(),
                    &flow.subflow_bwd_pkts.to_string(),
                    &flow.subflow_bwd_bytes.to_string(),
                    &flow.init_win_bytes_fwd.to_string(),
                    &flow.init_win_bytes_bwd.to_string(),
                    &flow.act_data_pkt_fwd.to_string(),
                    &flow.min_seg_size_fwd.to_string(),
                    &flow.active_mean.to_string(),
                    &flow.active_std.to_string(),
                    &flow.active_max.to_string(),
                    &flow.active_min.to_string(),
                    &flow.idle_mean.to_string(),
                    &flow.idle_std.to_string(),
                    &flow.idle_max.to_string(),
                    &flow.idle_min.to_string(),
                    &flow.label,
                ]).map_err(|e| format!("Failed to write flow data: {}", e))?;
            }
            
            wtr.flush().map_err(|e| format!("Failed to flush CSV: {}", e))?;
            
            Ok(format!("Exported {} flows to {}", flows_to_export.len(), full_path))
        } else {
            Err("Flow tracker not initialized".to_string())
        }
    }
}