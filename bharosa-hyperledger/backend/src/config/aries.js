// 🔗 Hyperledger Aries Configuration
import dotenv from 'dotenv';

dotenv.config();

export const ariesConfig = {
  agentUrl: process.env.ARIES_AGENT_URL || 'http://aries_agent:8020',
  walletName: process.env.ARIES_WALLET_NAME || 'bharosa_wallet',
  walletKey: process.env.ARIES_WALLET_KEY,
  adminApiKey: process.env.ARIES_ADMIN_API_KEY || 'admin123',
};

// Validate Aries configuration
export const validateAriesConfig = () => {
  if (!ariesConfig.walletKey) {
    console.warn('⚠️  ARIES_WALLET_KEY not set in environment variables');
  }
  
  console.log('🔗 Aries Configuration Loaded:');
  console.log(`   Agent URL: ${ariesConfig.agentUrl}`);
  console.log(`   Wallet Name: ${ariesConfig.walletName}`);
  console.log(`   Admin API Key: ${ariesConfig.adminApiKey ? '***' : 'NOT SET'}`);
};

export default ariesConfig;
