use bip39::Mnemonic;
use sha3::{Digest, Keccak256};
use secp256k1::{Secp256k1, SecretKey, PublicKey, Message};
use aes_gcm::{Aes256Gcm, Key, Nonce, KeyInit};
use aes_gcm::aead::Aead;
use serde::{Deserialize, Serialize};
use hex::{encode, decode};
use rand::Rng;
use rand::distributions::Alphanumeric;

#[derive(Serialize, Deserialize)]
pub struct WalletData {
    pub mnemonic: String,
    pub private_key: String,
    pub public_key: String,
    pub address: String,
    pub machine_id: String,
}

// ---- GENERATE MACHINE ID ----
fn generate_machine_id() -> String {
    let mut rng = rand::thread_rng();
    (0..6)
        .map(|_| rng.sample(Alphanumeric) as char)
        .collect::<String>()
        .to_uppercase()
}

// ---- GENERATE WALLET ----
#[tauri::command]
pub fn generate_wallet() -> WalletData {
    // Generate random entropy for 12-word mnemonic
    let mut entropy = [0u8; 16]; // 128 bits for 12 words
    rand::thread_rng().fill(&mut entropy);
    
    // Create mnemonic from entropy
    let mnemonic = Mnemonic::from_entropy(&entropy).unwrap();
    let phrase = mnemonic.to_string();

    // Derive seed from mnemonic (no passphrase)
    let seed = mnemonic.to_seed("");

    // Use first 32 bytes of seed for secp256k1 key
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&seed[0..32]).unwrap();
    let public_key = PublicKey::from_secret_key(&secp, &secret_key);

    // Ethereum address = keccak256(pubkey[1..])[12..]
    let pub_bytes = public_key.serialize_uncompressed();
    let hash = Keccak256::digest(&pub_bytes[1..]);
    let mut addr_bytes = [0u8; 20];
    addr_bytes.copy_from_slice(&hash[12..]);
    let address = format!("0x{}", encode(addr_bytes));

    WalletData {
        mnemonic: phrase,
        private_key: format!("0x{}", encode(secret_key.secret_bytes())),
        public_key: format!("0x{}", encode(pub_bytes)),
        address,
        machine_id: generate_machine_id(),
    }
}

// ---- RESTORE WALLET FROM MNEMONIC ----
#[tauri::command]
pub fn restore_wallet(mnemonic_phrase: String) -> Result<WalletData, String> {
    let mnemonic = Mnemonic::parse(&mnemonic_phrase)
        .map_err(|e| format!("Invalid mnemonic: {}", e))?;
    
    let seed = mnemonic.to_seed("");
    
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&seed[0..32])
        .map_err(|e| format!("Failed to create secret key: {}", e))?;
    let public_key = PublicKey::from_secret_key(&secp, &secret_key);

    let pub_bytes = public_key.serialize_uncompressed();
    let hash = Keccak256::digest(&pub_bytes[1..]);
    let mut addr_bytes = [0u8; 20];
    addr_bytes.copy_from_slice(&hash[12..]);
    let address = format!("0x{}", encode(addr_bytes));

    Ok(WalletData {
        mnemonic: mnemonic_phrase,
        private_key: format!("0x{}", encode(secret_key.secret_bytes())),
        public_key: format!("0x{}", encode(pub_bytes)),
        address,
        machine_id: generate_machine_id(),
    })
}

// ---- SIGN PAYLOAD ----
#[tauri::command]
pub fn sign_payload(private_key_hex: String, message: String) -> Result<String, String> {
    let pk_bytes = decode(private_key_hex.trim_start_matches("0x"))
        .map_err(|e| format!("Invalid private key hex: {}", e))?;
    
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&pk_bytes)
        .map_err(|e| format!("Failed to create secret key: {}", e))?;
    
    // Hash the message
    let message_hash = Keccak256::digest(message.as_bytes());
    let message = Message::from_digest_slice(&message_hash)
        .map_err(|e| format!("Failed to create message: {}", e))?;
    
    // Sign the message
    let signature = secp.sign_ecdsa(&message, &secret_key);
    let signature_bytes = signature.serialize_der();
    
    Ok(format!("0x{}", encode(signature_bytes)))
}

// ---- AES ENCRYPT ----
#[tauri::command]
pub fn encrypt_data(_pubkey_hex: String, data: String) -> Result<String, String> {
    // For simplicity, we'll use AES-GCM with a random key
    // In production, you'd derive the key from the public key using ECDH
    let mut rng = rand::thread_rng();
    let key_bytes: [u8; 32] = rng.gen();
    let nonce_bytes: [u8; 12] = rng.gen();
    
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(&key);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher.encrypt(nonce, data.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    // Combine nonce + ciphertext
    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&ciphertext);
    
    Ok(encode(result))
}

// ---- AES DECRYPT ----
#[tauri::command]
pub fn decrypt_data(_privkey_hex: String, ciphertext_hex: String) -> Result<String, String> {
    let cipher_bytes = decode(ciphertext_hex)
        .map_err(|e| format!("Invalid ciphertext hex: {}", e))?;
    
    if cipher_bytes.len() < 12 {
        return Err("Invalid ciphertext: too short".to_string());
    }
    
    // Split nonce and ciphertext
    let nonce_bytes = &cipher_bytes[0..12];
    let ciphertext = &cipher_bytes[12..];
    
    // For simplicity, we'll use a dummy key (in production, derive from private key)
    let key_bytes: [u8; 32] = [0u8; 32]; // This should be derived from the private key
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(&key);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let plaintext = cipher.decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))?;
    
    Ok(String::from_utf8(plaintext)
        .map_err(|e| format!("Invalid UTF-8 in decrypted data: {}", e))?)
}

// ---- ENCRYPT WALLET DATA ----
#[tauri::command]
pub fn encrypt_wallet_data(wallet_data: String) -> Result<String, String> {
    // Generate a random key for this session
    let mut rng = rand::thread_rng();
    let key_bytes: [u8; 32] = rng.gen();
    let nonce_bytes: [u8; 12] = rng.gen();
    
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(&key);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher.encrypt(nonce, wallet_data.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    // Combine nonce + key + ciphertext for storage
    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&key_bytes);
    result.extend_from_slice(&ciphertext);
    
    Ok(encode(result))
}

// ---- DECRYPT WALLET DATA ----
#[tauri::command]
pub fn decrypt_wallet_data(encrypted_data: String) -> Result<String, String> {
    let data_bytes = decode(encrypted_data)
        .map_err(|e| format!("Invalid encrypted data hex: {}", e))?;
    
    if data_bytes.len() < 44 { // 12 (nonce) + 32 (key) + at least some ciphertext
        return Err("Invalid encrypted data: too short".to_string());
    }
    
    // Split nonce, key, and ciphertext
    let nonce_bytes = &data_bytes[0..12];
    let key_bytes = &data_bytes[12..44];
    let ciphertext = &data_bytes[44..];
    
    let key = Key::<Aes256Gcm>::from_slice(key_bytes);
    let cipher = Aes256Gcm::new(&key);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let plaintext = cipher.decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))?;
    
    Ok(String::from_utf8(plaintext)
        .map_err(|e| format!("Invalid UTF-8 in decrypted data: {}", e))?)
}
