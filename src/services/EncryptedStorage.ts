import { invoke } from "@tauri-apps/api/core";
import { WalletData } from "./WalletService";

export class EncryptedStorage {
  private static readonly STORAGE_KEY = 'cyberfence_encrypted_wallet';
  private static readonly TERMS_KEY = 'cyberfence_terms_accepted';

  /**
   * Encrypt and store wallet data
   */
  static async storeWallet(wallet: WalletData): Promise<void> {
    try {
      // Encrypt the wallet data using the backend
      const encryptedData = await invoke('encrypt_wallet_data', { 
        walletData: JSON.stringify(wallet) 
      });
      
      // Store encrypted data in localStorage
      localStorage.setItem(this.STORAGE_KEY, encryptedData as string);
      console.log('Wallet data encrypted and stored successfully');
    } catch (error) {
      console.error('Failed to encrypt and store wallet:', error);
      throw new Error('Failed to store wallet data securely');
    }
  }

  /**
   * Decrypt and retrieve wallet data
   */
  static async getWallet(): Promise<WalletData | null> {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        return null;
      }

      // Decrypt the wallet data using the backend
      const decryptedData = await invoke('decrypt_wallet_data', { 
        encryptedData 
      });
      
      return JSON.parse(decryptedData as string) as WalletData;
    } catch (error) {
      console.error('Failed to decrypt wallet data:', error);
      return null;
    }
  }

  /**
   * Check if wallet exists in encrypted storage
   */
  static hasWallet(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Clear wallet data from storage
   */
  static clearWallet(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TERMS_KEY);
    console.log('Wallet data cleared from storage');
  }

  /**
   * Store terms acceptance status
   */
  static setTermsAccepted(accepted: boolean): void {
    localStorage.setItem(this.TERMS_KEY, accepted.toString());
  }

  /**
   * Check if terms are accepted
   */
  static areTermsAccepted(): boolean {
    return localStorage.getItem(this.TERMS_KEY) === 'true';
  }

  /**
   * Verify wallet integrity
   */
  static async verifyWallet(): Promise<boolean> {
    try {
      const wallet = await this.getWallet();
      if (!wallet) {
        return false;
      }

      // Basic validation
      return !!(
        wallet.address &&
        wallet.public_key &&
        wallet.private_key &&
        wallet.mnemonic &&
        wallet.machine_id
      );
    } catch (error) {
      console.error('Failed to verify wallet:', error);
      return false;
    }
  }
}
