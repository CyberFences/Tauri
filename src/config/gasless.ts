// Gasless transaction configuration
// ⚠️ SECURITY WARNING: Private keys are stored in environment variables only
// Never commit private keys to version control
// 
// For Vite: Environment variables must be prefixed with VITE_ to be exposed
// Example: VITE_BACKEND_GAS_WALLET_PRIVATE_KEY=0x...

export const GASLESS_CONFIG = {
  // Backend gas wallet configuration - MUST be set via environment variables
  // Use VITE_ prefix for Vite environment variables
  BACKEND_GAS_WALLET_PRIVATE_KEY: import.meta.env.VITE_BACKEND_GAS_WALLET_PRIVATE_KEY || "",
  BACKEND_GAS_WALLET_ADDRESS: import.meta.env.VITE_BACKEND_GAS_WALLET_ADDRESS || "",
  
  // Gasless registration settings
  ENABLE_GASLESS: import.meta.env.VITE_ENABLE_GASLESS !== "false", // Enable gasless by default (set to "false" to disable)
  MAX_GAS_PRICE_GWEI: 50, // Maximum gas price in Gwei
  GAS_LIMIT: 500000, // Gas limit for registration (increased for contract execution)
  
  // Fallback to user-paid gas if gasless fails
  FALLBACK_TO_USER_GAS: true,
};

// ⚠️ CRITICAL SECURITY REQUIREMENTS:
// 1. Set environment variables in .env file (see .env.example)
// 2. NEVER commit .env file to version control
// 3. Use secure key management in production
// 4. Rotate keys regularly
// 5. Monitor gas wallet balance and set up alerts
// 6. Implement rate limiting to prevent abuse

// Required environment variables (with VITE_ prefix for Vite):
// VITE_BACKEND_GAS_WALLET_PRIVATE_KEY=0x...
// VITE_BACKEND_GAS_WALLET_ADDRESS=0x...
// VITE_ENABLE_GASLESS=true
