// 🔐 Cryptographic Hashing Utilities for Blockchain Security
import crypto from 'crypto';

/**
 * Generate SHA-256 hash of data
 * @param {String} data - Data to hash
 * @returns {String} - Hex hash
 */
export const sha256 = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate SHA-512 hash of data (stronger)
 * @param {String} data - Data to hash
 * @returns {String} - Hex hash
 */
export const sha512 = (data) => {
  return crypto.createHash('sha512').update(data).digest('hex');
};

/**
 * Hash sensitive document number
 * @param {String} documentNumber - Original document number
 * @param {String} documentType - Type of document
 * @returns {String} - Hashed document identifier
 */
export const hashDocumentNumber = (documentNumber, documentType) => {
  const combined = `${documentType}:${documentNumber}`;
  return sha256(combined);
};

/**
 * Hash user identifier for privacy
 * @param {String} userId - User ID
 * @returns {String} - Hashed user identifier
 */
export const hashUserId = (userId) => {
  return sha256(`user:${userId}`);
};

/**
 * Create verification hash for blockchain
 * @param {Object} data - Verification data
 * @returns {String} - Verification hash
 */
export const createVerificationHash = (data) => {
  const {
    userId,
    documentType,
    documentNumber,
    timestamp,
    aiConfidence,
    faceMatchScore,
    ipfsCIDs
  } = data;

  const hashData = {
    userHash: hashUserId(userId),
    docHash: hashDocumentNumber(documentNumber, documentType),
    documentType,
    timestamp: timestamp || Date.now(),
    aiConfidence: aiConfidence || 0,
    faceMatch: faceMatchScore || 0,
    ipfs: ipfsCIDs || {}
  };

  return sha256(JSON.stringify(hashData));
};

/**
 * Hash file content
 * @param {Buffer} fileBuffer - File buffer
 * @returns {String} - File hash
 */
export const hashFile = (fileBuffer) => {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

/**
 * Create Merkle root from multiple hashes
 * @param {Array} hashes - Array of hashes
 * @returns {String} - Merkle root hash
 */
export const createMerkleRoot = (hashes) => {
  if (!hashes || hashes.length === 0) return sha256('empty');
  if (hashes.length === 1) return hashes[0];

  const newLevel = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left; // Duplicate if odd number
    newLevel.push(sha256(left + right));
  }

  return createMerkleRoot(newLevel);
};

/**
 * Generate data integrity proof
 * @param {Object} data - Data object
 * @returns {Object} - Data with hash proof
 */
export const addIntegrityProof = (data) => {
  const dataString = JSON.stringify(data);
  const hash = sha256(dataString);
  const timestamp = Date.now();
  
  return {
    ...data,
    _proof: {
      hash,
      timestamp,
      algorithm: 'SHA-256'
    }
  };
};

/**
 * Verify data integrity
 * @param {Object} dataWithProof - Data with integrity proof
 * @returns {Boolean} - Whether data is valid
 */
export const verifyIntegrity = (dataWithProof) => {
  if (!dataWithProof._proof) return false;
  
  const { _proof, ...data } = dataWithProof;
  const dataString = JSON.stringify(data);
  const calculatedHash = sha256(dataString);
  
  return calculatedHash === _proof.hash;
};

/**
 * Hash sensitive PII data for storage
 * @param {String} data - Sensitive data
 * @param {String} salt - Salt for hashing
 * @returns {String} - Hashed data
 */
export const hashPII = (data, salt = process.env.HASH_SALT || 'bharosa-kyc-salt') => {
  return crypto.createHash('sha256').update(data + salt).digest('hex');
};

/**
 * Create blockchain transaction hash
 * @param {Object} transaction - Transaction data
 * @returns {String} - Transaction hash
 */
export const hashTransaction = (transaction) => {
  const txString = JSON.stringify({
    from: transaction.from,
    to: transaction.to,
    data: transaction.data,
    timestamp: transaction.timestamp,
    nonce: transaction.nonce || 0
  });
  
  return sha512(txString); // Use SHA-512 for transactions
};

export default {
  sha256,
  sha512,
  hashDocumentNumber,
  hashUserId,
  createVerificationHash,
  hashFile,
  createMerkleRoot,
  addIntegrityProof,
  verifyIntegrity,
  hashPII,
  hashTransaction
};
