// ✅ KYC Validation Middleware - Strict payload validation
import path from 'path';

/**
 * Validation rules for document types
 */
const DOCUMENT_RULES = {
  aadhaar: {
    numberPattern: /^\d{12}$/,
    requiredFields: ['front', 'selfie'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png']
  },
  pan: {
    numberPattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    requiredFields: ['front', 'selfie'],
    maxFileSize: 5 * 1024 * 1024,
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png']
  },
  passport: {
    numberPattern: /^[A-Z]{1}[0-9]{7}$/,
    requiredFields: ['front', 'back', 'selfie'],
    maxFileSize: 5 * 1024 * 1024,
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png']
  },
  driving_license: {
    numberPattern: /^[A-Z]{2}[0-9]{13}$/,
    requiredFields: ['front', 'back', 'selfie'],
    maxFileSize: 5 * 1024 * 1024,
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png']
  },
  national_id: {
    numberPattern: /^[A-Z0-9]{6,20}$/,
    requiredFields: ['front', 'selfie'],
    maxFileSize: 5 * 1024 * 1024,
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png']
  }
};

/**
 * Validate KYC submission payload
 */
export const validateKYCSubmission = (req, res, next) => {
  try {
    const { documentType, documentNumber } = req.body;
    const files = req.files;

    // Log incoming request for debugging
    console.log('🔍 KYC Validation Debug:', {
      documentType,
      documentNumber: documentNumber ? `${documentNumber.substring(0, 4)}***` : 'missing',
      filesUploaded: files ? Object.keys(files) : 'none',
      bodyKeys: Object.keys(req.body)
    });

    // Validation 1: Check required fields
    if (!documentType) {
      console.log('❌ Validation failed: documentType is required');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['documentType is required']
      });
    }

    if (!documentNumber) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['documentNumber is required']
      });
    }

    // Validation 2: Check document type validity
    const validTypes = Object.keys(DOCUMENT_RULES);
    if (!validTypes.includes(documentType)) {
      console.log(`❌ Validation failed: Invalid documentType "${documentType}"`);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [`Invalid documentType "${documentType}". Must be one of: ${validTypes.join(', ')}`]
      });
    }

    const rules = DOCUMENT_RULES[documentType];

    // Validation 3: Validate document number format
    if (!rules.numberPattern.test(documentNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [`Invalid ${documentType} number format`]
      });
    }

    // Validation 4: Check file uploads
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['No files uploaded']
      });
    }

    const errors = [];

    // Validation 5: Check required files
    for (const field of rules.requiredFields) {
      const fileKey = `documentImages[${field}]`;
      if (!files[fileKey] || files[fileKey].length === 0) {
        errors.push(`${field} image is required for ${documentType}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Validation 6: Check file sizes and formats
    for (const [key, fileArray] of Object.entries(files)) {
      const file = fileArray[0];

      // Check file size
      if (file.size > rules.maxFileSize) {
        errors.push(`${key} exceeds maximum size of ${rules.maxFileSize / 1024 / 1024}MB`);
      }

      // Check file format
      if (!rules.allowedFormats.includes(file.mimetype)) {
        errors.push(`${key} must be in one of these formats: ${rules.allowedFormats.join(', ')}`);
      }

      // Check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png'];
      if (!validExtensions.includes(ext)) {
        errors.push(`${key} has invalid extension. Must be .jpg, .jpeg, or .png`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors
      });
    }

    // All validations passed
    console.log('✅ KYC submission validation passed');
    next();

  } catch (error) {
    console.error('❌ Validation middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      errors: [error.message]
    });
  }
};

/**
 * Sanitize file metadata
 */
export const sanitizeFileMetadata = (req, res, next) => {
  if (req.files) {
    for (const [key, fileArray] of Object.entries(req.files)) {
      fileArray.forEach(file => {
        // Remove potentially dangerous characters from filename
        file.originalname = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '');
      });
    }
  }
  next();
};

export default {
  validateKYCSubmission,
  sanitizeFileMetadata
};
