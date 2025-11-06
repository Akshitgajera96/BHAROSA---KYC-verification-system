/**
 * Dummy AI Verification Module
 * For testing purposes only - simulates AI verification without actual AI processing
 * 
 * TODO: Replace this dummy AI verification with real AI model integration later
 */

/**
 * Perform dummy AI verification (always returns success)
 * @param {Object} documentImages - Object with paths to document images
 * @param {string} documentType - Type of document (aadhaar, pan, passport, etc.)
 * @param {string} documentNumber - Document number for reference
 * @returns {Promise<Object>} Verification result object
 */
export const performDummyAIVerification = async (documentImages, documentType, documentNumber) => {
  console.log('🤖 Starting dummy AI verification...');
  console.log(`   Document Type: ${documentType}`);
  console.log(`   Document Number: ${documentNumber}`);
  console.log(`   Files: ${Object.keys(documentImages).join(', ')}`);

  // Simulate AI processing delay (2.5 seconds)
  const processingTime = 2500;
  await new Promise(resolve => setTimeout(resolve, processingTime));

  // Return successful verification result with dummy data
  // NOTE: Scores are in decimal format (0-1) to match real AI service output
  const result = {
    verified: true,
    success: true,
    message: 'AI Verification Passed (Dummy Mode)',
    confidenceScore: 0.955,  // Changed from 95.5 to 0.955 (decimal format)
    faceMatchScore: 0.923,   // Changed from 92.3 to 0.923 (decimal format)
    ocrData: {
      documentType,
      documentNumber,
      name: 'Test User',
      extractedAt: new Date().toISOString(),
      dummy: true
    },
    checks: {
      qualityCheck: { passed: true, score: 0.940 },      // Changed to decimal
      tamperingDetection: { passed: true, score: 0.985 }, // Changed to decimal
      faceMatching: { passed: true, score: 0.923 },       // Changed to decimal
      ocrExtraction: { passed: true, score: 0.960 },      // Changed to decimal
      documentValidation: { passed: true, score: 0.950 }  // Changed to decimal
    },
    errors: [],
    warnings: ['This is a dummy verification for testing only'],
    processingTime: Math.round(processingTime),
    isDummy: true,
    timestamp: new Date().toISOString()
  };

  console.log('✅ AI Verification (Dummy) done successfully!');
  console.log(`   Confidence Score: ${(result.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   Face Match Score: ${(result.faceMatchScore * 100).toFixed(1)}%`);
  console.log(`   Processing Time: ${result.processingTime}ms`);

  return result;
};

/**
 * Get dummy verification status
 * @returns {boolean} True if dummy mode is enabled
 */
export const isDummyModeEnabled = () => {
  const dummyMode = process.env.DUMMY_AI_VERIFICATION;
  return dummyMode === 'true' || dummyMode === '1' || dummyMode === 'yes';
};

/**
 * Log dummy mode status
 */
export const logDummyModeStatus = () => {
  if (isDummyModeEnabled()) {
    console.log('🧪 ========================================');
    console.log('🧪 DUMMY AI VERIFICATION MODE: ENABLED');
    console.log('🧪 All KYC submissions will use dummy AI');
    console.log('🧪 Set DUMMY_AI_VERIFICATION=false to disable');
    console.log('🧪 ========================================');
  } else {
    console.log('🧠 Real AI Verification Mode: ENABLED');
  }
};

export default {
  performDummyAIVerification,
  isDummyModeEnabled,
  logDummyModeStatus
};
