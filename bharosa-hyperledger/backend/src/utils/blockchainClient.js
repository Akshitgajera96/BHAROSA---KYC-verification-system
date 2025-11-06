// ⛓️ Blockchain Client for Smart Contract Interaction
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import KYCRecord from '../models/KYCRecord.js';
import { createVerificationHash, hashUserId, createMerkleRoot } from './hashUtils.js';

dotenv.config();

const BLOCKCHAIN_NETWORK = process.env.BLOCKCHAIN_NETWORK || 'http://ganache:8545';

// KYC Verification Contract ABI (matches KYCVerification.sol)
const KYC_CONTRACT_ABI = [
  "function registerVerification(bytes32 verificationHash, string memory userId, string memory documentType) public returns (bool)",
  "function getVerification(bytes32 verificationHash) public view returns (bool isValid, uint256 timestamp, string memory userId, string memory documentType)",
  "function isVerified(string memory userId) public view returns (bool)",
  "function getUserVerifications(string memory userId) public view returns (bytes32[])",
  "function revokeVerification(bytes32 verificationHash) public returns (bool)",
  "function getStats() public view returns (uint256 total, address contractOwner)",
  "function totalVerifications() public view returns (uint256)",
  "event VerificationRegistered(bytes32 indexed verificationHash, string indexed userId, string documentType, uint256 timestamp, address verifier)",
  "event VerificationRevoked(bytes32 indexed verificationHash, string indexed userId, uint256 timestamp)"
];

/**
 * Get blockchain configuration from database
 * @returns {Object} Blockchain configuration
 */
const getBlockchainConfig = async () => {
  try {
    // Import the BlockchainConfig model dynamically to avoid circular dependencies
    const mongoose = (await import('mongoose')).default;
    
    let BlockchainConfig;
    try {
      BlockchainConfig = mongoose.model('BlockchainConfig');
    } catch {
      // Model doesn't exist yet, create schema
      const BlockchainConfigSchema = new mongoose.Schema({
        network: String,
        contract: String,
        privateKey: String,
      });
      BlockchainConfig = mongoose.model('BlockchainConfig', BlockchainConfigSchema);
    }
    
    const config = await BlockchainConfig.findOne();
    
    if (!config) {
      console.warn('⚠️  No blockchain config found in database, using environment variables');
      return {
        network: BLOCKCHAIN_NETWORK,
        contract: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY
      };
    }
    
    return config;
  } catch (error) {
    console.warn('⚠️  Failed to fetch blockchain config from DB:', error.message);
    return {
      network: BLOCKCHAIN_NETWORK,
      contract: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY
    };
  }
};

/**
 * Initialize blockchain provider and contract
 * @returns {Object} Provider, signer, and contract instance
 */
const initializeBlockchain = async () => {
  try {
    const config = await getBlockchainConfig();
    
    console.log(`⛓️  Connecting to blockchain: ${config.network}`);
    
    // Connect to blockchain network
    const provider = new ethers.JsonRpcProvider(config.network);
    
    // Create wallet from private key
    if (!config.privateKey) {
      throw new Error('Private key not configured');
    }
    
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    // Connect to contract
    const contract = new ethers.Contract(config.contract, KYC_CONTRACT_ABI, wallet);
    
    console.log('✅ Blockchain initialized successfully');
    console.log(`   Contract Address: ${config.contract}`);
    
    return { provider, wallet, contract, config };
  } catch (error) {
    console.error('❌ Blockchain initialization failed:', error.message);
    throw error;
  }
};

/**
 * Register KYC verification on blockchain with IPFS CIDs
 * @param {String} userId - User ID
 * @param {Object} verificationData - KYC verification data (including IPFS CIDs)
 * @returns {Object} Transaction receipt
 */
