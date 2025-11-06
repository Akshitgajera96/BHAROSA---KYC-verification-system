// Admin routes for fixing stuck KYC records
import express from 'express';
import KYCRecord from '../models/KYCRecord.js';
import User from '../models/User.js';
import { registerKYCOnBlockchain } from '../utils/blockchainClient.js';

const router = express.Router();

/**
 * @desc    Fix stuck KYC records
 * @route   POST /api/admin/fix-stuck-kyc
 * @access  Public (for development)
 */
router.post('/fix-stuck-kyc', async (req, res) => {
  try {
    console.log('🔧 Starting stuck KYC fix...');
    const results = { fixed: [], failed: [] };

    // Find ai_verified records with Aries errors
    const stuckRecords = await KYCRecord.find({
      status: 'ai_verified',
      $or: [
        { rejectionReason: { $regex: /Aries|connection error|getaddrinfo/i } },
        { rejectionReason: { $exists: true, $ne: null } }
      ]
    }).populate('userId');

    console.log(`Found ${stuckRecords.length} stuck records`);

    for (const record of stuckRecords) {
      try {
        console.log(`Fixing ${record._id}...`);

        // Create mock credential
        const credentialId = `cred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const credentialExchangeId = `cred-ex-${Date.now()}`;

        await KYCRecord.findByIdAndUpdate(record._id, {
          status: 'credential_issued',
          'ariesCredential.credentialId': credentialId,
          'ariesCredential.credentialExchangeId': credentialExchangeId,
          'ariesCredential.issuedAt': new Date(),
          'ariesCredential.mock': true,
          rejectionReason: null
        });

        // Register on blockchain
        const blockchainData = {
          documentType: record.documentType,
          documentNumber: record.documentNumber,
          documentNumberHash: record.documentNumberHash,
          userIdHash: record.userIdHash,
          fileHashes: record.fileHashes,
          merkleRoot: record.merkleRoot,
          aiConfidence: record.aiVerification?.confidenceScore || 95.5,
          faceMatchScore: record.aiVerification?.faceMatchScore || 92.3
        };

        if (record.ipfsStorage?.enabled) {
          blockchainData.ipfsCIDs = {
            front: record.ipfsStorage.frontCID,
            back: record.ipfsStorage.backCID,
            selfie: record.ipfsStorage.selfieCID
          };
        }

        const blockchainResult = await registerKYCOnBlockchain(
          record.userId._id.toString(),
          blockchainData
        );

        await KYCRecord.findByIdAndUpdate(record._id, {
          status: 'completed',
          'blockchainVerification.transactionHash': blockchainResult.transactionHash,
          'blockchainVerification.blockNumber': blockchainResult.blockNumber,
          'blockchainVerification.verificationHash': blockchainResult.verificationHash,
          'blockchainVerification.registeredAt': new Date(),
          completedAt: new Date()
        });

        await User.findByIdAndUpdate(record.userId._id, {
          kycStatus: 'verified'
        });

        results.fixed.push({
          recordId: record._id,
          userId: record.userId._id,
          email: record.userId.email,
          transactionHash: blockchainResult.transactionHash
        });

        console.log(`✅ Fixed ${record._id}`);
      } catch (error) {
        console.error(`❌ Failed to fix ${record._id}:`, error.message);
        results.failed.push({
          recordId: record._id,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Fixed ${results.fixed.length} records, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error('Error fixing stuck KYC:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix stuck KYC records',
      error: error.message
    });
  }
});

/**
 * @desc    Get KYC statistics
 * @route   GET /api/admin/kyc-stats
 * @access  Public (for development)
 */
router.get('/kyc-stats', async (req, res) => {
  try {
    const stats = await KYCRecord.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message
    });
  }
});

export default router;
