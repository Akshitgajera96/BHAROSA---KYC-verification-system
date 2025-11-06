// 📄 KYC Document Upload Form
import React, { useState } from 'react';
import { submitKYC } from '../services/api';
import CameraCapture from './CameraCapture';

const KYCForm = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({
    documentType: 'aadhaar',
    documentNumber: '',
    documentImage: null,
    selfie: null
  });
  const [previews, setPreviews] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`${fieldName} must be an image file`);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${fieldName} must be less than 5MB`);
        return;
      }

      setFormData({
        ...formData,
        [fieldName]: file
      });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews({
          ...previews,
          [fieldName]: reader.result
        });
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleCameraCapture = (file) => {
    setFormData({
      ...formData,
      selfie: file
    });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews({
        ...previews,
        selfie: reader.result
      });
    };
    reader.readAsDataURL(file);
    setShowCamera(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Validate required fields
      if (!formData.documentNumber) {
        throw new Error('Document number is required');
      }
      if (!formData.documentImage) {
        throw new Error('Document image is required');
      }
      if (!formData.selfie) {
        throw new Error('Selfie is required');
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('documentType', formData.documentType);
      submitData.append('documentNumber', formData.documentNumber);
      
      // Add document images
      submitData.append('documentImages[front]', formData.documentImage);
      submitData.append('documentImages[selfie]', formData.selfie);

      console.log('📤 Submitting KYC documents...');
      
      const response = await submitKYC(submitData);
      
      console.log('✅ KYC submission successful:', response);
      setResult(response);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      console.error('❌ KYC submission error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result && result.success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">KYC Documents Submitted!</h3>
          <p className="text-gray-600 mb-6">
            Your documents are being verified. This process typically takes a few moments.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Status:</strong> {result.data?.status || 'Processing'}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              KYC Record ID: {result.data?.kycRecordId}
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/status'}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Check Verification Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Submit KYC Documents</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          📄 Upload any documents you want to verify. At least one document is required.
        </p>

        <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">Required</span>
            📝 Document Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="national_id">National ID</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Number</label>
              <input
                type="text"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleInputChange}
                placeholder="Enter document number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">Required</span>
            📸 Document Image
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-green-400">
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'documentImage')} className="hidden" id="documentImage" />
                <label htmlFor="documentImage" className="cursor-pointer block text-center">
                  {previews.documentImage ? <img src={previews.documentImage} alt="Document" className="max-h-24 mx-auto rounded" /> : <p className="text-xs text-gray-500 py-2">📁 Click to upload</p>}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Live Selfie *
          </label>
          
          {previews.selfie ? (
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <img src={previews.selfie} alt="Selfie" className="max-h-48 mx-auto rounded mb-4" />
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Retake Photo
                </button>
                <label
                  htmlFor="selfie"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm cursor-pointer flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload New
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'selfie')}
                  className="hidden"
                  id="selfie"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="w-full border-2 border-dashed border-primary-300 rounded-lg p-6 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <div className="py-4">
                  <svg className="mx-auto h-12 w-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="mt-2 text-base font-semibold text-gray-700">Take Live Selfie</p>
                  <p className="text-xs text-gray-500">Use your camera to capture a photo</p>
                </div>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'selfie')}
                  className="hidden"
                  id="selfieUpload"
                />
                <label htmlFor="selfieUpload" className="cursor-pointer">
                  <div className="py-6">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Upload from Device</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>


        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Submit for Verification'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By submitting, you agree to our verification process and data handling policy
        </p>
      </form>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default KYCForm;
