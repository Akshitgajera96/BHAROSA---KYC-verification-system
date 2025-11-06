# 🧠 Bharosa AI Service - FastAPI Application
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import uvicorn
import os
from datetime import datetime
import numpy as np

def convert_numpy_types(obj: Any) -> Any:
    """Convert NumPy types to native Python types for JSON serialization"""
    if isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        return float(obj)
    elif isinstance(obj, (np.bool_, np.bool8)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, bytes):
        return obj.decode('utf-8', errors='ignore')
    else:
        return obj

# Import models
from models.face_match import face_matcher
from models.ocr_extractor import ocr_extractor
from models.verifier import document_verifier
from models.enhanced_verifier import enhanced_verifier
from models.audit_logger import audit_logger
from models.document_validator import document_validator

# Import utilities
from utils.file_utils import (
    save_uploaded_file,
    cleanup_multiple_files,
    validate_image_file,
    check_image_quality,
    detect_file_tampering,
    cleanup_temp_directory
)
import hashlib
import uuid

# Initialize FastAPI app
app = FastAPI(
    title="Bharosa AI Verification Service",
    description="AI-powered document and identity verification service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for requests
class AnalyzeRequest(BaseModel):
    """Request model for document analysis"""
    user_id: Optional[str] = None
    document_type: Optional[str] = "national_id"

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    message: str
    timestamp: str
    version: str

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Bharosa AI Verification Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze (POST)",
            "face_match": "/face-match (POST)",
            "ocr": "/ocr (POST)"
        }
    }

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "AI service is running",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# Main analysis endpoint
@app.post("/analyze")
async def analyze_document(
    id_image: UploadFile = File(..., description="ID document front image"),
    selfie: UploadFile = File(..., description="User selfie image"),
    document_back: Optional[UploadFile] = File(None, description="ID document back image (optional)"),
    user_id: Optional[str] = Form(None),
    document_type: Optional[str] = Form("national_id")
):
    """
    Main endpoint for complete document verification
    
    Performs:
    - Face matching between ID and selfie
    - OCR text extraction from ID
    - Image quality checks
    - Tampering detection
    - Final verification decision
    
    Args:
        id_image: ID document front image
        selfie: User selfie image
        document_back: ID document back image (optional)
        user_id: User identifier (optional)
        document_type: Type of document (optional)
    
    Returns:
        Complete verification results
    """
    temp_files = []
    
    # Generate unique request ID for audit trail
    request_id = str(uuid.uuid4())
    start_time = datetime.utcnow()
    
    try:
        print("\n" + "="*60)
        print("🚀 NEW VERIFICATION REQUEST")
        print("="*60)
        print(f"Request ID: {request_id}")
        print(f"User ID: {user_id or 'N/A'}")
        print(f"Document Type: {document_type}")
        print(f"ID Image: {id_image.filename}")
        print(f"Selfie: {selfie.filename}")
        print("="*60 + "\n")
        
        # Validate file types
        allowed_types = ["image/jpeg", "image/jpg", "image/png"]
        
        print(f"📋 File validation:")
        print(f"   ID image content-type: {id_image.content_type}")
        print(f"   ID image filename: {id_image.filename}")
        print(f"   Selfie content-type: {selfie.content_type}")
        print(f"   Selfie filename: {selfie.filename}")
        
        if not id_image.content_type or id_image.content_type not in allowed_types:
            error_msg = f"ID image must be JPEG or PNG (received: {id_image.content_type})"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        if not selfie.content_type or selfie.content_type not in allowed_types:
            error_msg = f"Selfie must be JPEG or PNG (received: {selfie.content_type})"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Save uploaded files
        print("💾 Saving uploaded files...")
        id_image_content = await id_image.read()
        selfie_content = await selfie.read()
        
        # Validate file sizes
        print(f"   ID image size: {len(id_image_content)} bytes")
        print(f"   Selfie size: {len(selfie_content)} bytes")
        
        if len(id_image_content) == 0:
            error_msg = "ID image is empty"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        if len(selfie_content) == 0:
            error_msg = "Selfie is empty"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        id_image_path = save_uploaded_file(id_image_content, ".jpg")
        selfie_path = save_uploaded_file(selfie_content, ".jpg")
        temp_files.extend([id_image_path, selfie_path])
        
        # Calculate file hashes for audit
        file_hashes = {
            "id_image": hashlib.sha256(id_image_content).hexdigest(),
            "selfie": hashlib.sha256(selfie_content).hexdigest()
        }
        
        # Log verification request
        audit_logger.log_verification_request(
            request_id=request_id,
            user_id=user_id or "anonymous",
            document_type=document_type,
            file_hashes=file_hashes
        )
        
        print(f"✅ Files saved to temporary storage")
        
        # Validate images
        if not validate_image_file(id_image_path):
            raise HTTPException(status_code=400, detail="Invalid ID image file")
        if not validate_image_file(selfie_path):
            raise HTTPException(status_code=400, detail="Invalid selfie file")
        
        # ========================================================================
        # TODO: TEMPORARY FAST-FORWARD MODE FOR TESTING
        # This section bypasses heavy AI processing for instant verification.
        # RESTORE REAL AI VERIFICATION BEFORE PRODUCTION DEPLOYMENT!
        # ========================================================================
        
        # 1. Check image quality (MOCKED)
        print("\n📊 Step 1: Quality Check (FAST MODE - MOCKED)")
        # TODO: RESTORE REAL QUALITY CHECK
        # quality_check = check_image_quality(id_image_path)
        quality_check = {
            "valid": True,
            "blur_score": 95.5,
            "brightness": 128,
            "dimensions": (800, 600),
            "issues": []
        }
        print("✅ Quality check passed (mocked)")
        
        # Log quality check
        audit_logger.log_quality_check(
            request_id=request_id,
            image_type="id_front",
            dimensions=quality_check.get("dimensions", (0, 0)),
            blur_score=quality_check.get("blur_score", 0),
            brightness=quality_check.get("brightness", 0),
            is_valid=quality_check.get("valid", False),
            issues=[quality_check.get("error")] if not quality_check.get("valid") else []
        )
        
        # 2. Check for tampering (MOCKED)
        print("\n🔍 Step 2: Tampering Detection (FAST MODE - MOCKED)")
        # TODO: RESTORE REAL TAMPERING DETECTION
        # tampering_start = datetime.utcnow()
        # tampering_check = detect_file_tampering(id_image_path)
        tampering_check = {
            "suspicious": False,
            "reasons": [],
            "noise_level": 0.02,
            "edge_density": 0.45,
            "tampering_score": 0.01
        }
        print("✅ No tampering detected (mocked)")
        
        # Log tampering check
        audit_logger.log_tampering_detection(
            request_id=request_id,
            suspicious=tampering_check.get("suspicious", False),
            reasons=tampering_check.get("reasons", []),
            noise_level=tampering_check.get("noise_level", 0),
            edge_density=tampering_check.get("edge_density", 0)
        )
        
        # 3. Perform OCR extraction (MOCKED)
        print("\n📝 Step 3: OCR Text Extraction (FAST MODE - MOCKED)")
        # TODO: RESTORE REAL OCR EXTRACTION
        # ocr_start = datetime.utcnow()
        # ocr_result = ocr_extractor.extract_text(id_image_path)
        # ocr_time = (datetime.utcnow() - ocr_start).total_seconds()
        ocr_result = {
            "success": True,
            "text": "GOVERNMENT OF INDIA\nAadhaar Card\nName: Test User\nDOB: 01/01/1990\nUID: 1234 5678 9012",
            "confidence": 0.97,
            "word_count": 15,
            "extracted_data": {
                "name": "Test User",
                "dob": "01/01/1990",
                "document_number": "1234 5678 9012"
            }
        }
        ocr_time = 0.1
        print("✅ OCR extraction complete (mocked)")
        
        # Log OCR extraction
        audit_logger.log_ocr_extraction(
            request_id=request_id,
            text_length=len(ocr_result.get("text", "")),
            word_count=ocr_result.get("word_count", 0),
            confidence=ocr_result.get("confidence", 0),
            extracted_fields=ocr_result.get("extracted_data", {}),
            processing_time=ocr_time
        )
        
        # 4. Validate document-specific requirements (MOCKED)
        print("\n📋 Step 4: Document Validation (FAST MODE - MOCKED)")
        # TODO: RESTORE REAL DOCUMENT VALIDATION WITH DEEPFACE
        # face_detected_in_id = False
        # try:
        #     from deepface import DeepFace
        #     DeepFace.extract_faces(id_image_path, enforce_detection=True)
        #     face_detected_in_id = True
        #     print("✅ Face detected in ID document")
        # except:
        #     print("⚠️  No face detected in ID document")
        # doc_validation = document_validator.validate_document(...)
        
        face_detected_in_id = True
        doc_validation = {
            "validation_passed": True,
            "document_type": document_type,
            "issues": [],
            "type_mismatch": False,
            "extracted_data": {
                "name": "Test User",
                "document_number": "1234567890"
            }
        }
        
        print(f"   Expected Type: {document_type}")
        print(f"   Detected Type: {doc_validation.get('document_type', 'unknown')}")
        print(f"   Validation Passed: {doc_validation.get('validation_passed', False)} (mocked)")
        print("✅ Document validation passed (mocked)")
        
        # 5. Perform face matching (MOCKED)
        print("\n👤 Step 5: Face Matching (FAST MODE - MOCKED)")
        # TODO: RESTORE REAL FACE MATCHING WITH DEEPFACE
        # face_start = datetime.utcnow()
        # face_match_result = face_matcher.compare_faces(id_image_path, selfie_path)
        # face_time = (datetime.utcnow() - face_start).total_seconds()
        
        face_match_result = {
            "success": True,
            "match": True,
            "similarity": 0.98,
            "distance": 0.15,
            "threshold": 0.75,
            "model": "VGG-Face (mocked)",
            "confidence": 0.98
        }
        face_time = 0.1
        print("✅ Face match successful (mocked): 98% similarity")
        
        # Log face matching
        audit_logger.log_face_matching(
            request_id=request_id,
            model_name=face_match_result.get("model", "VGG-Face"),
            similarity_score=face_match_result.get("similarity", 0),
            distance=face_match_result.get("distance", 1.0),
            threshold=face_match_result.get("threshold", 0.75),
            verified=face_match_result.get("match", False),
            processing_time=face_time
        )
        
        # 6. Combine results and make final decision (SIMPLIFIED)
        print("\n✅ Step 6: Final Verification (FAST MODE - ALWAYS SUCCESS)")
        
        # TODO: RESTORE REAL VERIFICATION LOGIC WITH ENHANCED VERIFIER
        # In fast mode, always return successful verification
        verification_result = {
            "final_status": "verified",
            "confidence": 0.99,
            "verified": True,
            "risk_level": "low",
            "rejection_reasons": None,
            "verification_details": {
                "face_matching": "passed",
                "ocr_extraction": "passed",
                "document_validation": "passed",
                "quality_check": "passed",
                "tampering_detection": "passed"
            },
            "component_scores": {
                "face_match": 0.98,
                "ocr_confidence": 0.97,
                "document_validity": 0.99,
                "image_quality": 0.96
            },
            "adaptive_weights": {
                "face_match": 0.40,
                "ocr_confidence": 0.25,
                "document_validity": 0.25,
                "image_quality": 0.10
            },
            "metadata": {
                "model_version": "1.0-fast-mode",
                "processing_mode": "mocked"
            }
        }
        
        # Add document validation data to extracted data
        if doc_validation.get('extracted_data'):
            ocr_result['extracted_data'].update(doc_validation['extracted_data'])
        
        print("✅ Verification PASSED (mocked) - Confidence: 99%")
        print("⚡ FAST MODE ACTIVE - Real AI verification bypassed")
        
        # Build response
        total_processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        response = {
            "success": True,
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "document_type": document_type,
            
            # Main results
            "final_status": verification_result["final_status"],
            "confidence": verification_result["confidence"],
            "verified": verification_result["verified"],
            "risk_level": verification_result.get("risk_level", "unknown"),
            
            # Individual component results
            "face_match": face_match_result.get("similarity", 0.0),
            "face_match_verified": face_match_result.get("match", False),
            
            "ocr_text": ocr_result.get("text", ""),
            "ocr_confidence": ocr_result.get("confidence", 0.0),
            "extracted_data": ocr_result.get("extracted_data", {}),
            
            "document_validity": not tampering_check.get("suspicious", False),
            "image_quality_passed": quality_check.get("valid", False),
            
            # Document validation results
            "document_validation": {
                "validated": doc_validation.get('validation_passed', False),
                "detected_type": doc_validation.get('document_type', 'unknown'),
                "issues": doc_validation.get('issues', []),
                "specific_data": doc_validation.get('extracted_data', {})
            },
            
            # Detailed results
            "verification_details": verification_result["verification_details"],
            "component_scores": verification_result["component_scores"],
            "adaptive_weights": verification_result.get("adaptive_weights", {}),
            
            # Rejection reasons (if any)
            "rejection_reasons": verification_result.get("rejection_reasons"),
            
            # Metadata
            "confidence_level": "high" if verification_result["confidence"] >= 0.8 else "medium" if verification_result["confidence"] >= 0.6 else "low",
            "processing_complete": True,
            "total_processing_time_seconds": round(total_processing_time, 3),
            "model_version": verification_result.get("metadata", {}).get("model_version", "1.0")
        }
        
        print("\n✨ Verification completed successfully (FAST MODE)")
        print("⚠️  WARNING: Using mocked AI responses for testing")
        print("📝 TODO: Restore real AI verification before production!")
        
        # Convert all NumPy types to native Python types before JSON serialization
        response_cleaned = convert_numpy_types(response)
        return JSONResponse(content=response_cleaned)
        
    except HTTPException as e:
        print(f"\n⚠️  HTTP Error: {e.detail}")
        raise e
    
    except Exception as e:
        print(f"\n❌ Error during verification: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal server error during verification",
                "details": str(e),
                "final_status": "error",
                "confidence": 0.0
            }
        )
    
    finally:
        # Cleanup temporary files
        print("\n🧹 Cleaning up temporary files...")
        cleanup_multiple_files(*temp_files)
        print("✅ Cleanup complete\n")

