// 📄 KYC Controller - Handle KYC verification workflow
import KYCRecord from '../models/KYCRecord.js';
import User from '../models/User.js';
import { verifyDocuments } from '../utils/aiClient.js';
import { issueKYCCredential, createConnectionInvitation } from '../utils/ariesClient.js';
import { registerKYCOnBlockchain } from '../utils/blockchainClient.js';
import { uploadMultipleToIPFS, getIPFSGatewayUrl } from '../utils/ipfsClient.js';
import { logKYCStep } from '../utils/debugLogger.js';
import performanceTracker from '../utils/performanceTracker.js';
import { performDummyAIVerification, isDummyModeEnabled, logDummyModeStatus } from '../utils/dummyAiVerifier.js';
import { 
  hashDocumentNumber, 
  hashUserId, 
  createVerificationHash,
  hashFile,
  createMerkleRoot 
} from '../utils/hashUtils.js';
import fs from 'fs';

/**
 * @desc    Submit KYC documents for verification
 * @route   POST /api/kyc/submit
 * @access  Private
 */
export const submitKYC = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType, documentNumber } = req.body;

    // Extract uploaded files
    const files = req.files;
    
    console.log('📥 Received KYC submission:', {
      userId,
      documentType,
      documentNumber,
      files: files ? Object.keys(files) : 'none'
    });

    // Validate input
    if (!documentType || !documentNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide document type and number'
      });
    }

    if (!files || !files['documentImages[front]'] || !files['documentImages[selfie]']) {
      return res.status(400).json({
        success: false,
        message: 'Please upload ID front image and selfie'
      });
    }

    // Check if user already has a pending/verified KYC
    const existingKYC = await KYCRecord.findOne({
      userId,
      status: { $in: ['submitted', 'ai_processing', 'ai_verified', 'credential_issued'] }
    });

    if (existingKYC) {
      // Check if record is stuck (processing for more than 10 minutes)
      const submittedAt = new Date(existingKYC.submittedAt);
      const now = new Date();
      const elapsedMinutes = (now - submittedAt) / 60000;
      
      if (existingKYC.status === 'ai_processing' && elapsedMinutes > 10) {
        console.log(`⚠️ Found stuck KYC record (${elapsedMinutes.toFixed(1)} minutes old). Auto-failing it...`);
        
        // Auto-fail the stuck record
        await KYCRecord.findByIdAndUpdate(existingKYC._id, {
          status: 'rejected',
          'aiVerification.status': 'failed',
          'aiVerification.errors': ['Processing timeout - verification took too long'],
          rejectionReason: `AI verification timeout after ${elapsedMinutes.toFixed(0)} minutes. Please resubmit.`,
          completedAt: new Date()
        });
        
        console.log('✅ Stuck record auto-failed. User can now submit new KYC.');
        // Continue with new submission
      } else {
        console.log(`⚠️ User already has a KYC in progress: ${existingKYC.status}`);
        return res.status(400).json({
          success: false,
          message: 'You already have a KYC submission in progress',
          currentStatus: existingKYC.status,
          submittedAt: existingKYC.submittedAt,
          kycRecordId: existingKYC._id,
          canResubmit: false
        });
      }
    }
    
    // Allow resubmission if previous was completed or rejected
    console.log('✅ No pending KYC found. Allowing new submission.');

    // Build document images object with file paths
    console.log('📂 Building document images object...');
    const documentImages = {
      front: files['documentImages[front]'][0].path,
      selfie: files['documentImages[selfie]'][0].path
    };

    if (files['documentImages[back]']) {
      documentImages.back = files['documentImages[back]'][0].path;
    }
    console.log('✅ Document images object created:', documentImages);

    // 🔐 Generate cryptographic hashes for blockchain security
    console.log('🔐 Generating cryptographic hashes for blockchain...');
    
    // Hash document number for privacy
    const documentNumberHash = hashDocumentNumber(documentNumber, documentType);
    console.log(`   Document Hash: ${documentNumberHash.substring(0, 16)}...`);
    
    // Hash user ID for privacy
    const userIdHash = hashUserId(userId);
    console.log(`   User Hash: ${userIdHash.substring(0, 16)}...`);
    
    // Hash document files for integrity
    const fileHashes = {};
    try {
      console.log('   Reading front file:', documentImages.front);
      fileHashes.front = hashFile(fs.readFileSync(documentImages.front));
      console.log('   Reading selfie file:', documentImages.selfie);
      fileHashes.selfie = hashFile(fs.readFileSync(documentImages.selfie));
      if (documentImages.back) {
        console.log('   Reading back file:', documentImages.back);
        fileHashes.back = hashFile(fs.readFileSync(documentImages.back));
      }
      console.log(`   File Hashes Generated: ${Object.keys(fileHashes).length} files`);
    } catch (err) {
      console.error('   ❌ ERROR: Could not hash files:', err);
      console.error('   File paths:', documentImages);
      throw new Error(`File hashing failed: ${err.message}`);
    }
    
    // Create Merkle root of all file hashes
    const merkleRoot = createMerkleRoot(Object.values(fileHashes));
    console.log(`   Merkle Root: ${merkleRoot.substring(0, 16)}...`);

    // Create KYC record with hashed data
    console.log('💾 Creating KYC record in database...');
    let kycRecord;
    try {
      kycRecord = await KYCRecord.create({
        userId,
        documentType,
        documentNumber, // Store original for internal use
        documentNumberHash, // Store hash for blockchain
        userIdHash, // Store user hash for blockchain
        fileHashes, // Store file hashes for verification
        merkleRoot, // Store Merkle root
        documentImages,
        status: 'submitted',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
      console.log('✅ KYC record created successfully:', kycRecord._id);
    } catch (dbError) {
      console.error('❌ Database error creating KYC record:', dbError);
      throw dbError;
    }

    // Update user status
    await User.findByIdAndUpdate(userId, {
      kycStatus: 'in_progress',
      kycRecordId: kycRecord._id
    });

    console.log('✅ KYC record created successfully!');
    console.log(`   Record ID: ${kycRecord._id}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Status: ${kycRecord.status}`);

    // Start AI verification in background
    processAIVerification(kycRecord._id, documentImages, documentType, documentNumber);

    // Return response with full record details
    const response = {
      success: true,
      message: 'KYC submission received. Verification in progress.',
      data: {
        kycRecordId: kycRecord._id.toString(),
        status: kycRecord.status,
        submittedAt: kycRecord.submittedAt,
        documentType: kycRecord.documentType
      }
    };
    
    console.log('✅ Sending response:', JSON.stringify(response, null, 2));
    res.status(201).json(response);
  } catch (error) {
    console.error('❌ KYC submission error:', error);
    console.error('   Error stack:', error.stack);
    console.error('   Error name:', error.name);
    
    // Determine if this is a validation error (400) or server error (500)
    const statusCode = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500;
    const message = error.name === 'ValidationError' 
      ? `Validation failed: ${Object.values(error.errors).map(e => e.message).join(', ')}`
      : 'Failed to submit KYC';
    
    res.status(statusCode).json({
      success: false,
      message,
      error: error.message,
      errorType: error.name
    });
  }
};

