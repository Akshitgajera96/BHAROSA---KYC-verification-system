// 📸 Camera Capture Component
import React, { useState, useRef, useEffect } from 'react';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' = front camera, 'environment' = back camera

  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check your permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        onCapture(file);
        stopCamera();
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.95);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture Live Selfie
          </h3>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-gray-900">
          {error ? (
            <div className="aspect-video flex items-center justify-center p-8">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-white text-sm">{error}</p>
                <button
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover"
              />
              
              {/* Camera Overlay Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border-4 border-white border-opacity-50 rounded-full w-64 h-64 sm:w-80 sm:h-80"></div>
              </div>
              
              {/* Instruction Text */}
              <div className="absolute top-4 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black bg-opacity-50 inline-block px-4 py-2 rounded-full">
                  Position your face within the circle
                </p>
              </div>
            </>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="bg-gray-100 px-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            {/* Switch Camera Button */}
            <button
              type="button"
              onClick={switchCamera}
              disabled={!stream || isCapturing}
              className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Switch Camera"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Capture Button */}
            <button
              type="button"
              onClick={capturePhoto}
              disabled={!stream || isCapturing}
              className="w-16 h-16 bg-primary-600 rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              title="Capture Photo"
            >
              {isCapturing ? (
                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <div className="w-12 h-12 bg-white rounded-full"></div>
              )}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
              title="Cancel"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            Make sure your face is clearly visible and well-lit
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
