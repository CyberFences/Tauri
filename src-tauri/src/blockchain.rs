use ethers::{
    types::{Address, U256},
    contract::Contract,
    providers::{Provider, Http},
    signers::{LocalWallet, Signer},
    middleware::SignerMiddleware,
};
use std::str::FromStr;
use std::sync::Arc;
use anyhow::Result;

// Contract ABI for MachineRegistration
const MACHINE_REGISTRATION_ABI: &str = include_str!("../../src/lib/abi/MachineRegistration_ABI.json");

// Note: Configuration is handled in the frontend config file

/// Register a machine on the blockchain (gasless via backend)
#[tauri::command]
pub async fn register_machine_on_blockchain(
    contract_address: String,
    rpc_url: String,
    _chain_id: u64,
    machine_id: String,
    public_key: String,
    private_key: String,
    wallet_address: String,
) -> Result<String, String> {
    // Create provider
    let provider = Provider::<Http>::try_from(rpc_url)
        .map_err(|e| format!("Failed to create provider: {}", e))?;

    // Parse wallet address (validation only)
    let _address = Address::from_str(&wallet_address)
        .map_err(|e| format!("Invalid wallet address: {}", e))?;

    // Parse private key
    let wallet = private_key
        .strip_prefix("0x")
        .unwrap_or(&private_key)
        .parse::<LocalWallet>()
        .map_err(|e| format!("Invalid private key: {}", e))?;

    // Set chain ID on wallet
    let wallet = wallet.with_chain_id(_chain_id);

    // Create client with wallet
    let client = Arc::new(SignerMiddleware::new(provider, wallet));

    // Parse contract address
    let contract_addr = Address::from_str(&contract_address)
        .map_err(|e| format!("Invalid contract address: {}", e))?;

    // Create contract instance
    let abi: ethers::abi::Abi = serde_json::from_str(MACHINE_REGISTRATION_ABI)
        .map_err(|e| format!("Failed to parse ABI: {}", e))?;
    
    let contract = Contract::new(contract_addr, abi, client);

    // First check if already registered
    let is_registered: bool = contract
        .method("isPublicKeyExists", public_key.clone())
        .map_err(|e| format!("Failed to create method call: {}", e))?
        .call()
        .await
        .map_err(|e| format!("Failed to call contract: {}", e))?;

    if is_registered {
        return Ok("already_registered".to_string());
    }

    // Register the machine with generous gas limit
    let tx = contract
        .method::<_, ()>("registerMachine", (machine_id, public_key))
        .map_err(|e| format!("Failed to create register method: {}", e))?
        .gas(800000u64) // Generous gas limit for contract execution
        .gas_price(3000000000u64); // 3 Gwei gas price

    // Send transaction
    let pending_tx = tx
        .send()
        .await
        .map_err(|e| {
            let error_msg = format!("{}", e);
            if error_msg.contains("insufficient funds") {
                "Insufficient ETH for gas fees. Please add Sepolia ETH to your wallet address.".to_string()
            } else if error_msg.contains("out of gas") {
                "Transaction failed due to insufficient gas. Please try again with higher gas limit.".to_string()
            } else {
                format!("Failed to send transaction: {}", e)
            }
        })?;

    // Wait for transaction receipt
    let receipt = pending_tx
        .await
        .map_err(|e| format!("Failed to get transaction receipt: {}", e))?
        .ok_or("Transaction was dropped")?;

    Ok(format!("0x{:x}", receipt.transaction_hash))
}

/// Check if a machine is already registered
#[tauri::command]
pub async fn check_machine_registration(
    contract_address: String,
    rpc_url: String,
    public_key: String,
) -> Result<bool, String> {
    // Create provider
    let provider = Provider::<Http>::try_from(rpc_url)
        .map_err(|e| format!("Failed to create provider: {}", e))?;

    // Parse contract address
    let contract_addr = Address::from_str(&contract_address)
        .map_err(|e| format!("Invalid contract address: {}", e))?;

    // Create contract instance
    let abi: ethers::abi::Abi = serde_json::from_str(MACHINE_REGISTRATION_ABI)
        .map_err(|e| format!("Failed to parse ABI: {}", e))?;
    
    let contract = Contract::new(contract_addr, abi, Arc::new(provider));

    // Check if public key exists
    let is_registered: bool = contract
        .method("isPublicKeyExists", public_key)
        .map_err(|e| format!("Failed to create method call: {}", e))?
        .call()
        .await
        .map_err(|e| format!("Failed to call contract: {}", e))?;

    Ok(is_registered)
}