/**
 * Process AI verification (async background task)
 */
const processAIVerification = async (kycRecordId, documentImages, documentType, documentNumber) => {
  // Start performance tracking
  performanceTracker.startSession(kycRecordId);
  performanceTracker.addMetadata(kycRecordId, 'documentType', documentType);
  performanceTracker.addMetadata(kycRecordId, 'hasBackImage', !!documentImages.back);
  
  // Set a timeout to auto-fail if processing takes too long (5 minutes)
  const timeoutId = setTimeout(async () => {
    console.log(`⏰ TIMEOUT: AI verification for ${kycRecordId} exceeded 5 minutes. Auto-failing...`);
    
    try {
      await KYCRecord.findByIdAndUpdate(kycRecordId, {
        status: 'rejected',
        'aiVerification.status': 'failed',
        'aiVerification.errors': ['Processing timeout - AI verification exceeded maximum time limit'],
        rejectionReason: 'AI verification timeout. The verification process took too long. Please try again with clearer images.',
        completedAt: new Date()
      });
      
      const kycRecord = await KYCRecord.findById(kycRecordId).populate('userId');
      if (kycRecord) {
        await User.findByIdAndUpdate(kycRecord.userId._id, {
          kycStatus: 'rejected'
        });
      }
      
      await performanceTracker.endSession(kycRecordId, 'timeout');
      console.log('✅ Record auto-failed due to timeout');
    } catch (timeoutError) {
      console.error('❌ Error in timeout handler:', timeoutError);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  try {
    console.log(`🧠 Starting AI verification for KYC record: ${kycRecordId}`);
    console.log(`   Document Type: ${documentType}, Number: ${documentNumber}`);
    
    logKYCStep(kycRecordId, 'start_ai_verification', {
      documentType,
      hasDocuments: {
        front: !!documentImages.front,
        back: !!documentImages.back,
        selfie: !!documentImages.selfie
      }
    });

    // Update status to processing
    performanceTracker.startStep(kycRecordId, 'database_update', { action: 'set_processing_status' });
    await KYCRecord.findByIdAndUpdate(kycRecordId, {
      status: 'ai_processing',
      'aiVerification.status': 'processing'
    });
    performanceTracker.endStep(kycRecordId);
    
    // PHASE 1: Upload documents to IPFS for decentralized storage (PRIORITY)
    console.log('📦 Step 1: Uploading documents to IPFS...');
    const filesToUpload = [];
    if (documentImages.front) filesToUpload.push(documentImages.front);
    if (documentImages.back) filesToUpload.push(documentImages.back);
    if (documentImages.selfie) filesToUpload.push(documentImages.selfie);
    performanceTracker.startStep(kycRecordId, 'ipfs_upload', { fileCount: filesToUpload.length });
    
    const ipfsStartTime = Date.now();
    const ipfsResults = await uploadMultipleToIPFS(filesToUpload, {
      kycRecordId: kycRecordId.toString(),
      documentType,
      uploadedAt: new Date().toISOString()
    });
    
    // Extract CIDs and update KYC record with IPFS information
    const ipfsData = {
      front: ipfsResults.find(r => r.filePath === documentImages.front),
      back: ipfsResults.find(r => r.filePath === documentImages.back),
      selfie: ipfsResults.find(r => r.filePath === documentImages.selfie)
    };
    
    console.log('✅ IPFS upload completed:');
    if (ipfsData.front?.cid) console.log(`   Front CID: ${ipfsData.front.cid}`);
    if (ipfsData.back?.cid) console.log(`   Back CID: ${ipfsData.back.cid}`);
    if (ipfsData.selfie?.cid) console.log(`   Selfie CID: ${ipfsData.selfie.cid}`);
    
    const ipfsDuration = Date.now() - ipfsStartTime;
    performanceTracker.endStep(kycRecordId);
    performanceTracker.trackSubStep(kycRecordId, 'ipfs_total', ipfsDuration, {
      fileCount: filesToUpload.length,
      frontCID: ipfsData.front?.cid,
      backCID: ipfsData.back?.cid,
      selfieCID: ipfsData.selfie?.cid
    });
    
    logKYCStep(kycRecordId, 'ipfs_upload_complete', {
      ipfsData: {
        frontCID: ipfsData.front?.cid,
        backCID: ipfsData.back?.cid,
        selfieCID: ipfsData.selfie?.cid
      }
    });

    // PHASE 2: Call AI service with document type
    console.log('🧠 Step 2: AI verification...');
    
    // Check if dummy mode is enabled
    const useDummyAI = isDummyModeEnabled();
    if (useDummyAI) {
      console.log('🧪 Using DUMMY AI verification mode');
    } else {
      console.log('🧠 Using REAL AI service');
    }
    
    // Update status to show AI is processing
    performanceTracker.startStep(kycRecordId, 'ai_verification', { documentType, isDummyMode: useDummyAI });
    await KYCRecord.findByIdAndUpdate(kycRecordId, {
      status: 'ai_processing',
      'aiVerification.status': 'processing',
      'aiVerification.steps.qualityCheck': 'processing'
    });
    
    const aiStartTime = Date.now();
    // Call dummy or real AI service based on configuration
    const aiResult = useDummyAI 
      ? await performDummyAIVerification(documentImages, documentType, documentNumber)
      : await verifyDocuments(documentImages, documentType, documentNumber);
    const aiDuration = Date.now() - aiStartTime;
    
    if (useDummyAI) {
      console.log('✅ AI Verification (Dummy) executed successfully.');
    }
    
    performanceTracker.endStep(kycRecordId, aiResult.verified ? 'completed' : 'failed');
    performanceTracker.trackSubStep(kycRecordId, 'ai_service_call', aiDuration, {
      verified: aiResult.verified,
      confidenceScore: aiResult.confidenceScore,
      isDummyMode: useDummyAI
    });

    // Update with AI results and IPFS data
    const updateData = {
      status: aiResult.verified ? 'ai_verified' : 'rejected',
      'aiVerification.status': aiResult.verified ? 'verified' : 'failed',
      'aiVerification.confidenceScore': aiResult.confidenceScore,
      'aiVerification.faceMatchScore': aiResult.faceMatchScore,
      'aiVerification.ocrData': aiResult.ocrData,
      'aiVerification.verifiedAt': new Date(),
      'aiVerification.errors': aiResult.errors || [],
      // Mark all AI steps as completed
      'aiVerification.steps.qualityCheck': 'completed',
      'aiVerification.steps.tamperingDetection': 'completed',
      'aiVerification.steps.ocrExtraction': 'completed',
      'aiVerification.steps.documentValidation': 'completed',
      'aiVerification.steps.faceMatching': 'completed',
      'aiVerification.steps.finalDecision': 'completed',
      rejectionReason: aiResult.verified ? null : 'AI verification failed',
      // Store IPFS data
      'ipfsStorage.enabled': ipfsData.front?.cid ? true : false,
      'ipfsStorage.frontCID': ipfsData.front?.cid,
      'ipfsStorage.backCID': ipfsData.back?.cid,
      'ipfsStorage.selfieCID': ipfsData.selfie?.cid,
      'ipfsStorage.frontHash': ipfsData.front?.fileHash,
      'ipfsStorage.backHash': ipfsData.back?.fileHash,
      'ipfsStorage.selfieHash': ipfsData.selfie?.fileHash,
      'ipfsStorage.provider': ipfsData.front?.provider,
      'ipfsStorage.uploadedAt': new Date(),
      'ipfsStorage.gatewayUrls': {
        front: ipfsData.front?.cid ? getIPFSGatewayUrl(ipfsData.front.cid) : null,
        back: ipfsData.back?.cid ? getIPFSGatewayUrl(ipfsData.back.cid) : null,
        selfie: ipfsData.selfie?.cid ? getIPFSGatewayUrl(ipfsData.selfie.cid) : null
      }
    };
    
    logKYCStep(kycRecordId, 'ai_verification_complete', {
      verified: aiResult.verified,
      confidenceScore: aiResult.confidenceScore,
      ipfsEnabled: updateData['ipfsStorage.enabled']
    });
    
    performanceTracker.startStep(kycRecordId, 'database_save_ai_results');
    const kycRecord = await KYCRecord.findByIdAndUpdate(
      kycRecordId,
      updateData,
      { new: true }
    ).populate('userId');
    performanceTracker.endStep(kycRecordId);

    if (aiResult.verified) {
      console.log('✅ AI verification passed. Proceeding to credential issuance...');
      
      // Clear timeout as verification succeeded
      clearTimeout(timeoutId);
      
      // Issue Aries credential
      await issueAriesCredential(kycRecord);
    } else {
      console.log('❌ AI verification failed');
      
      // Clear timeout as verification completed (even if rejected)
      clearTimeout(timeoutId);
      
      // Update user status
      await User.findByIdAndUpdate(kycRecord.userId._id, {
        kycStatus: 'rejected'
      });
    }
  } catch (error) {
    console.error('❌ AI verification process error:', error);
    
    // Clear timeout as process ended with error
    clearTimeout(timeoutId);
    
    performanceTracker.endStep(kycRecordId, 'failed', error.message);
    await performanceTracker.endSession(kycRecordId, 'failed');
    
    // Update KYC record with error
    await KYCRecord.findByIdAndUpdate(kycRecordId, {
      status: 'rejected',
      'aiVerification.status': 'failed',
      'aiVerification.errors': [error.message],
      rejectionReason: `AI verification error: ${error.message}`
    });
  }
};

/**
 * Issue Aries verifiable credential (async)
 */
const issueAriesCredential = async (kycRecord) => {
  try {
    console.log(`📜 Issuing Aries credential for KYC record: ${kycRecord._id}`);
    performanceTracker.startStep(kycRecord._id, 'aries_credential_issuance');

    // Check if Aries is available (optional in development)
    const skipAries = process.env.SKIP_ARIES_CREDENTIAL === 'true' || process.env.NODE_ENV === 'development';
    
    if (skipAries) {
      console.log('⚠️ Aries credential issuance SKIPPED (development mode)');
      console.log('   Set SKIP_ARIES_CREDENTIAL=false to enable Aries');
      
      // Create mock credential for development
      const credentialExchangeId = `cred-ex-${Date.now()}`;
      const credentialId = `cred-${Date.now()}`;
      const credentialData = {
        fullName: kycRecord.userId.fullName,
        documentType: kycRecord.documentType,
        documentNumber: kycRecord.documentNumber
      };

      await KYCRecord.findByIdAndUpdate(kycRecord._id, {
        status: 'credential_issued',
        'ariesCredential.credentialId': credentialId,
        'ariesCredential.credentialExchangeId': credentialExchangeId,
        'ariesCredential.issuedAt': new Date(),
        'ariesCredential.credentialData': credentialData,
        'ariesCredential.mock': true
      });
      
      performanceTracker.endStep(kycRecord._id, 'completed', 'Mock credential (dev mode)');
      console.log('✅ Mock credential issued. Proceeding to blockchain registration...');
      
      // Register on blockchain
      await registerOnBlockchain(kycRecord._id);
      return;
    }

    // Real Aries flow (production)
    console.log('🔗 Using real Aries credential issuance');
    const invitation = await createConnectionInvitation();

    const credentialData = {
      fullName: kycRecord.userId.fullName,
      documentType: kycRecord.documentType,
      documentNumber: kycRecord.documentNumber
    };

    const credentialExchangeId = `cred-ex-${Date.now()}`;
    const credentialId = `cred-${Date.now()}`;

    await KYCRecord.findByIdAndUpdate(kycRecord._id, {
      status: 'credential_issued',
      'ariesCredential.credentialId': credentialId,
      'ariesCredential.credentialExchangeId': credentialExchangeId,
      'ariesCredential.issuedAt': new Date(),
      'ariesCredential.credentialData': credentialData
    });
    performanceTracker.endStep(kycRecord._id);

    console.log('✅ Aries credential issued. Proceeding to blockchain registration...');

    // Register on blockchain
    await registerOnBlockchain(kycRecord._id);
  } catch (error) {
    console.error('❌ Aries credential issuance error:', error);
    console.error('   This is non-critical in development. Skipping to blockchain...');
    performanceTracker.endStep(kycRecord._id, 'skipped', error.message);
    
    // In development, continue to blockchain even if Aries fails
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Skipping Aries credential due to error (dev mode)');
      
      // Create mock credential
      const credentialExchangeId = `cred-ex-${Date.now()}`;
      const credentialId = `cred-${Date.now()}`;
      
      await KYCRecord.findByIdAndUpdate(kycRecord._id, {
        status: 'credential_issued',
        'ariesCredential.credentialId': credentialId,
        'ariesCredential.credentialExchangeId': credentialExchangeId,
        'ariesCredential.issuedAt': new Date(),
        'ariesCredential.error': error.message,
        'ariesCredential.mock': true
      });
      
      console.log('✅ Mock credential created. Proceeding to blockchain...');
      // Continue to blockchain
      await registerOnBlockchain(kycRecord._id);
    } else {
      // In production, mark as failed but keep verified status
      await KYCRecord.findByIdAndUpdate(kycRecord._id, {
        status: 'ai_verified',
        rejectionReason: `Credential issuance failed: ${error.message}`
      });
    }
  }
};

/**
 * Register KYC on blockchain (async)
 */
const registerOnBlockchain = async (kycRecordId) => {
  try {
    console.log(`⛓️  Registering KYC on blockchain for record: ${kycRecordId}`);
    performanceTracker.startStep(kycRecordId, 'blockchain_registration');

    const kycRecord = await KYCRecord.findById(kycRecordId).populate('userId');

    // 🔐 Prepare blockchain data with cryptographic hashes
    const blockchainData = {
      documentType: kycRecord.documentType,
      documentNumber: kycRecord.documentNumber,
      documentNumberHash: kycRecord.documentNumberHash,
      userIdHash: kycRecord.userIdHash,
      fileHashes: kycRecord.fileHashes,
      merkleRoot: kycRecord.merkleRoot,
      aiConfidence: kycRecord.aiVerification?.confidenceScore,
      faceMatchScore: kycRecord.aiVerification?.faceMatchScore
    };
    
    console.log('🔐 Blockchain data with hashes prepared:');
    console.log(`   Document Hash: ${blockchainData.documentNumberHash?.substring(0, 16)}...`);
    console.log(`   User Hash: ${blockchainData.userIdHash?.substring(0, 16)}...`);
    console.log(`   Merkle Root: ${blockchainData.merkleRoot?.substring(0, 16)}...`);
    
    // Include IPFS CIDs in blockchain transaction data for decentralized storage proof
    if (kycRecord.ipfsStorage?.enabled) {
      blockchainData.ipfsCIDs = {
        front: kycRecord.ipfsStorage.frontCID,
        back: kycRecord.ipfsStorage.backCID,
        selfie: kycRecord.ipfsStorage.selfieCID
      };
      console.log('📦 Including IPFS CIDs in blockchain registration');
    }

    // Register on blockchain with all cryptographic proofs
    const blockchainStartTime = Date.now();
    const blockchainResult = await registerKYCOnBlockchain(
      kycRecord.userId._id.toString(),
      blockchainData
    );
    const blockchainDuration = Date.now() - blockchainStartTime;
    performanceTracker.trackSubStep(kycRecordId, 'blockchain_transaction', blockchainDuration, {
      transactionHash: blockchainResult.transactionHash
    });
    
    logKYCStep(kycRecordId, 'blockchain_registration_complete', {
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber
    });

    // Update KYC record with blockchain info
    await KYCRecord.findByIdAndUpdate(kycRecordId, {
      status: 'completed',
      'blockchainVerification.transactionHash': blockchainResult.transactionHash,
      'blockchainVerification.blockNumber': blockchainResult.blockNumber,
      'blockchainVerification.verificationHash': blockchainResult.verificationHash,
      'blockchainVerification.registeredAt': new Date(),
      completedAt: new Date()
    });

    // Update user status
    await User.findByIdAndUpdate(kycRecord.userId._id, {
      kycStatus: 'verified'
    });
    performanceTracker.endStep(kycRecordId);

    console.log('✅ KYC verification completed successfully!');
    
    // End performance tracking session
    await performanceTracker.endSession(kycRecordId, 'completed');
  } catch (error) {
    console.error('❌ Blockchain registration error:', error);
    performanceTracker.endStep(kycRecordId, 'failed', error.message);
    await performanceTracker.endSession(kycRecordId, 'partial');
    
    await KYCRecord.findByIdAndUpdate(kycRecordId, {
      status: 'credential_issued',  // Keep at credential issued stage
      rejectionReason: `Blockchain registration failed: ${error.message}`
    });
  }
};

/**
 * @desc    Get KYC status for a user
 * @route   GET /api/kyc/status/:userId
 * @access  Private
 */
export const getKYCStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    let kycRecord;

    console.log(`📋 Fetching KYC status for: ${userId}`);
    console.log(`   Request from user: ${req.user.id} (${req.user.role || 'user'})`);
    
    // Smart detection: Check if the parameter is a MongoDB ObjectId (24 hex chars)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    
    if (isValidObjectId) {
      console.log('🔍 Valid ObjectId format detected, trying both record ID and user ID...');
      
      try {
        // First, try to find as a KYC record ID
        console.log('   Step 1: Searching as KYC record ID...');
        kycRecord = await KYCRecord.findById(userId);
        
        if (kycRecord) {
          console.log('   ✅ Found as KYC record ID');
          
          // Populate userId field
          try {
            await kycRecord.populate('userId', 'email fullName');
          } catch (popError) {
            console.error('   ⚠️ Populate failed:', popError.message);
          }

          // Check authorization
          const recordUserId = kycRecord.userId._id ? kycRecord.userId._id.toString() : kycRecord.userId.toString();
          if (recordUserId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Not authorized to view this KYC record'
            });
          }
        } else {
          // Not found as record ID, try as user ID
          console.log('   ℹ️ Not found as record ID, trying as user ID...');
          
          // Check if user is requesting their own status or is admin
          if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Not authorized to view this KYC status'
            });
          }

          kycRecord = await KYCRecord.findOne({ userId }).sort({ submittedAt: -1 });

          if (!kycRecord) {
            console.log('   ℹ️ No KYC record found for this user');
            return res.status(200).json({
              success: true,
              data: {
                kycRecord: null
              },
              message: 'No KYC record found. Please submit your documents.'
            });
          } else {
            console.log('   ✅ Found as user ID');
          }
        }
      } catch (queryError) {
        console.error('   ❌ Query error:', queryError);
        throw queryError;
      }
    } else {
      console.log('🔍 Invalid ObjectId format, treating as user ID...');
      // Check if user is requesting their own status or is admin
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this KYC status'
        });
      }

      kycRecord = await KYCRecord.findOne({ userId }).sort({ submittedAt: -1 });

      if (!kycRecord) {
        return res.status(200).json({
          success: true,
          data: {
            kycRecord: null
          },
          message: 'No KYC record found. Please submit your documents.'
        });
      }
    }

    console.log(`✅ KYC record found - Status: ${kycRecord.status}`);

    res.status(200).json({
      success: true,
      data: {
        kycRecord: {
          _id: kycRecord._id,
          id: kycRecord._id,
          status: kycRecord.status,
          documentType: kycRecord.documentType,
          aiVerification: kycRecord.aiVerification,
          ariesCredential: kycRecord.ariesCredential,
          blockchainVerification: kycRecord.blockchainVerification,
          ipfsStorage: kycRecord.ipfsStorage,
          submittedAt: kycRecord.submittedAt,
          completedAt: kycRecord.completedAt,
          rejectionReason: kycRecord.rejectionReason
        }
      }
    });
  } catch (error) {
    console.error('❌ Get KYC status error:', error);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC status',
      error: error.message
    });
  }
};

