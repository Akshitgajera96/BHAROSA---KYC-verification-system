// ✅ Verification Status Component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getKYCStatus, getStoredUser } from '../services/api';
import VerificationCertificate from './VerificationCertificate';

// Helper function to format rejection messages for user display
const formatRejectionMessage = (message) => {
  if (!message) return 'Verification failed. Please try again with clearer documents.';
  
  // Convert technical errors to user-friendly messages
  if (message.includes('Bad Request') || message.includes('AI service error')) {
    return 'Document verification failed. Please ensure your images are clear and in the correct format (JPEG/PNG).';
  }
  
  if (message.includes('Face not detected')) {
    return 'Unable to detect a face in your document or selfie. Please upload clear photos showing your face.';
  }
  
  if (message.includes('Face matching failed')) {
    return 'The face in your document does not match your selfie. Please ensure both images show the same person clearly.';
  }
  
  if (message.includes('OCR') || message.includes('text extraction')) {
    return 'Unable to read text from your document. Please upload a clearer image with readable text.';
  }
  
  if (message.includes('quality')) {
    return 'Document image quality is too low. Please upload a higher quality, non-blurry image.';
  }
  
  if (message.includes('tampering')) {
    return 'Document appears to be edited or tampered. Please upload an original, unmodified document image.';
  }
  
  // Return cleaned message if no specific match
  return message.replace(/AI service error:/gi, '').replace(/AI verification error:/gi, '').trim();
};

// Helper function to format individual error messages
const formatErrorMessage = (error) => {
  if (!error) return 'Unknown error occurred';
  
  // Convert error codes or technical messages to user-friendly text
  const errorMappings = {
    'Bad Request': 'Invalid image format or corrupted file',
    'ECONNREFUSED': 'Service temporarily unavailable',
    'Face not detected': 'No face visible in the image',
    'low confidence': 'Document text is unclear',
    'blur': 'Image is too blurry',
    'quality check failed': 'Image quality is insufficient'
  };
  
  for (const [tech, friendly] of Object.entries(errorMappings)) {
    if (error.toLowerCase().includes(tech.toLowerCase())) {
      return friendly;
    }
  }
  
  return error;
};

const VerificationStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);
  
  // Memoize user to prevent recreating on every render
  const user = React.useMemo(() => getStoredUser(), []);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await getKYCStatus(user.id);
      // Handle both response.data.kycRecord and response.kycRecord formats
      const kycRecord = response.data?.kycRecord || response.kycRecord || response.data?.data?.kycRecord;
      setStatus(kycRecord);
      setError(null);
      
      // Stop auto-refresh if status is terminal (completed or rejected)
      if (kycRecord && (kycRecord.status === 'completed' || kycRecord.status === 'rejected')) {
        setAutoRefresh(false);
      }
    } catch (err) {
      // Handle 404 - record not found (stop polling)
      if (err.response?.status === 404) {
        setAutoRefresh(false);
        setError('No KYC record found. Please submit your documents first.');
        setStatus(null);
      } else {
        // Only log errors that are not expected
        if (err.response?.status !== 404) {
          console.error('Error fetching KYC status:', err.message);
        }
        setError(err.response?.data?.message || err.message || 'Failed to fetch status');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('🧹 Cleaning up polling interval');
    }

    // Fetch immediately on mount or when autoRefresh changes
    fetchStatus();

    // Only set up polling if autoRefresh is true
    if (autoRefresh) {
      console.log('🔄 Starting polling (every 3 seconds)');
      intervalRef.current = setInterval(() => {
        fetchStatus();
      }, 3000);
    } else {
      console.log('⏹️ Polling stopped');
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchStatus]);

  const handleStopPolling = useCallback(() => {
    console.log('🛑 User clicked Stop Polling');
    setAutoRefresh(false);
  }, []);

  const handleStartPolling = useCallback(() => {
    console.log('▶️ User clicked Start Polling');
    setAutoRefresh(true);
  }, []);

  const getStatusColor = (statusValue) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      ai_processing: 'bg-yellow-100 text-yellow-800',
      ai_verified: 'bg-green-100 text-green-800',
      credential_issued: 'bg-purple-100 text-purple-800',
      blockchain_registered: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[statusValue] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (statusValue) => {
    if (statusValue === 'completed') {
      return (
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (statusValue === 'rejected') {
      return (
        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="animate-spin w-12 h-12 text-blue-600" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No KYC Submission Found</h3>
          <p className="text-yellow-700">You haven't submitted your KYC documents yet.</p>
          <button
            onClick={() => window.location.href = '/kyc'}
            className="mt-4 bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
          >
            Submit KYC Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Status Header */}
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon(status.status)}
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">KYC Verification Status</h2>
        <div className="flex flex-col items-center space-y-3">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(status.status)}`}>
            {status.status.replace(/_/g, ' ').toUpperCase()}
          </span>
          
          {/* Auto-refresh controls */}
          <div className="flex items-center space-x-3">
            {autoRefresh ? (
              <button
                onClick={handleStopPolling}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <span>Stop Polling</span>
              </button>
            ) : (
              <button
                onClick={handleStartPolling}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Start Polling</span>
              </button>
            )}
            
            {autoRefresh && (
              <span className="flex items-center text-xs text-gray-600">
                <svg className="animate-spin w-4 h-4 mr-1" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Auto-refreshing...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Verification Progress</h3>
        <div className="space-y-4">
          {/* Submitted */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Documents Submitted</p>
              <p className="text-xs text-gray-500">{new Date(status.submittedAt).toLocaleString()}</p>
            </div>
          </div>

          {/* AI Verification with Detailed Steps */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status.aiVerification?.status === 'verified' ? 'bg-green-500' : 
                status.aiVerification?.status === 'processing' || status.status === 'ai_processing' ? 'bg-yellow-500' :
                status.aiVerification?.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
              }`}>
                {status.aiVerification?.status === 'verified' ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (status.aiVerification?.status === 'processing' || status.status === 'ai_processing') ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : status.aiVerification?.status === 'failed' ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                )}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-900">AI Verification</p>
              
              {/* Show detailed steps when processing */}
              {(status.aiVerification?.status === 'processing' || status.status === 'ai_processing') && (
                <div className="mt-3 space-y-2 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">🔄 AI Processing Steps:</p>
                  
                  {/* Step 1: Quality Check */}
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex-shrink-0">
                      {status.aiVerification?.steps?.qualityCheck === 'completed' ? (
                        <svg className="text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700">1. Quality Check</span>
                  </div>
                  
                  {/* Step 2: Tampering Detection */}
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex-shrink-0">
                      {status.aiVerification?.steps?.tamperingDetection === 'completed' ? (
                        <svg className="text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : status.aiVerification?.steps?.qualityCheck === 'completed' ? (
                        <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700">2. Tampering Detection</span>
                  </div>
                  
                  {/* Step 3: OCR Extraction */}
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex-shrink-0">
                      {status.aiVerification?.steps?.ocrExtraction === 'completed' ? (
                        <svg className="text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : status.aiVerification?.steps?.tamperingDetection === 'completed' ? (
                        <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700">3. Text Extraction (OCR)</span>
                  </div>
                  
                  {/* Step 4: Document Validation */}
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex-shrink-0">
                      {status.aiVerification?.steps?.documentValidation === 'completed' ? (
                        <svg className="text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : status.aiVerification?.steps?.ocrExtraction === 'completed' ? (
                        <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700">4. Document Validation</span>
                  </div>
                  
                  {/* Step 5: Face Matching */}
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex-shrink-0">
                      {status.aiVerification?.steps?.faceMatching === 'completed' ? (
                        <svg className="text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : status.aiVerification?.steps?.documentValidation === 'completed' ? (
                        <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700">5. Face Matching (may take 1-2 min first time)</span>
                  </div>
                  
                  {/* Step 6: Final Decision */}
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex-shrink-0">
                      {status.aiVerification?.steps?.finalDecision === 'completed' ? (
                        <svg className="text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : status.aiVerification?.steps?.faceMatching === 'completed' ? (
                        <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700">6. Final Decision</span>
                  </div>
                  
                  <p className="text-xs text-yellow-700 mt-2 italic">
                    ⏱️ First-time verification may take 2-3 minutes (downloading AI models)
                  </p>
                </div>
              )}
              
              {/* Show results when verified */}
              {status.aiVerification?.status === 'verified' && (
                <div className="mt-1">
                  <p className="text-xs text-green-600">✓ Verified</p>
                  {status.aiVerification.confidenceScore && (
                    <p className="text-xs text-gray-500">
                      Confidence: {(status.aiVerification.confidenceScore * 100).toFixed(1)}%
                    </p>
                  )}
                  {status.aiVerification.faceMatchScore && (
                    <p className="text-xs text-gray-500">
                      Face Match: {(status.aiVerification.faceMatchScore * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              )}
              
              {/* Show failure */}
              {status.aiVerification?.status === 'failed' && (
                <p className="text-xs text-red-600 mt-1">✗ Failed</p>
              )}
            </div>
          </div>

          {/* Credential Issued */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status.ariesCredential?.credentialId ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {status.ariesCredential?.credentialId ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                )}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Verifiable Credential Issued</p>
              {status.ariesCredential?.issuedAt && (
                <p className="text-xs text-gray-500">{new Date(status.ariesCredential.issuedAt).toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Blockchain Registration */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status.blockchainVerification?.transactionHash ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {status.blockchainVerification?.transactionHash ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                )}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Blockchain Registration</p>
              {status.blockchainVerification?.transactionHash && (
                <div className="mt-1">
                  <p className="text-xs text-green-600">✓ Registered</p>
                  <p className="text-xs text-gray-500 font-mono">{status.blockchainVerification.transactionHash.substring(0, 20)}...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Verification Certificate - Replaces old blockchain details section */}
      {status.status === 'completed' && status.blockchainVerification?.transactionHash && (
        <VerificationCertificate kycRecord={status} user={user} />
      )}

      {/* Rejection Reason */}
      {status.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Verification Rejected</h3>
          <p className="text-red-700 mb-3">{formatRejectionMessage(status.rejectionReason)}</p>
          
          {/* Show AI verification errors if available */}
          {status.aiVerification?.errors && status.aiVerification.errors.length > 0 && (
            <div className="mt-3 bg-red-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">Verification Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {status.aiVerification.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">{formatErrorMessage(error)}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Troubleshooting tips */}
          <div className="mt-4 bg-white rounded-lg p-4 border border-red-200">
            <p className="text-sm font-semibold text-gray-800 mb-2">💡 Tips for successful verification:</p>
            <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
              <li>Ensure your document image is clear and well-lit</li>
              <li>Make sure all text on the document is readable</li>
              <li>Take the selfie in good lighting with your face clearly visible</li>
              <li>Ensure the document and selfie show the same person</li>
              <li>Document should not be blurry, cropped, or edited</li>
              <li>Upload images in JPEG or PNG format</li>
              <li>Make sure file size is under 5MB</li>
            </ul>
          </div>
          
          <button
            onClick={() => window.location.href = '/kyc'}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Resubmit Documents
          </button>
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;
