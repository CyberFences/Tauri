import { invoke } from "@tauri-apps/api/core";

export interface WalletData {
  mnemonic: string;
  private_key: string;
  public_key: string;
  address: string;
  machine_id: string;
  _isValidating?: boolean; // Optional field for UI state
}

export interface AlertPayload {
  model_version: string;
  score: number;
  label: string;
  timestamp: number;
  packet_count?: number;
  source_ip?: string;
  destination_ip?: string;
}

export class WalletService {
  /**
   * Generate a new wallet with mnemonic
   */
  static async generateWallet(): Promise<WalletData> {
    return await invoke("generate_wallet");
  }

  /**
   * Restore wallet from mnemonic phrase
   */
  static async restoreWallet(mnemonic: string): Promise<WalletData> {
    return await invoke("restore_wallet", { mnemonicPhrase: mnemonic });
  }

  /**
   * Sign a payload with the private key
   */
  static async signPayload(privateKeyHex: string, message: string): Promise<string> {
    return await invoke("sign_payload", { 
      privateKeyHex, 
      message 
    });
  }

  /**
   * Encrypt data using ECIES
   */
  static async encryptData(pubkeyHex: string, data: string): Promise<string> {
    return await invoke("encrypt_data", { 
      pubkeyHex, 
      data 
    });
  }

  /**
   * Decrypt data using ECIES
   */
  static async decryptData(privkeyHex: string, ciphertextHex: string): Promise<string> {
    return await invoke("decrypt_data", { 
      privkeyHex, 
      ciphertextHex 
    });
  }

  /**
   * Sign and send an alert automatically
   */
  static async signAndSendAlert(
    privateKeyHex: string, 
    alert: AlertPayload, 
    backendUrl: string = "http://localhost:8000/api/alerts"
  ): Promise<boolean> {
    try {
      const payload = JSON.stringify(alert);
      const signature = await this.signPayload(privateKeyHex, payload);
      
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload,
          signature,
          timestamp: Date.now(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to sign and send alert:", error);
      return false;
    }
  }

  /**
   * Sign and send encrypted alert
   */
  static async signAndSendEncryptedAlert(
    privateKeyHex: string,
    backendPubKey: string,
    alert: AlertPayload,
    backendUrl: string = "http://localhost:8000/api/alerts/encrypted"
  ): Promise<boolean> {
    try {
      const payload = JSON.stringify(alert);
      const signature = await this.signPayload(privateKeyHex, payload);
      const ciphertext = await this.encryptData(backendPubKey, payload);
      
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ciphertext,
          signature,
          timestamp: Date.now(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to sign and send encrypted alert:", error);
      return false;
    }
  }
}
