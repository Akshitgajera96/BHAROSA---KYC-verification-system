// ⛓️ Blockchain Routes
import express from 'express';
import {
  registerVerification,
  checkVerification,
  getVerificationInfo,
  saveBlockchainConfig,
  getBlockchainConfig,
  healthCheck
} from '../controllers/blockchainController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/verify/:userId', checkVerification);
router.get('/details/:verificationHash', getVerificationInfo);
router.get('/health', healthCheck);

// Protected routes
router.post('/register', protect, registerVerification);

// Admin only routes
router.post('/settings', protect, authorize('admin'), saveBlockchainConfig);
router.get('/settings', protect, authorize('admin'), getBlockchainConfig);

export default router;
