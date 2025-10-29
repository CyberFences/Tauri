use ethers::providers::{Provider, Http};
use ethers::contract::Contract;
use ethers::middleware::SignerMiddleware;
use ethers::signers::{LocalWallet, Signer};
use ethers::types::{Address, U256};
use std::str::FromStr;
use std::sync::Arc;

// Import the ABI from blockchain module
const MACHINE_REGISTRATION_ABI: &str = include_str!("../../src/lib/abi/MachineRegistration_ABI.json");

/// Sign a message with user's private key (for meta-transactions)
#[tauri::command]
pub async fn sign_message(
    private_key: String,
    message: String,
) -> Result<String, String> {
    // Parse private key
    let wallet = private_key
        .strip_prefix("0x")
        .unwrap_or(&private_key)
        .parse::<LocalWallet>()
        .map_err(|e| format!("Invalid private key: {}", e))?;
    
    // Sign the message
    let signature = wallet
        .sign_message(message.as_bytes())
        .await
        .map_err(|e| format!("Failed to sign message: {}", e))?;
    
    Ok(format!("0x{}", hex::encode(signature.to_vec())))
}

/// Get user's nonce from contract (placeholder - returns 0 for now)
#[tauri::command]
pub async fn get_user_nonce(
    _contract_address: String,
    _rpc_url: String,
    _user_address: String,
) -> Result<u64, String> {
    // Since the current contract doesn't have nonces, return 0
    // In a real meta-transaction implementation, you'd get this from the contract
    Ok(0)
}

/// Execute meta-transaction (user signs, relayer pays gas)
#[tauri::command]
pub async fn execute_meta_transaction(
    contract_address: String,
    rpc_url: String,
    chain_id: u64,
    user_address: String,
    machine_id: String,
    public_key: String,
    signature: String,
    _nonce: u64,
) -> Result<String, String> {
    // Create provider
    let provider = Provider::<Http>::try_from(rpc_url)
        .map_err(|e| format!("Failed to create provider: {}", e))?;

    // Parse relayer private key (backend wallet that pays gas)
    let relayer_private_key = std::env::var("VITE_BACKEND_GAS_WALLET_PRIVATE_KEY")
        .unwrap_or_else(|_| "0x4ba7243ea512d2bcd505ff242c43ee0cc4a70096e44c1c7944b947de00f13bc2".to_string());
    
    let relayer_wallet = relayer_private_key
        .strip_prefix("0x")
        .unwrap_or(&relayer_private_key)
        .parse::<LocalWallet>()
        .map_err(|e| format!("Invalid relayer private key: {}", e))?
        .with_chain_id(chain_id);

    // Create client with relayer wallet (pays gas)
    let client = Arc::new(SignerMiddleware::new(provider, relayer_wallet));

    // Parse contract address
    let contract_addr = Address::from_str(&contract_address)
        .map_err(|e| format!("Invalid contract address: {}", e))?;

    // Create contract instance
    let abi: ethers::abi::Abi = serde_json::from_str(MACHINE_REGISTRATION_ABI)
        .map_err(|e| format!("Failed to parse ABI: {}", e))?;
    
    let contract = Contract::new(contract_addr, abi, client);

    // Parse user address
    let user_addr = Address::from_str(&user_address)
        .map_err(|e| format!("Invalid user address: {}", e))?;

    // Parse signature
    let sig_bytes = hex::decode(signature.strip_prefix("0x").unwrap_or(&signature))
        .map_err(|e| format!("Invalid signature: {}", e))?;

    // For now, let's just call registerMachine directly with the relayer wallet
    // In a real meta-transaction implementation, you'd verify the signature first
    let tx = contract
        .method::<_, ()>("registerMachine", (machine_id, public_key))
        .map_err(|e| format!("Failed to create register method: {}", e))?
        .gas(800000u64)
        .gas_price(3000000000u64);

    // Send transaction (relayer pays gas)
    let pending_tx = tx
        .send()
        .await
        .map_err(|e| format!("Failed to send meta transaction: {}", e))?;

    // Wait for transaction receipt
    let receipt = pending_tx
        .await
        .map_err(|e| format!("Failed to get transaction receipt: {}", e))?
        .ok_or("Transaction was dropped")?;

    Ok(format!("0x{:x}", receipt.transaction_hash))
}
