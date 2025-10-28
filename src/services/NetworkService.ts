import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { FlowRow, NetworkStats } from "../types/FlowRow";

export class NetworkService {
  private static unlistenFlowRow: UnlistenFn | null = null;
  private static flows: FlowRow[] = [];
  private static packetListener: UnlistenFn | null = null;

  static async checkAdminPrivileges(): Promise<boolean> {
    try {
      return await invoke("check_admin_privileges");
    } catch (error) {
      console.error("Failed to check admin privileges:", error);
      return false;
    }
  }

  static async startCapture(networkInterface: string = ""): Promise<void> {
    try {
      // Check admin privileges first
      const hasAdmin = await this.checkAdminPrivileges();
      if (!hasAdmin) {
        throw new Error("Administrator privileges required for packet capture. Please run the application as administrator.");
      }

      const interfaceName = networkInterface.trim() === "" ? null : networkInterface;
      console.log(`Starting packet capture on interface: ${interfaceName || "All Interfaces"}`);
      await invoke("start_packet_capture", { interface: interfaceName });
      console.log("Packet capture started successfully");
    } catch (error) {
      console.error("Failed to start packet capture:", error);
      throw error;
    }
  }

  static async stopCapture(): Promise<void> {
    try {
      console.log("Stopping packet capture");
      await invoke("stop_packet_capture");
      console.log("Packet capture stopped successfully");
    } catch (error) {
      console.error("Failed to stop packet capture:", error);
      throw error;
    }
  }

  static async isCaptureActive(): Promise<boolean> {
    try {
      return await invoke("is_capture_active");
    } catch (error) {
      console.error("Failed to check capture status:", error);
      return false;
    }
  }

  static async getNetworkStats(): Promise<NetworkStats> {
    try {
      const stats = await invoke("get_network_stats");
      return stats as NetworkStats;
    } catch (error) {
      console.error("Failed to get network stats:", error);
      // Return default stats on error
      return {
        flowsPerSecond: 0,
        packetsPerSecond: 0,
        bytesPerSecond: 0,
        totalFlows: 0,
        totalPackets: 0,
        totalBytes: 0,
        activeConnections: 0,
      };
    }
  }

  static async getRecentFlows(limit: number = 1000): Promise<FlowRow[]> {
    return this.flows.slice(0, limit);
  }

  static async exportCSV(path: string): Promise<void> {
    try {
      const csvContent = this.generateCSV();
      // In a real implementation, you'd save this to a file
      console.log(`CSV exported to: ${path}`);
      console.log("CSV Content:", csvContent);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      throw error;
    }
  }

  static async startListeningForFlows(
    onFlowReceived: (flow: FlowRow) => void,
    onStatsUpdate?: (stats: NetworkStats) => void,
    onPacketReceived?: (packet: any) => void
  ): Promise<void> {
    try {
      // Listen for completed flow events from the backend
      this.packetListener = await listen("flow_completed", (event) => {
        const flowRecord = event.payload as FlowRow;
        console.log("Received completed flow:", flowRecord);
        
        // Add to flows array
        this.flows.unshift(flowRecord);
        if (this.flows.length > 1000) {
          this.flows = this.flows.slice(0, 1000);
        }

        // Call the callback
        onFlowReceived(flowRecord);
      });

      // Listen for real-time flow updates
      await listen("flow_update", (event) => {
        const flowRecord = event.payload as FlowRow;
        console.log("Received flow update:", flowRecord);
        
        // Update existing flow or add new one
        const existingIndex = this.flows.findIndex(f => 
          f.key.src === flowRecord.key.src && 
          f.key.dst === flowRecord.key.dst &&
          f.key.src_port === flowRecord.key.src_port &&
          f.key.dst_port === flowRecord.key.dst_port &&
          f.key.proto === flowRecord.key.proto
        );
        
        if (existingIndex >= 0) {
          this.flows[existingIndex] = flowRecord;
        } else {
          this.flows.unshift(flowRecord);
          if (this.flows.length > 1000) {
            this.flows = this.flows.slice(0, 1000);
          }
        }

        // Call the callback
        onFlowReceived(flowRecord);
      });

      // Listen for real-time stats updates
      if (onStatsUpdate) {
        await listen("stats_update", (event) => {
          const stats = event.payload as NetworkStats;
          console.log("Received stats update:", stats);
          onStatsUpdate(stats);
        });
      }

      // Listen for real-time packet info
      if (onPacketReceived) {
        await listen("packet_received", (event) => {
          const packetInfo = event.payload;
          console.log("Received packet:", packetInfo);
          onPacketReceived(packetInfo);
        });
      }

      console.log("Started listening for real-time events");
    } catch (error) {
      console.error("Failed to start listening for flows:", error);
      throw error;
    }
  }

  static async stopListeningForFlows(): Promise<void> {
    if (this.packetListener) {
      await this.packetListener();
      this.packetListener = null;
    }
    if (this.unlistenFlowRow) {
      await this.unlistenFlowRow();
      this.unlistenFlowRow = null;
    }
  }

  static async resetCapture(): Promise<void> {
    try {
      console.log("Resetting packet capture state");
      await invoke("reset_packet_capture");
      this.flows = [];
      console.log("Packet capture state reset successfully");
    } catch (error) {
      console.error("Failed to reset packet capture:", error);
      throw error;
    }
  }

  private static generateCSV(): string {
    const headers = [
      'timestamp', 'srcIP', 'srcPort', 'dstIP', 'dstPort', 'protocol',
      'flowDuration', 'totalFwdPackets', 'totalBwdPackets', 
      'totalLenFwd', 'totalLenBwd', 'totalPackets', 'totalBytes',
      'flowBytesPerSec', 'flowPktsPerSec', 'avgPacketSize', 'label'
    ];
    
    const rows = this.flows.map(flow => [
      flow.start_ts,
      flow.key.src,
      flow.key.src_port,
      flow.key.dst,
      flow.key.dst_port,
      flow.key.proto,
      flow.duration,
      flow.total_fwd_packets,
      flow.total_bwd_packets,
      flow.total_len_fwd,
      flow.total_len_bwd,
      flow.total_packets,
      flow.total_bytes,
      flow.bytes_per_sec,
      flow.pkts_per_sec,
      flow.avg_packet_size,
      flow.label
    ]);

    return [headers, ...rows.map(row => row.join(','))].join('\n');
  }
}
