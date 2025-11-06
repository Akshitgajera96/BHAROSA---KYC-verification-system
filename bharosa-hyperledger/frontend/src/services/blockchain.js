// ⛓️ Blockchain Service - Web3 Integration
import { ethers } from 'ethers';

// KYC Contract ABI (simplified for demo)
const KYC_CONTRACT_ABI = [
  "function registerVerification(bytes32 verificationHash, string memory userId) public returns (bool)",
  "function getVerification(bytes32 verificationHash) public view returns (bool, uint256, string memory)",
  "function isVerified(string memory userId) public view returns (bool)",
  "event VerificationRegistered(bytes32 indexed verificationHash, string userId, uint256 timestamp)"
];

/**
 * Connect to MetaMask wallet
 * @returns {Object} Provider and signer
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    console.log('✅ Wallet connected:', address);
    console.log('📡 Network:', network.name, network.chainId);

    return {
      provider,
      signer,
      address,
      network: {
        name: network.name,
        chainId: Number(network.chainId)
      }
    };
  } catch (error) {
    console.error('❌ Wallet connection error:', error);
    throw new Error(error.message || 'Failed to connect wallet');
  }
}

/**
 * Get current connected wallet address
 * @returns {string} Wallet address
 */
export async function getWalletAddress() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return await signer.getAddress();
}

/**
 * Get wallet balance
 * @param {string} address - Wallet address
 * @returns {string} Balance in ETH
 */
export async function getBalance(address) {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

/**
 * Register KYC verification on blockchain
 * @param {string} contractAddress - Smart contract address
 * @param {string} userId - User ID
 * @param {Object} verificationData - Verification data
 * @returns {Object} Transaction receipt
 */
export async function registerKYCOnChain(contractAddress, userId, verificationData) {
  try {
    const { signer } = await connectWallet();
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, KYC_CONTRACT_ABI, signer);
    
    // Create verification hash
    const verificationHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify({
        userId,
        timestamp: Date.now(),
        ...verificationData
      }))
    );

    console.log('📝 Registering KYC on blockchain...');
    console.log('   User ID:', userId);
    console.log('   Verification Hash:', verificationHash);

    // Send transaction
    const tx = await contract.registerVerification(verificationHash, userId);
    console.log('📤 Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      verificationHash,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    console.error('❌ Blockchain registration error:', error);
    throw new Error(error.message || 'Failed to register on blockchain');
  }
}

/**
 * Check if user is verified on blockchain
 * @param {string} contractAddress - Smart contract address
 * @param {string} userId - User ID
 * @returns {boolean} Verification status
 */
export async function checkVerificationOnChain(contractAddress, userId) {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, KYC_CONTRACT_ABI, provider);
    
    const isVerified = await contract.isVerified(userId);
    return isVerified;
  } catch (error) {
    console.error('❌ Blockchain check error:', error);
    return false;
  }
}

/**
 * Get verification details from blockchain
 * @param {string} contractAddress - Smart contract address
 * @param {string} verificationHash - Verification hash
 * @returns {Object} Verification details
 */
export async function getVerificationFromChain(contractAddress, verificationHash) {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, KYC_CONTRACT_ABI, provider);
    
    const [isVerified, timestamp, userId] = await contract.getVerification(verificationHash);
    
    return {
      isVerified,
      timestamp: Number(timestamp),
      userId,
      date: new Date(Number(timestamp) * 1000).toLocaleString()
    };
  } catch (error) {
    console.error('❌ Failed to get verification details:', error);
    throw error;
  }
}

/**
 * Listen for wallet account changes
 * @param {Function} callback - Callback function
 */
export function onAccountsChanged(callback) {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        console.log('🔒 Wallet disconnected');
      } else {
        console.log('🔄 Account changed:', accounts[0]);
      }
      callback(accounts);
    });
  }
}

/**
 * Listen for network changes
 * @param {Function} callback - Callback function
 */
export function onChainChanged(callback) {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', (chainId) => {
      console.log('🔄 Network changed:', chainId);
      callback(chainId);
      // Reload page on network change (recommended by MetaMask)
      window.location.reload();
    });
  }
}

/**
 * Disconnect wallet event listeners
 */
export function disconnectWallet() {
  if (window.ethereum) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
}

/**
 * Check if MetaMask is installed
 * @returns {boolean}
 */
export function isMetaMaskInstalled() {
  return typeof window.ethereum !== 'undefined';
}

/**
 * Switch to specific network
 * @param {number} chainId - Chain ID
 */
export async function switchNetwork(chainId) {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ethers.toQuantity(chainId) }],
    });
  } catch (error) {
    // Chain doesn't exist, add it
    if (error.code === 4902) {
      console.log('Network not found, please add it manually');
    }
    throw error;
  }
}

export default {
  connectWallet,
  getWalletAddress,
  getBalance,
  registerKYCOnChain,
  checkVerificationOnChain,
  getVerificationFromChain,
  onAccountsChanged,
  onChainChanged,
  disconnectWallet,
  isMetaMaskInstalled,
  switchNetwork
};
