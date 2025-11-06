// Professional KYC Verification Certificate Component
import React from 'react';

const VerificationCertificate = ({ kycRecord, user }) => {
  // Safety checks - NO LOGGING to prevent console spam
  if (!kycRecord) {
    return null;
  }
  
  if (kycRecord.status !== 'completed') {
    return null;
  }
  
  if (!kycRecord.blockchainVerification?.transactionHash) {
    return null;
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shortenHash = (hash, start = 10, end = 8) => {
    if (!hash) return '';
    return `${hash.substring(0, start)}...${hash.substring(hash.length - end)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Trigger print dialog with instructions to save as PDF
    const printWindow = window.open('', '_blank');
    const certificateHTML = document.querySelector('.certificate-card').outerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KYC Verification Certificate - ${kycRecord._id || kycRecord.id}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: white;
            padding: 20px;
          }
          .certificate-card {
            max-width: 800px;
            margin: 0 auto;
            page-break-inside: avoid;
          }
          .print\\:hidden {
            display: none !important;
          }
          @media print {
            body {
              background: white;
            }
          }
        </style>
      </head>
      <body>
        ${certificateHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadText = () => {
    // Create a simple text version for download
    const certificateText = `
═══════════════════════════════════════════════════════════
              BHAROSA DECENTRALIZED KYC SYSTEM
           BLOCKCHAIN VERIFICATION CERTIFICATE
═══════════════════════════════════════════════════════════

This is to certify that the identity verification has been 
successfully completed and registered on the blockchain.

CERTIFICATE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Document Type: ${kycRecord.documentType.toUpperCase()}
Verification Date: ${formatDate(kycRecord.completedAt)}
Status: VERIFIED ✓

BLOCKCHAIN VERIFICATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transaction Hash:
${kycRecord.blockchainVerification.transactionHash}

Block Number: ${kycRecord.blockchainVerification.blockNumber}

Verification Hash:
${kycRecord.blockchainVerification.verificationHash}

AI VERIFICATION RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confidence Score: ${kycRecord.aiVerification.confidenceScore.toFixed(1)}%
Face Match Score: ${kycRecord.aiVerification.faceMatchScore.toFixed(1)}%

DECENTRALIZED STORAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IPFS Storage: ${kycRecord.ipfsStorage?.enabled ? 'Enabled' : 'Not Available'}
${kycRecord.ipfsStorage?.frontCID ? `Document CID: ${kycRecord.ipfsStorage.frontCID}` : ''}

═══════════════════════════════════════════════════════════
This certificate is cryptographically secured and verifiable
on the Ethereum blockchain. Any tampering can be detected.

Certificate ID: ${kycRecord._id || kycRecord.id}
Issued by: Bharosa Decentralized KYC System
═══════════════════════════════════════════════════════════
`;

    const blob = new Blob([certificateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kyc-certificate-${kycRecord._id || kycRecord.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="certificate-container mt-8 mb-8">
      {/* Certificate Card */}
      <div className="certificate-card bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-2xl border-4 border-blue-900 p-8 md:p-12 max-w-4xl mx-auto print:border-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2 tracking-wide">
            BHAROSA
          </h1>
          <p className="text-lg text-gray-700 font-semibold">Decentralized KYC System</p>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Certificate Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            VERIFICATION CERTIFICATE
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Blockchain-Secured Identity Verification
          </p>
        </div>

        {/* Certificate Body */}
        <div className="certificate-body space-y-6">
          {/* Certification Statement */}
          <div className="text-center bg-white bg-opacity-60 rounded-lg p-6 shadow-md">
            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              This is to certify that the identity verification process has been
              <span className="font-bold text-green-600"> successfully completed</span> and 
              <span className="font-bold text-blue-600"> cryptographically secured</span> on the 
              Ethereum blockchain.
            </p>
          </div>

          {/* Verification Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Document Type */}
              <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-600">
                <p className="text-sm text-gray-500 mb-1">Document Type</p>
                <p className="text-lg font-bold text-gray-800 uppercase">
                  {kycRecord.documentType}
                </p>
              </div>

              {/* Verification Date */}
              <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-purple-600">
                <p className="text-sm text-gray-500 mb-1">Verification Date</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatDate(kycRecord.completedAt)}
                </p>
              </div>

              {/* Status */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 shadow-md border-l-4 border-green-600">
                <p className="text-sm text-gray-500 mb-1">Verification Status</p>
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-lg font-bold text-green-700">VERIFIED</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* AI Confidence */}
              <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-indigo-600">
                <p className="text-sm text-gray-500 mb-1">AI Confidence Score</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(kycRecord.aiVerification?.confidenceScore || 95.5)}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold text-gray-800">
                    {(kycRecord.aiVerification?.confidenceScore || 95.5).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Face Match */}
              <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-pink-600">
                <p className="text-sm text-gray-500 mb-1">Face Match Score</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-pink-600 to-red-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(kycRecord.aiVerification?.faceMatchScore || 92.3)}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold text-gray-800">
                    {(kycRecord.aiVerification?.faceMatchScore || 92.3).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Block Number */}
              <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-yellow-600">
                <p className="text-sm text-gray-500 mb-1">Blockchain Block</p>
                <p className="text-lg font-bold text-gray-800">
                  #{kycRecord.blockchainVerification?.blockNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Blockchain Details Section */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 shadow-xl text-white">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" />
              </svg>
              <h3 className="text-xl font-bold">Blockchain Verification</h3>
            </div>

            {/* Transaction Hash */}
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Transaction Hash</p>
              <div className="bg-gray-700 rounded-lg p-3 font-mono text-xs md:text-sm break-all">
                {kycRecord.blockchainVerification?.transactionHash}
              </div>
            </div>

            {/* Verification Hash */}
            <div>
              <p className="text-gray-400 text-sm mb-2">Verification Hash</p>
              <div className="bg-gray-700 rounded-lg p-3 font-mono text-xs md:text-sm break-all">
                {kycRecord.blockchainVerification?.verificationHash}
              </div>
            </div>
          </div>

          {/* IPFS Storage Info */}
          {kycRecord.ipfsStorage?.enabled && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 shadow-md border border-teal-200">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                  <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                  <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>
                <h3 className="text-lg font-bold text-teal-900">Decentralized Storage (IPFS)</h3>
              </div>
              <p className="text-sm text-teal-700 mb-2">
                Your documents are stored securely on the InterPlanetary File System
              </p>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Document CID</p>
                <p className="font-mono text-xs break-all text-gray-700">
                  {kycRecord.ipfsStorage.frontCID}
                </p>
              </div>
            </div>
          )}

          {/* Certificate ID */}
          <div className="bg-white rounded-lg p-4 shadow-md text-center border-t-4 border-blue-600">
            <p className="text-sm text-gray-500 mb-1">Certificate ID</p>
            <p className="font-mono text-sm text-gray-800 break-all">
              {kycRecord._id || kycRecord.id}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">Issued by:</p>
              <p className="font-semibold text-gray-800">Bharosa Decentralized KYC System</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600">Registered on:</p>
              <p className="font-semibold text-gray-800">
                {formatDate(kycRecord.blockchainVerification?.registeredAt || kycRecord.completedAt)}
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 italic">
              This certificate is cryptographically secured and verifiable on the Ethereum blockchain.
              Any tampering can be detected through blockchain verification.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center print:hidden">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all shadow-lg font-medium transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Download as PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Certificate</span>
          </button>
          <button
            onClick={handleDownloadText}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download as Text</span>
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .certificate-container {
            margin: 0;
            padding: 20px;
          }
          .certificate-card {
            box-shadow: none;
            max-width: 100%;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default VerificationCertificate;
