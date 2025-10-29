// Blockchain configuration
export const BLOCKCHAIN_CONFIG = {
  // Contract address - Deployed contract address
  CONTRACT_ADDRESS: "0xb97Cb3dC59544a363a85AE4D27B9Cb060Ba32830",
  
  // RPC URL - Replace with your RPC provider URL
  RPC_URL: "https://eth-sepolia.g.alchemy.com/v2/bpLlWNj3jT3VZi4isw1jMHKjT48s8nDE",
  
  // Chain ID - Sepolia testnet
  CHAIN_ID: 11155111,
  
  // Gas settings
  GAS_LIMIT: 200000,
  GAS_PRICE: "0.00000002", // 20 gwei
  
  // Network name for display
  NETWORK_NAME: "Sepolia Testnet"
};

// Instructions for setup
export const SETUP_INSTRUCTIONS = `
To set up blockchain integration:

1. Deploy the MachineRegistration contract to Sepolia testnet
2. Update CONTRACT_ADDRESS with your deployed contract address
3. Get an Infura API key and update RPC_URL
4. Ensure you have Sepolia ETH for gas fees
5. Test the registration process

Contract deployment:
- Use Remix IDE or Hardhat
- Deploy to Sepolia testnet
- Copy the contract address
- Update the configuration above
`;
