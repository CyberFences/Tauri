import { invoke } from "@tauri-apps/api/core";
import { WalletData } from "./WalletService";
import { BLOCKCHAIN_CONFIG } from "../config/blockchain";
import { GASLESS_CONFIG } from "../config/gasless";

export interface RegistrationResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class BlockchainService {
  /**
   * Register a machine on the blockchain
   * Tries meta-transaction first, then gasless, then user-paid gas
   */
  static async registerMachine(wallet: WalletData): Promise<RegistrationResult> {
    try {
      console.log('Starting machine registration on blockchain...');
      console.log('Machine ID:', wallet.machine_id);
      console.log('Public Key:', wallet.public_key);
      console.log('Address:', wallet.address);

      // First check if the machine is already registered
      const isAlreadyRegistered = await this.isMachineRegistered(wallet.public_key);
      if (isAlreadyRegistered) {
        console.log('Machine already registered on blockchain');
        return {
          success: true,
          transactionHash: 'already_registered'
        };
      }

      // Try meta-transaction first (user signs, relayer pays)
      try {
        console.log('Attempting meta-transaction registration...');
        const result = await this.registerMachineMetaTransaction(wallet);
        if (result.success) {
          console.log('Meta-transaction registration successful:', result.transactionHash);
          return result;
        }
        console.log('Meta-transaction registration failed, trying gasless:', result.error);
      } catch (error) {
        console.log('Meta-transaction registration error, trying gasless:', error);
      }

      // Try gasless registration as fallback
      console.log('Gasless config check:', {
        ENABLE_GASLESS: GASLESS_CONFIG.ENABLE_GASLESS,
        HAS_PRIVATE_KEY: !!GASLESS_CONFIG.BACKEND_GAS_WALLET_PRIVATE_KEY,
        PRIVATE_KEY_LENGTH: GASLESS_CONFIG.BACKEND_GAS_WALLET_PRIVATE_KEY?.length || 0,
        ADDRESS: GASLESS_CONFIG.BACKEND_GAS_WALLET_ADDRESS
      });

      if (GASLESS_CONFIG.ENABLE_GASLESS && GASLESS_CONFIG.BACKEND_GAS_WALLET_PRIVATE_KEY) {
        try {
          console.log('Attempting gasless registration...');
          const result = await this.registerMachineGasless(wallet);
          if (result.success) {
            console.log('Gasless registration successful:', result.transactionHash);
            return result;
          }
          console.log('Gasless registration failed, falling back to user-paid gas:', result.error);
        } catch (error) {
          console.log('Gasless registration error, falling back to user-paid gas:', error);
        }
      } else {
        console.log('Gasless registration disabled or missing private key');
      }

      // Fallback to user-paid gas registration
      console.log('Using user-paid gas registration...');
      const result = await invoke('register_machine_on_blockchain', {
        contractAddress: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
        rpcUrl: BLOCKCHAIN_CONFIG.RPC_URL,
        chainId: BLOCKCHAIN_CONFIG.CHAIN_ID,
        machineId: wallet.machine_id,
        publicKey: wallet.public_key,
        privateKey: wallet.private_key,
        walletAddress: wallet.address
      });

      console.log('Blockchain registration result:', result);
      
      return {
        success: true,
        transactionHash: result as string
      };

    } catch (error) {
      console.error('Failed to register machine on blockchain:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide helpful error messages for common issues
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient ETH')) {
        return {
          success: false,
          error: 'Insufficient ETH for gas fees. Please add Sepolia testnet ETH to your wallet. You can get free testnet ETH from Sepolia faucets.'
        };
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Register a machine using meta-transactions (user signs, relayer pays gas)
   */
  static async registerMachineMetaTransaction(wallet: WalletData): Promise<RegistrationResult> {
    try {
      // 1. Create a simple message for user to sign
      const message = {
        from: wallet.address,
        to: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
        machineId: wallet.machine_id,
        publicKey: wallet.public_key,
        timestamp: Date.now()
      };

      // 2. User signs the message
      const signature = await this.signMessage(wallet.private_key, JSON.stringify(message));
      console.log('User signature:', signature);

      // 3. Send to relayer for execution
      const result = await invoke('execute_meta_transaction', {
        contractAddress: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
        rpcUrl: BLOCKCHAIN_CONFIG.RPC_URL,
        chainId: BLOCKCHAIN_CONFIG.CHAIN_ID,
        userAddress: wallet.address,
        machineId: wallet.machine_id,
        publicKey: wallet.public_key,
        signature: signature,
        nonce: 0 // Not used in current implementation
      });

      return {
        success: true,
        transactionHash: result as string
      };
    } catch (error) {
      console.error('Meta-transaction registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Meta-transaction registration failed'
      };
    }
  }

  /**
   * Register a machine using gasless transactions (backend pays gas)
   */
  static async registerMachineGasless(wallet: WalletData): Promise<RegistrationResult> {
    try {
      const result = await invoke('register_machine_gasless', {
        contractAddress: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
        rpcUrl: BLOCKCHAIN_CONFIG.RPC_URL,
        chainId: BLOCKCHAIN_CONFIG.CHAIN_ID,
        machineId: wallet.machine_id,
        publicKey: wallet.public_key,
        userWalletAddress: wallet.address,
        backendPrivateKey: GASLESS_CONFIG.BACKEND_GAS_WALLET_PRIVATE_KEY
      });

      return {
        success: true,
        transactionHash: result as string
      };
    } catch (error) {
      console.error('Gasless registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gasless registration failed'
      };
    }
  }

  /**
   * Check if a machine is already registered on the blockchain
   */
  static async isMachineRegistered(publicKey: string): Promise<boolean> {
    try {
      const result = await invoke('check_machine_registration', {
        contractAddress: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
        rpcUrl: BLOCKCHAIN_CONFIG.RPC_URL,
        publicKey: publicKey
      });
      
      return result as boolean;
    } catch (error) {
      console.error('Failed to check machine registration:', error);
      return false;
    }
  }

  /**
   * Get machine ID by public key from blockchain
   */
  static async getMachineIdByPublicKey(publicKey: string): Promise<string | null> {
    try {
      const result = await invoke('get_machine_id_by_public_key', {
        contractAddress: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
        rpcUrl: BLOCKCHAIN_CONFIG.RPC_URL,
        publicKey: publicKey
      });
      
      const machineId = result as string;
      // Return null if empty string (public key not registered)
      return machineId && machineId.length > 0 ? machineId : null;
    } catch (error) {
      console.error('Failed to get machine ID by public key:', error);
      return null;
    }
  }

  /**
   * Verify machine registration status
   */
  static async verifyMachineRegistration(wallet: WalletData): Promise<boolean> {
    try {
      const machineId = await this.getMachineIdByPublicKey(wallet.public_key);
      return machineId === wallet.machine_id;
    } catch (error) {
      console.error('Failed to verify machine registration:', error);
      return false;
    }
  }

  // ---- META-TRANSACTION HELPER METHODS ----

  /**
   * Sign message with user's private key
   */
  static async signMessage(privateKey: string, message: string): Promise<string> {
    try {
      const result = await invoke('sign_message', {
        privateKey: privateKey,
        message: message
      });
      return result as string;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Failed to sign message');
    }
  }
}
