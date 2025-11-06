// 🔍 Debug Logger - Capture requests/responses for troubleshooting
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEBUG_ENABLED = process.env.DEBUG_LOGGING === 'true';
const DEBUG_DIR = path.join(__dirname, '../../../debug-logs');

// Ensure debug directory exists
if (DEBUG_ENABLED && !fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

/**
 * Redact sensitive information from logs
 */
const redactSensitive = (data) => {
  if (!data) return data;
  
  const sensitiveFields = ['password', 'token', 'api_key', 'authorization', 'secret'];
  const redacted = JSON.parse(JSON.stringify(data));
  
  const redactObject = (obj) => {
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redactObject(obj[key]);
      }
    }
  };
  
  if (typeof redacted === 'object') {
    redactObject(redacted);
  }
  
  return redacted;
};

/**
 * Log AI service request/response for debugging
 */
export const logAIRequest = (requestId, request, response, error = null) => {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const filename = `ai-request-${requestId}-${Date.now()}.json`;
  const filepath = path.join(DEBUG_DIR, filename);
  
  const logData = {
    timestamp,
    requestId,
    request: {
      url: request.url,
      method: request.method,
      headers: redactSensitive(request.headers),
      body: request.body ? '[FILE_UPLOAD]' : null
    },
    response: response ? {
      status: response.status,
      headers: redactSensitive(response.headers),
      data: redactSensitive(response.data)
    } : null,
    error: error ? {
      message: error.message,
      code: error.code,
      stack: error.stack
    } : null
  };
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));
    console.log(`🔍 Debug log saved: ${filename}`);
  } catch (err) {
    console.error('Failed to write debug log:', err.message);
  }
};

/**
 * Log KYC flow step
 */
export const logKYCStep = (kycRecordId, step, data) => {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const filename = `kyc-flow-${kycRecordId}.jsonl`;
  const filepath = path.join(DEBUG_DIR, filename);
  
  const logEntry = {
    timestamp,
    step,
    data: redactSensitive(data)
  };
  
  try {
    fs.appendFileSync(filepath, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error('Failed to write KYC flow log:', err.message);
  }
};

export default {
  logAIRequest,
  logKYCStep
};
