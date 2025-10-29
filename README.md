# CyberFence - Network Security Monitor

A Tauri-based desktop application for network monitoring and blockchain-based machine registration.

## 🔒 Security Notice

**This application handles sensitive cryptographic data. Please read [SECURITY.md](./SECURITY.md) before setup.**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Tauri CLI

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Tauri
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your configuration
   # ⚠️ NEVER commit .env file to version control
   ```

4. **Start development server:**
   ```bash
   npm run tauri dev
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Backend Gas Wallet (for gasless transactions)
# ⚠️ IMPORTANT: Vite requires VITE_ prefix for environment variables
VITE_BACKEND_GAS_WALLET_PRIVATE_KEY=0x...
VITE_BACKEND_GAS_WALLET_ADDRESS=0x...

# Gasless Transaction Settings
VITE_ENABLE_GASLESS=true
```

See `env.example` for the complete template.

### Blockchain Configuration

The app connects to Sepolia testnet by default. Configuration is in `src/config/blockchain.ts`.

## 🏗️ Building

### Development Build
```bash
npm run tauri dev
```

### Production Build
```bash
npm run tauri build
```

## 📚 Documentation

- [Security Guidelines](./SECURITY.md)
- [Gasless Transaction Setup](./GASLESS_SETUP.md)
- [Blockchain Integration](./BLOCKCHAIN_INTEGRATION.md)

## 🛡️ Security

- Private keys are stored in environment variables only
- No sensitive data in source code
- Encrypted local storage for wallet data
- Secure blockchain transaction signing

## 🤝 Contributing

1. Read [SECURITY.md](./SECURITY.md)
2. Never commit private keys
3. Use environment variables for sensitive data
4. Follow security best practices

## 📄 License

[Your License Here]

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
