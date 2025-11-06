// 📦 IPFS Client - Decentralized Storage for KYC Documents
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// IPFS Configuration
const IPFS_PROVIDER = process.env.IPFS_PROVIDER || 'pinata'; // pinata, infura, or local
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_API_KEY;
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const INFURA_PROJECT_SECRET = process.env.INFURA_PROJECT_SECRET;
const LOCAL_IPFS_URL = process.env.LOCAL_IPFS_URL || 'http://127.0.0.1:5001';

// Fallback to centralized storage if IPFS fails
const ENABLE_IPFS = process.env.ENABLE_IPFS !== 'false';
const FALLBACK_TO_LOCAL = process.env.FALLBACK_TO_LOCAL !== 'false';

/**
 * Calculate SHA-256 hash of file
 */
const calculateFileHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

/**
 * Upload file to Pinata IPFS
 */
const uploadToPinata = async (filePath, metadata = {}) => {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API credentials not configured');
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  
  const pinataMetadata = JSON.stringify({
    name: metadata.filename || `bharosa-kyc-${Date.now()}`,
    keyvalues: {
      ...metadata,
      uploadedAt: new Date().toISOString()
    }
  });
  formData.append('pinataMetadata', pinataMetadata);
  
  const pinataOptions = JSON.stringify({
    cidVersion: 1
  });
  formData.append('pinataOptions', pinataOptions);

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    }
  );

  return {
    cid: response.data.IpfsHash,
    size: response.data.PinSize,
    timestamp: response.data.Timestamp
  };
};

/**
 * Upload file to Infura IPFS
 */
const uploadToInfura = async (filePath, metadata = {}) => {
  if (!INFURA_PROJECT_ID || !INFURA_PROJECT_SECRET) {
    throw new Error('Infura IPFS credentials not configured');
  }

  const auth = Buffer.from(
    `${INFURA_PROJECT_ID}:${INFURA_PROJECT_SECRET}`
  ).toString('base64');

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const response = await axios.post(
    'https://ipfs.infura.io:5001/api/v0/add',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Basic ${auth}`
      }
    }
  );

  return {
    cid: response.data.Hash,
    size: response.data.Size,
    timestamp: new Date().toISOString()
  };
};

/**
 * Upload file to local IPFS node
 */
const uploadToLocalIPFS = async (filePath, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const response = await axios.post(
    `${LOCAL_IPFS_URL}/api/v0/add`,
    formData,
    {
      headers: formData.getHeaders(),
      params: {
        'cid-version': 1,
        pin: true
      }
    }
  );

  return {
    cid: response.data.Hash,
    size: response.data.Size,
    timestamp: new Date().toISOString()
  };
};

/**
 * Upload file to IPFS based on configured provider
 * @param {String} filePath - Path to file to upload
 * @param {Object} metadata - Optional metadata about the file
 * @returns {Object} - IPFS upload result with CID
 */
export const uploadToIPFS = async (filePath, metadata = {}) => {
  if (!ENABLE_IPFS) {
    console.log('⚠️  IPFS disabled, skipping upload');
    return {
      cid: null,
      provider: 'disabled',
      fileHash: calculateFileHash(filePath),
      localPath: filePath
    };
  }

  try {
    console.log(`📦 Uploading to IPFS (${IPFS_PROVIDER})...`);
    
    // Calculate file hash before upload for verification
    const fileHash = calculateFileHash(filePath);
    console.log(`   File SHA-256: ${fileHash}`);

    let result;
    
    switch (IPFS_PROVIDER.toLowerCase()) {
      case 'pinata':
        result = await uploadToPinata(filePath, metadata);
        break;
      case 'infura':
        result = await uploadToInfura(filePath, metadata);
        break;
      case 'local':
        result = await uploadToLocalIPFS(filePath, metadata);
        break;
      default:
        throw new Error(`Unknown IPFS provider: ${IPFS_PROVIDER}`);
    }

    console.log(`✅ Uploaded to IPFS: ${result.cid}`);
    
    return {
      ...result,
      provider: IPFS_PROVIDER,
      fileHash,
      localPath: filePath
    };

  } catch (error) {
    console.error(`❌ IPFS upload failed (${IPFS_PROVIDER}):`, error.message);
    
    if (FALLBACK_TO_LOCAL) {
      console.log('⚠️  Falling back to centralized storage');
      return {
        cid: null,
        provider: 'fallback-local',
        fileHash: calculateFileHash(filePath),
        localPath: filePath,
        error: error.message
      };
    }
    
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple files to IPFS
 * @param {Array} filePaths - Array of file paths
 * @param {Object} metadata - Metadata for files
 * @returns {Array} - Array of upload results
 */
export const uploadMultipleToIPFS = async (filePaths, metadata = {}) => {
  const results = [];
  
  for (const filePath of filePaths) {
    try {
      const result = await uploadToIPFS(filePath, {
        ...metadata,
        filename: filePath.split(/[\\/]/).pop()
      });
      results.push({ filePath, success: true, ...result });
    } catch (error) {
      console.error(`Failed to upload ${filePath}:`, error.message);
      results.push({
        filePath,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * Retrieve file from IPFS via gateway
 * @param {String} cid - IPFS Content Identifier
 * @returns {String} - Gateway URL to access file
 */
export const getIPFSGatewayUrl = (cid) => {
  if (!cid) return null;
  
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`
  ];
  
  return gateways[0]; // Return primary gateway
};

