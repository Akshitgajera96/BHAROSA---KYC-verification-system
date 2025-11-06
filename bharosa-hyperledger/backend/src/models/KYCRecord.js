// 📄 KYC Record Model
import mongoose from 'mongoose';

const kycRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    enum: ['passport', 'driving_license', 'national_id', 'aadhaar'],
    required: true
  },
  documentNumber: {
    type: String,
    required: true
  },
  documentNumberHash: {
    type: String,
    index: true
  },
  userIdHash: {
    type: String,
    index: true
  },
  fileHashes: {
    front: String,
    back: String,
    selfie: String
  },
  merkleRoot: {
    type: String,
    index: true
  },
  documentImages: {
    front: String,
    back: String,
    selfie: String
  },
  ipfsStorage: {
    enabled: { type: Boolean, default: false },
    frontCID: String,
    backCID: String,
    selfieCID: String,
    frontHash: String,
    backHash: String,
    selfieHash: String,
    provider: String,
    uploadedAt: Date,
    gatewayUrls: {
      front: String,
      back: String,
      selfie: String
    }
  },
  aiVerification: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'verified', 'failed'],
      default: 'pending'
    },
    confidenceScore: Number,
    faceMatchScore: Number,
    ocrData: Object,
    verifiedAt: Date,
    errors: [String],
    // Real-time step tracking
    steps: {
      qualityCheck: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      tamperingDetection: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      ocrExtraction: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      documentValidation: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      faceMatching: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      finalDecision: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      }
    }
  },
  ariesCredential: {
    credentialId: String,
    credentialExchangeId: String,
    issuedAt: Date,
    credentialData: Object
  },
  blockchainVerification: {
    transactionHash: String,
    blockNumber: Number,
    verificationHash: String,
    registeredAt: Date,
    contractAddress: String
  },
  status: {
    type: String,
    enum: ['submitted', 'ai_processing', 'ai_verified', 'credential_issued', 'blockchain_registered', 'completed', 'rejected'],
    default: 'submitted'
  },
  rejectionReason: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: Object
  }
});

// Index for faster queries
kycRecordSchema.index({ userId: 1, status: 1 });
kycRecordSchema.index({ 'ariesCredential.credentialId': 1 });
kycRecordSchema.index({ 'blockchainVerification.transactionHash': 1 });

const KYCRecord = mongoose.model('KYCRecord', kycRecordSchema);

export default KYCRecord;
