// ⏱️ Performance Monitoring Routes
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import performanceTracker from '../utils/performanceTracker.js';

const router = express.Router();

/**
 * @desc    Get recent performance logs
 * @route   GET /api/performance/logs
 * @access  Private/Admin
 */
router.get('/logs', protect, authorize('admin'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const logs = await performanceTracker.getRecentLogs(parseInt(limit));

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('❌ Failed to fetch performance logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance logs',
      error: error.message
    });
  }
});

/**
 * @desc    Get performance statistics
 * @route   GET /api/performance/stats
 * @access  Private/Admin
 */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await performanceTracker.getStatistics();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Failed to fetch performance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance statistics',
      error: error.message
    });
  }
});

/**
 * @desc    Get performance status for a specific KYC verification
 * @route   GET /api/performance/status/:kycRecordId
 * @access  Private
 */
router.get('/status/:kycRecordId', protect, async (req, res) => {
  try {
    const { kycRecordId } = req.params;
    const status = performanceTracker.getSessionStatus(kycRecordId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'No active performance tracking session found for this KYC record'
      });
    }

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Failed to fetch performance status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance status',
      error: error.message
    });
  }
});

export default router;