export const registerKYCOnBlockchain = async (userId, verificationData) => {
  try {
    console.log('⛓️  Registering KYC verification on blockchain...');
    
    const { contract } = await initializeBlockchain();
    
    // 🔐 Create cryptographic verification hash for blockchain immutability
    console.log('🔐 Creating cryptographic verification hash...');
    
    const hashData = {
      userIdHash: verificationData.userIdHash || hashUserId(userId),
      documentNumberHash: verificationData.documentNumberHash,
      documentType: verificationData.documentType,
      timestamp: Date.now(),
      aiConfidence: verificationData.aiConfidence || 0,
      faceMatchScore: verificationData.faceMatchScore || 0
    };
    
    // Add IPFS CIDs to hash if available (for decentralized storage tracking)
    if (verificationData.ipfsCIDs) {
      hashData.ipfs = {
        frontCID: verificationData.ipfsCIDs.front,
        backCID: verificationData.ipfsCIDs.back,
        selfieCID: verificationData.ipfsCIDs.selfie
      };
      console.log('📦 Including IPFS CIDs in verification hash');
      console.log(`   Front CID: ${verificationData.ipfsCIDs.front}`);
      console.log(`   Selfie CID: ${verificationData.ipfsCIDs.selfie}`);
    }
    
    // Add file hashes for integrity verification
    if (verificationData.fileHashes) {
      hashData.fileHashes = verificationData.fileHashes;
      console.log('🔐 Including file hashes for integrity');
    }
    
    // Add Merkle root if available
    if (verificationData.merkleRoot) {
      hashData.merkleRoot = verificationData.merkleRoot;
      console.log(`🌳 Merkle Root: ${verificationData.merkleRoot.substring(0, 16)}...`);
    }
    
    const verificationHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(hashData))
    );
    
    console.log(`📝 Verification Hash: ${verificationHash}`);
    
    // Register on blockchain with all 3 required parameters
    const tx = await contract.registerVerification(
      verificationHash, 
      userId,
      verificationData.documentType || 'national_id'
    );
    console.log(`📤 Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      verificationHash: verificationHash,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    console.error('❌ Blockchain registration failed:', error.message);
    
    if (error.code === 'NETWORK_ERROR') {
      throw new Error('Blockchain network is not reachable');
    }
    
    throw new Error(`Blockchain error: ${error.message}`);
  }
};

/**
 * Check if user is verified on blockchain
 * @param {String} userId - User ID to check
 * @returns {Boolean} Verification status
 */
export const isUserVerifiedOnBlockchain = async (userId) => {
  try {
    const { contract } = await initializeBlockchain();
    
    const isVerified = await contract.isVerified(userId);
    
    console.log(`🔍 User ${userId} verification status: ${isVerified}`);
    return isVerified;
  } catch (error) {
    console.error('❌ Failed to check verification status:', error.message);
    throw new Error(`Blockchain query failed: ${error.message}`);
  }
};

/**
 * Get verification details from blockchain
 * @param {String} verificationHash - Verification hash
 * @returns {Object} Verification details
 */
export const getVerificationDetails = async (verificationHash) => {
  try {
    const { contract } = await initializeBlockchain();
    
    const [isVerified, timestamp, userId] = await contract.getVerification(verificationHash);
    
    return {
      isVerified,
      timestamp: Number(timestamp),
      userId
    };
  } catch (error) {
    console.error('❌ Failed to get verification details:', error.message);
    throw new Error(`Blockchain query failed: ${error.message}`);
  }
};

/**
 * Check blockchain connectivity
 * @returns {Boolean} Connection status
 */
export const checkBlockchainHealth = async () => {
  try {
    const { provider } = await initializeBlockchain();
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Blockchain connected. Current block: ${blockNumber}`);
    
    return true;
  } catch (error) {
    console.error('❌ Blockchain health check failed:', error.message);
    return false;
  }
};

export default {
  registerKYCOnBlockchain,
  isUserVerifiedOnBlockchain,
  getVerificationDetails,
  checkBlockchainHealth
};
