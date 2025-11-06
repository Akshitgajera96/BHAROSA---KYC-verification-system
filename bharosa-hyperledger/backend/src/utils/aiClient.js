// 🧠 AI Service Client for Document Verification
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logAIRequest } from './debugLogger.js';
import crypto from 'crypto';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai_service:8000';

/**
 * Send documents to AI service for verification
 * @param {Object} documents - Document images (front, back, selfie)
 * @returns {Object} AI verification results
 */
export const verifyDocuments = async (documents, documentType = 'national_id', documentNumber = '', retryCount = 0) => {
  const requestId = crypto.randomBytes(16).toString('hex');
  const MAX_RETRIES = 2;
  
  try {
    console.log(`🧠 [${requestId}] Sending documents to AI service: ${AI_SERVICE_URL}/analyze`);
    console.log(`   Document Type: ${documentType}`);
    console.log(`   Documents object:`, documents);
    console.log(`   Retry attempt: ${retryCount}/${MAX_RETRIES}`);
    
    // Validate that documents exist before proceeding
    if (!documents.front) {
      throw new Error('Front document image path is missing');
    }
    if (!documents.selfie) {
      throw new Error('Selfie image path is missing');
    }
    
    // Check if files exist on filesystem
    if (!fs.existsSync(documents.front)) {
      throw new Error(`Front document image file not found at path: ${documents.front}`);
    }
    if (!fs.existsSync(documents.selfie)) {
      throw new Error(`Selfie image file not found at path: ${documents.selfie}`);
    }
    
    console.log(`   ✓ Front image exists: ${documents.front}`);
    console.log(`   ✓ Selfie exists: ${documents.selfie}`);
    if (documents.back) {
      console.log(`   ✓ Back image: ${documents.back}`);
    }
    
    const formData = new FormData();
    
    // Append document type (required by AI service)
    formData.append('document_type', documentType);
    console.log(`   Added document_type: ${documentType}`);
    
    // Append document number if provided
    if (documentNumber) {
      formData.append('document_number', documentNumber);
      console.log(`   Added document_number: ${documentNumber}`);
    }
    
    // Append front image as 'id_image' (required by AI service)
    const frontFilename = path.basename(documents.front);
    const frontExtension = path.extname(documents.front).toLowerCase();
    const frontMimeType = frontExtension === '.png' ? 'image/png' : 'image/jpeg';
    
    console.log(`   Adding id_image:`);
    console.log(`     - Path: ${documents.front}`);
    console.log(`     - Filename: ${frontFilename}`);
    console.log(`     - MIME Type: ${frontMimeType}`);
    
    formData.append('id_image', fs.createReadStream(documents.front), {
      filename: frontFilename,
      contentType: frontMimeType
    });
    
    // Append back image if provided (optional)
    if (documents.back && fs.existsSync(documents.back)) {
      const backFilename = path.basename(documents.back);
      const backExtension = path.extname(documents.back).toLowerCase();
      const backMimeType = backExtension === '.png' ? 'image/png' : 'image/jpeg';
      
      console.log(`   Adding document_back:`);
      console.log(`     - Path: ${documents.back}`);
      console.log(`     - Filename: ${backFilename}`);
      console.log(`     - MIME Type: ${backMimeType}`);
      
      formData.append('document_back', fs.createReadStream(documents.back), {
        filename: backFilename,
        contentType: backMimeType
      });
    }
    
    // Append selfie image (required by AI service)
    const selfieFilename = path.basename(documents.selfie);
    const selfieExtension = path.extname(documents.selfie).toLowerCase();
    const selfieMimeType = selfieExtension === '.png' ? 'image/png' : 'image/jpeg';
    
    console.log(`   Adding selfie:`);
    console.log(`     - Path: ${documents.selfie}`);
    console.log(`     - Filename: ${selfieFilename}`);
    console.log(`     - MIME Type: ${selfieMimeType}`);
    
    formData.append('selfie', fs.createReadStream(documents.selfie), {
      filename: selfieFilename,
      contentType: selfieMimeType
    });

    // Log the headers being sent
    const headers = formData.getHeaders();
    console.log(`   Request headers:`, headers);
    console.log(`   Making POST request to: ${AI_SERVICE_URL}/analyze`);
    
    // Send request to AI service with extended timeout
    // First request may take longer due to model downloads (5-10 minutes)
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
          // Do NOT set Content-Length manually - let axios calculate it automatically
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 600000, // 10 minutes timeout (for first-time model downloads)
        validateStatus: function (status) {
          return status < 500; // Resolve for any status code less than 500
        }
      }
    );
    
    // Check if response was successful
    if (response.status >= 400) {
      console.error(`❌ [${requestId}] AI service returned error status:`, response.status);
      console.error('   Response data:', JSON.stringify(response.data, null, 2));
      
      // Log debug information
      logAIRequest(requestId, {
        url: `${AI_SERVICE_URL}/analyze`,
        method: 'POST',
        headers: headers
      }, response, null);
      
      let errorMsg = 'AI service returned an error';
      if (response.data?.detail) {
        if (Array.isArray(response.data.detail)) {
          errorMsg = response.data.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
        } else {
          errorMsg = response.data.detail;
        }
      } else if (response.data?.error) {
        errorMsg = response.data.error;
      }
      
      throw new Error(`AI service error (${response.status}): ${errorMsg}`);
    }

    // Log successful request
    logAIRequest(requestId, {
      url: `${AI_SERVICE_URL}/analyze`,
      method: 'POST',
      headers: headers
    }, response, null);

    console.log(`✅ [${requestId}] AI verification completed`);
    console.log('   Status:', response.data.final_status);
    console.log('   Verified:', response.data.verified);
    console.log('   Confidence:', response.data.confidence);
    if (response.data.rejection_reasons && response.data.rejection_reasons.length > 0) {
      console.log('   Rejection reasons:', response.data.rejection_reasons);
    }
    
    // Transform response to match expected format
    return {
      verified: response.data.verified || false,
      confidenceScore: response.data.confidence || 0,
      faceMatchScore: response.data.face_match || 0,
      ocrData: {
        text: response.data.ocr_text || '',
        extractedData: response.data.extracted_data || {}
      },
      errors: response.data.rejection_reasons || []
    };
  } catch (error) {
    console.error(`❌ [${requestId}] AI Service Error:`, error.message);
    console.error('   Error Code:', error.code);
    
    // Log error for debugging
    logAIRequest(requestId, {
      url: `${AI_SERVICE_URL}/analyze`,
      method: 'POST',
      headers: {}
    }, error.response || null, error);
    
    // Handle connection errors with retry
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('   AI service is not reachable at:', AI_SERVICE_URL);
      
      // Retry for transient network errors
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Retrying AI request (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
        return verifyDocuments(documents, documentType, documentNumber, retryCount + 1);
      }
      
      throw new Error('AI service is not reachable after multiple attempts. Please ensure it is running.');
    }
    
    // Handle file not found errors
    if (error.code === 'ENOENT') {
      console.error('   File not found:', error.path);
      throw new Error(`Document file not found: ${error.path}`);
    }
    
    // Handle HTTP response errors
    if (error.response) {
      console.error('   Response Status:', error.response.status);
      console.error('   Response Data:', JSON.stringify(error.response.data, null, 2));
      
      // Extract detailed error message
      let errorMsg = 'Unknown error';
      
      if (typeof error.response.data === 'string') {
        errorMsg = error.response.data;
      } else if (error.response.data?.detail) {
        // FastAPI validation errors
        if (Array.isArray(error.response.data.detail)) {
          errorMsg = error.response.data.detail.map(e => {
            const field = e.loc?.join('.') || 'unknown';
            const message = e.msg || 'validation error';
            return `${field}: ${message}`;
          }).join(', ');
        } else {
          errorMsg = error.response.data.detail;
        }
      } else if (error.response.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response.statusText) {
        errorMsg = error.response.statusText;
      }
      
      console.error('   Extracted Error Message:', errorMsg);
      
      // Only retry on 5xx errors, not 4xx (client errors should not be retried)
      if (error.response.status >= 500 && retryCount < MAX_RETRIES) {
        console.log(`🔄 Retrying AI request after server error (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return verifyDocuments(documents, documentType, documentNumber, retryCount + 1);
      }
      
      throw new Error(`AI service error: ${errorMsg}`);
    }
    
    throw new Error(`Failed to verify documents: ${error.message}`);
  }
};

/**
 * Perform face matching between document and selfie
 * @param {String} documentImage - Path/URL to document photo
 * @param {String} selfieImage - Path/URL to selfie
 * @returns {Object} Face match results
 */
export const performFaceMatch = async (documentImage, selfieImage) => {
  try {
    console.log('👤 Performing face matching...');
    
    const response = await axios.post(`${AI_SERVICE_URL}/face-match`, {
      documentImage,
      selfieImage
    }, {
      timeout: 300000 // 5 minutes timeout for model downloads
    });

    return response.data;
  } catch (error) {
    console.error('❌ Face matching error:', error.message);
    throw new Error(`Face matching failed: ${error.message}`);
  }
};

/**
 * Extract text from document using OCR
 * @param {String} documentImage - Path/URL to document image
 * @returns {Object} Extracted text data
 */
export const extractDocumentText = async (documentImage) => {
  try {
    console.log('📝 Extracting text from document...');
    
    const response = await axios.post(`${AI_SERVICE_URL}/ocr`, {
      image: documentImage
    }, {
      timeout: 300000 // 5 minutes timeout for model processing
    });

    return response.data;
  } catch (error) {
    console.error('❌ OCR extraction error:', error.message);
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};

/**
 * Check AI service health
 * @returns {Boolean} Service health status
 */
export const checkAIServiceHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ AI service is healthy');
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('❌ AI service health check failed:', error.message);
    return false;
  }
};

export default {
  verifyDocuments,
  performFaceMatch,
  extractDocumentText,
  checkAIServiceHealth
};
