// 📄 KYC Routes
import express from 'express';
import { submitKYC, getKYCStatus, getKYCStatusByRecordId, getMyKYCStatus, getAllKYCRecords } from '../controllers/kycController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadKYCDocuments } from '../middleware/uploadMiddleware.js';
import { validateKYCSubmission, sanitizeFileMetadata } from '../middleware/validateKYC.js';

const router = express.Router();

// Protected routes with validation
router.post('/submit', 
  protect, 
  uploadKYCDocuments, 
  sanitizeFileMetadata,
  validateKYCSubmission, 
  submitKYC
);

// Get current user's KYC status (no ID needed)
router.get('/my-status', protect, getMyKYCStatus);

// Get KYC status by user ID or record ID
router.get('/status/:userId', protect, getKYCStatus);
router.get('/record/:kycRecordId', protect, getKYCStatusByRecordId);

// Admin only routes
router.get('/all', protect, authorize('admin'), getAllKYCRecords);

export default router;