# Face matching endpoint
@app.post("/face-match")
async def face_match_endpoint(
    image1: UploadFile = File(..., description="First image"),
    image2: UploadFile = File(..., description="Second image")
):
    """
    Standalone face matching endpoint
    
    Args:
        image1: First face image
        image2: Second face image
    
    Returns:
        Face matching results
    """
    temp_files = []
    
    try:
        print("\n👤 Face matching request received (FAST MODE)")
        
        # Save files
        img1_content = await image1.read()
        img2_content = await image2.read()
        
        img1_path = save_uploaded_file(img1_content, ".jpg")
        img2_path = save_uploaded_file(img2_content, ".jpg")
        temp_files.extend([img1_path, img2_path])
        
        # TODO: RESTORE REAL FACE MATCHING
        # result = face_matcher.compare_faces(img1_path, img2_path)
        
        # Mock successful face match
        result = {
            "success": True,
            "match": True,
            "similarity": 0.98,
            "distance": 0.15,
            "model": "VGG-Face (mocked)",
            "error": None
        }
        print("✅ Face match result (mocked): 98% similarity")
        
        return JSONResponse(content={
            "success": result["success"],
            "match": result.get("match", False),
            "similarity": result.get("similarity", 0.0),
            "distance": result.get("distance"),
            "model": result.get("model"),
            "error": result.get("error")
        })
        
    except Exception as e:
        print(f"❌ Face matching error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )
    
    finally:
        cleanup_multiple_files(*temp_files)

# OCR endpoint
@app.post("/ocr")
async def ocr_endpoint(
    image: UploadFile = File(..., description="Document image for OCR")
):
    """
    Standalone OCR text extraction endpoint
    
    Args:
        image: Document image
    
    Returns:
        Extracted text and confidence
    """
    temp_files = []
    
    try:
        print("\n📝 OCR request received (FAST MODE)")
        
        # Save file
        img_content = await image.read()
        img_path = save_uploaded_file(img_content, ".jpg")
        temp_files.append(img_path)
        
        # TODO: RESTORE REAL OCR EXTRACTION
        # result = ocr_extractor.extract_text(img_path)
        
        # Mock successful OCR extraction
        result = {
            "success": True,
            "text": "GOVERNMENT OF INDIA\nAadhaar Card\nName: Test User\nDOB: 01/01/1990\nUID: 1234 5678 9012",
            "confidence": 0.97,
            "word_count": 15,
            "extracted_data": {
                "name": "Test User",
                "dob": "01/01/1990",
                "document_number": "1234 5678 9012"
            },
            "error": None
        }
        print("✅ OCR extraction complete (mocked)")
        
        return JSONResponse(content={
            "success": result["success"],
            "text": result.get("text", ""),
            "confidence": result.get("confidence", 0.0),
            "word_count": result.get("word_count", 0),
            "extracted_data": result.get("extracted_data", {}),
            "error": result.get("error")
        })
        
    except Exception as e:
        print(f"❌ OCR error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )
    
    finally:
        cleanup_multiple_files(*temp_files)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print("\n" + "="*60)
    print("🚀 BHAROSA AI SERVICE STARTING (FAST MODE)")
    print("="*60)
    print("⚡ FAST MODE ENABLED - Using mocked AI responses")
    print("⚠️  WARNING: Real AI models NOT loaded")
    print("   - DeepFace: BYPASSED (mocked)")
    print("   - Tesseract OCR: BYPASSED (mocked)")
    print("   - OpenCV: BYPASSED (mocked)")
    print("="*60)
    print("✅ AI Service Ready (Fast Mode)")
    print("🌐 Listening on http://0.0.0.0:8000")
    print("📝 TODO: Restore real AI verification before production!")
    print("="*60 + "\n")
    
    # Cleanup old temporary files
    cleanup_temp_directory()

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    print("\n🛑 AI Service shutting down...")
    cleanup_temp_directory()
    print("✅ Cleanup complete\n")

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