/**
 * Verify IPFS CID exists and is accessible
 * @param {String} cid - IPFS Content Identifier
 * @returns {Boolean} - Whether CID is accessible
 */
export const verifyIPFSCID = async (cid) => {
  if (!cid) return false;
  
  try {
    const url = getIPFSGatewayUrl(cid);
    const response = await axios.head(url, { timeout: 10000 });
    return response.status === 200;
  } catch (error) {
    console.error(`Failed to verify IPFS CID ${cid}:`, error.message);
    return false;
  }
};

/**
 * Check if IPFS provider is available
 * @returns {Object} - Provider status and details
 */
export const checkIPFSStatus = async () => {
  if (!ENABLE_IPFS) {
    return {
      enabled: false,
      provider: 'disabled',
      available: false,
      message: 'IPFS is disabled via configuration'
    };
  }

  try {
    let testResult;
    
    switch (IPFS_PROVIDER.toLowerCase()) {
      case 'pinata':
        if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
          return {
            enabled: true,
            provider: 'pinata',
            available: false,
            message: 'Pinata credentials not configured'
          };
        }
        // Test Pinata authentication
        await axios.get('https://api.pinata.cloud/data/testAuthentication', {
          headers: {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY
          }
        });
        testResult = { available: true, message: 'Pinata connected successfully' };
        break;
        
      case 'infura':
        if (!INFURA_PROJECT_ID || !INFURA_PROJECT_SECRET) {
          return {
            enabled: true,
            provider: 'infura',
            available: false,
            message: 'Infura credentials not configured'
          };
        }
        testResult = { available: true, message: 'Infura configured' };
        break;
        
      case 'local':
        await axios.get(`${LOCAL_IPFS_URL}/api/v0/version`);
        testResult = { available: true, message: 'Local IPFS node accessible' };
        break;
        
      default:
        testResult = { available: false, message: 'Unknown IPFS provider' };
    }
    
    return {
      enabled: true,
      provider: IPFS_PROVIDER,
      ...testResult
    };
    
  } catch (error) {
    return {
      enabled: true,
      provider: IPFS_PROVIDER,
      available: false,
      message: error.message
    };
  }
};

export default {
  uploadToIPFS,
  uploadMultipleToIPFS,
  getIPFSGatewayUrl,
  verifyIPFSCID,
  checkIPFSStatus,
  calculateFileHash
};
