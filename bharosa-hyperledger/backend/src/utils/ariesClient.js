// 🔗 Hyperledger Aries Client for Verifiable Credentials
import axios from 'axios';
import { ariesConfig } from '../config/aries.js';

const { agentUrl, adminApiKey } = ariesConfig;

// Create axios instance with default config
const ariesAPI = axios.create({
  baseURL: agentUrl,
  headers: {
    'X-API-Key': adminApiKey,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

/**
 * Check Aries agent health
 * @returns {Boolean} Health status
 */
export const checkAriesHealth = async () => {
  try {
    const response = await ariesAPI.get('/status');
    console.log('✅ Aries agent is healthy');
    return response.data;
  } catch (error) {
    console.error('❌ Aries agent health check failed:', error.message);
    return false;
  }
};

/**
 * Create a connection invitation
 * @returns {Object} Connection invitation
 */
export const createConnectionInvitation = async () => {
  try {
    const response = await ariesAPI.post('/connections/create-invitation');
    console.log('✅ Connection invitation created');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create connection invitation:', error.message);
    throw new Error(`Aries connection error: ${error.message}`);
  }
};

/**
 * Issue a verifiable credential for KYC
 * @param {String} connectionId - Connection ID with the holder
 * @param {Object} credentialData - KYC data to include in credential
 * @returns {Object} Credential exchange record
 */
export const issueKYCCredential = async (connectionId, credentialData) => {
  try {
    console.log('📜 Issuing KYC credential via Aries...');
    
    const credentialOffer = {
      connection_id: connectionId,
      schema_id: 'KYCSchema:1.0',  // Update with your actual schema
      cred_def_id: 'KYCCredDef:1.0',  // Update with your credential definition
      credential_preview: {
        '@type': 'issue-credential/2.0/credential-preview',
        attributes: [
          { name: 'fullName', value: credentialData.fullName },
          { name: 'documentType', value: credentialData.documentType },
          { name: 'documentNumber', value: credentialData.documentNumber },
          { name: 'verificationDate', value: new Date().toISOString() },
          { name: 'verificationStatus', value: 'verified' },
          { name: 'issuer', value: 'Bharosa KYC System' }
        ]
      }
    };

    const response = await ariesAPI.post('/issue-credential-2.0/send-offer', credentialOffer);
    
    console.log('✅ KYC credential issued successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to issue credential:', error.message);
    throw new Error(`Credential issuance failed: ${error.message}`);
  }
};

/**
 * Verify a proof presentation
 * @param {Object} proofRequest - Proof request parameters
 * @returns {Object} Proof verification result
 */
export const verifyProofPresentation = async (proofRequest) => {
  try {
    console.log('🔍 Verifying proof presentation...');
    
    const response = await ariesAPI.post('/present-proof-2.0/send-request', proofRequest);
    
    console.log('✅ Proof verification initiated');
    return response.data;
  } catch (error) {
    console.error('❌ Proof verification failed:', error.message);
    throw new Error(`Proof verification error: ${error.message}`);
  }
};

/**
 * Get credential exchange record by ID
 * @param {String} credentialExchangeId - Credential exchange ID
 * @returns {Object} Credential exchange record
 */
export const getCredentialExchangeRecord = async (credentialExchangeId) => {
  try {
    const response = await ariesAPI.get(`/issue-credential-2.0/records/${credentialExchangeId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get credential exchange record:', error.message);
    throw new Error(`Failed to retrieve credential record: ${error.message}`);
  }
};

/**
 * Create a DID for the issuer
 * @returns {Object} DID creation result
 */
export const createDID = async () => {
  try {
    const response = await ariesAPI.post('/wallet/did/create');
    console.log('✅ DID created successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create DID:', error.message);
    throw new Error(`DID creation failed: ${error.message}`);
  }
};

export default {
  checkAriesHealth,
  createConnectionInvitation,
  issueKYCCredential,
  verifyProofPresentation,
  getCredentialExchangeRecord,
  createDID
};