/// Get machine ID by public key
#[tauri::command]
pub async fn get_machine_id_by_public_key(
    contract_address: String,
    rpc_url: String,
    public_key: String,
) -> Result<String, String> {
    // Create provider
    let provider = Provider::<Http>::try_from(rpc_url)
        .map_err(|e| format!("Failed to create provider: {}", e))?;

    // Parse contract address
    let contract_addr = Address::from_str(&contract_address)
        .map_err(|e| format!("Invalid contract address: {}", e))?;

    // Create contract instance
    let abi: ethers::abi::Abi = serde_json::from_str(MACHINE_REGISTRATION_ABI)
        .map_err(|e| format!("Failed to parse ABI: {}", e))?;
    
    let contract = Contract::new(contract_addr, abi, Arc::new(provider));

    // First check if public key exists
    let exists: bool = contract
        .method("isPublicKeyExists", public_key.clone())
        .map_err(|e| format!("Failed to create method call: {}", e))?
        .call()
        .await
        .map_err(|e| format!("Failed to call contract: {}", e))?;

    if !exists {
        return Ok(String::new()); // Return empty string if not registered
    }

    // Get machine ID by public key
    let machine_id: String = contract
        .method("getMachineIdByPublicKey", public_key)
        .map_err(|e| format!("Failed to create method call: {}", e))?
        .call()
        .await
        .map_err(|e| format!("Failed to call contract: {}", e))?;

    Ok(machine_id)
}

/// Get total registered machines count
#[tauri::command]
pub async fn get_total_registered_machines(
    contract_address: String,
    rpc_url: String,
) -> Result<u64, String> {
    // Create provider
    let provider = Provider::<Http>::try_from(rpc_url)
        .map_err(|e| format!("Failed to create provider: {}", e))?;

    // Parse contract address
    let contract_addr = Address::from_str(&contract_address)
        .map_err(|e| format!("Invalid contract address: {}", e))?;

    // Create contract instance
    let abi: ethers::abi::Abi = serde_json::from_str(MACHINE_REGISTRATION_ABI)
        .map_err(|e| format!("Failed to parse ABI: {}", e))?;
    
    let contract = Contract::new(contract_addr, abi, Arc::new(provider));

    // Get total registered machines
    let total: U256 = contract
        .method("getTotalRegisteredMachines", ())
        .map_err(|e| format!("Failed to create method call: {}", e))?
        .call()
        .await
        .map_err(|e| format!("Failed to call contract: {}", e))?;

    Ok(total.as_u64())
}

/// Register a machine using backend gas wallet (gasless for user)
#[tauri::command]
pub async fn register_machine_gasless(
    contract_address: String,
    rpc_url: String,
    chain_id: u64,
    machine_id: String,
    public_key: String,
    _user_wallet_address: String,
    backend_private_key: String, // Backend's gas wallet private key
) -> Result<String, String> {
    // Create provider
    let provider = Provider::<Http>::try_from(rpc_url)
        .map_err(|e| format!("Failed to create provider: {}", e))?;

    // Parse backend private key for gas payments
    let backend_wallet = backend_private_key
        .strip_prefix("0x")
        .unwrap_or(&backend_private_key)
        .parse::<LocalWallet>()
        .map_err(|e| format!("Invalid backend private key: {}", e))?
        .with_chain_id(chain_id);

    // Create client with backend wallet (pays gas)
    let client = Arc::new(SignerMiddleware::new(provider, backend_wallet));

    // Parse contract address
    let contract_addr = Address::from_str(&contract_address)
        .map_err(|e| format!("Invalid contract address: {}", e))?;

    // Create contract instance
    let abi: ethers::abi::Abi = serde_json::from_str(MACHINE_REGISTRATION_ABI)
        .map_err(|e| format!("Failed to parse ABI: {}", e))?;
    
    let contract = Contract::new(contract_addr, abi, client);

    // First check if already registered
    let is_registered: bool = contract
        .method("isPublicKeyExists", public_key.clone())
        .map_err(|e| format!("Failed to create method call: {}", e))?
        .call()
        .await
        .map_err(|e| format!("Failed to call contract: {}", e))?;

    if is_registered {
        return Ok("already_registered".to_string());
    }

    // Register the machine (backend pays gas) with generous gas limit
    let tx = contract
        .method::<_, ()>("registerMachine", (machine_id, public_key))
        .map_err(|e| format!("Failed to create register method: {}", e))?
        .gas(800000u64) // Generous gas limit for contract execution
        .gas_price(3000000000u64); // 3 Gwei gas price

    // Send transaction (backend wallet pays)
    let pending_tx = tx
        .send()
        .await
        .map_err(|e| {
            let error_msg = format!("{}", e);
            if error_msg.contains("insufficient funds") {
                "Backend gas wallet has insufficient funds. Please contact support.".to_string()
            } else if error_msg.contains("out of gas") {
                "Transaction failed due to insufficient gas. Please try again with higher gas limit.".to_string()
            } else {
                format!("Failed to send transaction: {}", e)
            }
        })?;

    // Wait for transaction receipt
    let receipt = pending_tx
        .await
        .map_err(|e| format!("Failed to get transaction receipt: {}", e))?
        .ok_or("Transaction was dropped")?;

    Ok(format!("0x{:x}", receipt.transaction_hash))
}
