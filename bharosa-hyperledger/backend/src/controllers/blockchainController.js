// ⛓️ Blockchain Controller - Handle blockchain operations
import { registerKYCOnBlockchain, isUserVerifiedOnBlockchain, getVerificationDetails, checkBlockchainHealth } from '../utils/blockchainClient.js';
import KYCRecord from '../models/KYCRecord.js';
import mongoose from 'mongoose';

/**
 * @desc    Register KYC verification on blockchain
 * @route   POST /api/blockchain/register
 * @access  Private
 */
export const registerVerification = async (req, res) => {
  try {
    const { kycRecordId } = req.body;

    if (!kycRecordId) {
      return res.status(400).json({
        success: false,
        message: 'KYC record ID is required'
      });
    }

    // Get KYC record
    const kycRecord = await KYCRecord.findById(kycRecordId).populate('userId');

    if (!kycRecord) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    // Check authorization
    if (req.user.id !== kycRecord.userId._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to register this verification'
      });
    }

    // Check if already registered
    if (kycRecord.blockchainVerification.transactionHash) {
      return res.status(400).json({
        success: false,
        message: 'This KYC is already registered on blockchain',
        transactionHash: kycRecord.blockchainVerification.transactionHash
      });
    }

    // Register on blockchain
    const result = await registerKYCOnBlockchain(
      kycRecord.userId._id.toString(),
      {
        documentType: kycRecord.documentType,
        documentNumber: kycRecord.documentNumber
      }
    );

    // Update KYC record
    kycRecord.blockchainVerification = {
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      verificationHash: result.verificationHash,
      registeredAt: new Date()
    };
    kycRecord.status = 'blockchain_registered';
    await kycRecord.save();

    res.status(200).json({
      success: true,
      message: 'KYC verification registered on blockchain',
      data: {
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        verificationHash: result.verificationHash
      }
    });
  } catch (error) {
    console.error('❌ Blockchain registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register on blockchain',
      error: error.message
    });
  }
};

/**
 * @desc    Check if user is verified on blockchain
 * @route   GET /api/blockchain/verify/:userId
 * @access  Public
 */
export const checkVerification = async (req, res) => {
  try {
    const { userId } = req.params;

    const isVerified = await isUserVerifiedOnBlockchain(userId);

    res.status(200).json({
      success: true,
      data: {
        userId,
        isVerified
      }
    });
  } catch (error) {
    console.error('❌ Verification check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check verification status',
      error: error.message
    });
  }
};

/**
 * @desc    Get verification details from blockchain
 * @route   GET /api/blockchain/details/:verificationHash
 * @access  Public
 */
export const getVerificationInfo = async (req, res) => {
  try {
    const { verificationHash } = req.params;

    const details = await getVerificationDetails(verificationHash);

    res.status(200).json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('❌ Get verification details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification details',
      error: error.message
    });
  }
};

/**
 * @desc    Save blockchain configuration (Admin only)
 * @route   POST /api/blockchain/settings
 * @access  Private/Admin
 */
export const saveBlockchainConfig = async (req, res) => {
  try {
    const { network, contract, privateKey } = req.body;

    if (!network || !contract || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Network, contract address, and private key are required'
      });
    }

    // Get or create BlockchainConfig model
    const BlockchainConfigSchema = new mongoose.Schema({
      network: String,
      contract: String,
      privateKey: String,
    });

    let BlockchainConfig;
    try {
      BlockchainConfig = mongoose.model('BlockchainConfig');
    } catch {
      BlockchainConfig = mongoose.model('BlockchainConfig', BlockchainConfigSchema);
    }

    // Delete existing config and create new one
    await BlockchainConfig.deleteMany({});
    await BlockchainConfig.create({ network, contract, privateKey });

    res.status(200).json({
      success: true,
      message: 'Blockchain configuration saved successfully'
    });
  } catch (error) {
    console.error('❌ Save blockchain config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save blockchain configuration',
      error: error.message
    });
  }
};

/**
 * @desc    Get blockchain configuration (Admin only)
 * @route   GET /api/blockchain/settings
 * @access  Private/Admin
 */
export const getBlockchainConfig = async (req, res) => {
  try {
    const BlockchainConfigSchema = new mongoose.Schema({
      network: String,
      contract: String,
      privateKey: String,
    });

    let BlockchainConfig;
    try {
      BlockchainConfig = mongoose.model('BlockchainConfig');
    } catch {
      BlockchainConfig = mongoose.model('BlockchainConfig', BlockchainConfigSchema);
    }

    const config = await BlockchainConfig.findOne();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'No blockchain configuration found'
      });
    }

    // Don't send the full private key
    res.status(200).json({
      success: true,
      data: {
        network: config.network,
        contract: config.contract,
        privateKey: config.privateKey ? '***' + config.privateKey.slice(-4) : null
      }
    });
  } catch (error) {
    console.error('❌ Get blockchain config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain configuration',
      error: error.message
    });
  }
};

/**
 * @desc    Check blockchain connectivity
 * @route   GET /api/blockchain/health
 * @access  Public
 */
export const healthCheck = async (req, res) => {
  try {
    const isHealthy = await checkBlockchainHealth();

    res.status(200).json({
      success: true,
      data: {
        status: isHealthy ? 'connected' : 'disconnected',
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Blockchain health check failed',
      error: error.message
    });
  }
};

export default {
  registerVerification,
  checkVerification,
  getVerificationInfo,
  saveBlockchainConfig,
  getBlockchainConfig,
  healthCheck
};