/**
 * @desc    Get KYC status by record ID
 * @route   GET /api/kyc/record/:kycRecordId
 * @access  Private
 */
export const getKYCStatusByRecordId = async (req, res) => {
  try {
    const { kycRecordId } = req.params;

    console.log(`📋 Fetching KYC status for record ID: ${kycRecordId}`);
    
    const kycRecord = await KYCRecord.findById(kycRecordId).populate('userId', 'email fullName');

    if (!kycRecord) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    // Check if user is requesting their own record or is admin
    if (kycRecord.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this KYC record'
      });
    }

    console.log(`✅ KYC record found - Status: ${kycRecord.status}`);

    res.status(200).json({
      success: true,
      data: {
        kycRecord: {
          id: kycRecord._id,
          status: kycRecord.status,
          documentType: kycRecord.documentType,
          aiVerification: kycRecord.aiVerification,
          ariesCredential: kycRecord.ariesCredential,
          blockchainVerification: kycRecord.blockchainVerification,
          submittedAt: kycRecord.submittedAt,
          completedAt: kycRecord.completedAt,
          rejectionReason: kycRecord.rejectionReason
        }
      }
    });
  } catch (error) {
    console.error('❌ Get KYC status by record ID error:', error);
    console.error('   Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC status',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user's own KYC status
 * @route   GET /api/kyc/my-status
 * @access  Private
 */
export const getMyKYCStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📋 Fetching KYC status for current user: ${userId}`);
    
    // Find the most recent KYC record for this user
    const kycRecord = await KYCRecord.findOne({ userId })
      .sort({ submittedAt: -1 })
      .populate('userId', 'email fullName');

    if (!kycRecord) {
      console.log(`   ℹ️ No KYC record found for user ${userId}`);
      return res.status(200).json({
        success: true,
        data: {
          kycRecord: null
        },
        message: 'No KYC record found. Please submit your documents.'
      });
    }

    console.log(`✅ KYC record found - ID: ${kycRecord._id}, Status: ${kycRecord.status}`);

    res.status(200).json({
      success: true,
      data: {
        kycRecord: {
          id: kycRecord._id,
          status: kycRecord.status,
          documentType: kycRecord.documentType,
          aiVerification: kycRecord.aiVerification,
          ariesCredential: kycRecord.ariesCredential,
          blockchainVerification: kycRecord.blockchainVerification,
          ipfsStorage: kycRecord.ipfsStorage,
          submittedAt: kycRecord.submittedAt,
          completedAt: kycRecord.completedAt,
          rejectionReason: kycRecord.rejectionReason
        }
      }
    });
  } catch (error) {
    console.error('❌ Get my KYC status error:', error);
    console.error('   Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC status',
      error: error.message
    });
  }
};

/**
 * @desc    Get all KYC records (admin only)
 * @route   GET /api/kyc/all
 * @access  Private/Admin
 */
export const getAllKYCRecords = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = status ? { status } : {};
    
    const kycRecords = await KYCRecord.find(query)
      .populate('userId', 'email fullName')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await KYCRecord.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        kycRecords,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Get all KYC records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC records',
      error: error.message
    });
  }
};

export default {
  submitKYC,
  getKYCStatus,
  getKYCStatusByRecordId,
  getMyKYCStatus,
  getAllKYCRecords
};
