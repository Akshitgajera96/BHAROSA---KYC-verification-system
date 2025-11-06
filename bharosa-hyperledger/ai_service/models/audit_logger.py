# 📝 AI Audit Logger for Verification Pipeline

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import hashlib

class AIAuditLogger:
    """
    Comprehensive audit logging system for AI verification pipeline
    Tracks all AI operations, decisions, and model performance
    """
    
    def __init__(self, log_dir: str = "logs/ai_audit"):
        """
        Initialize audit logger
        
        Args:
            log_dir: Directory to store audit logs
        """
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Setup logging
        self.logger = logging.getLogger('ai_audit')
        self.logger.setLevel(logging.INFO)
        
        # File handler - daily rotating logs
        log_file = self.log_dir / f"ai_audit_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        
        # JSON formatter
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": %(message)s}'
        )
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        # Console handler for warnings and errors
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        print(f"📝 AI Audit Logger initialized: {log_file}")
    
    def log_verification_request(
        self,
        request_id: str,
        user_id: str,
        document_type: str,
        file_hashes: Dict[str, str]
    ) -> None:
        """
        Log incoming verification request
        
        Args:
            request_id: Unique request identifier
            user_id: User identifier
            document_type: Type of document
            file_hashes: SHA256 hashes of uploaded files
        """
        audit_entry = {
            "event": "verification_request",
            "request_id": request_id,
            "user_id": user_id,
            "document_type": document_type,
            "file_hashes": file_hashes,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.info(json.dumps(audit_entry))
    
    def log_face_matching(
        self,
        request_id: str,
        model_name: str,
        similarity_score: float,
        distance: float,
        threshold: float,
        verified: bool,
        processing_time: float
    ) -> None:
        """
        Log face matching operation
        
        Args:
            request_id: Request identifier
            model_name: Name of face recognition model used
            similarity_score: Calculated similarity score
            distance: Distance metric
            threshold: Verification threshold
            verified: Whether faces matched
            processing_time: Time taken in seconds
        """
        audit_entry = {
            "event": "face_matching",
            "request_id": request_id,
            "model": {
                "name": model_name,
                "version": "1.0"
            },
            "results": {
                "similarity_score": float(round(similarity_score, 4)),
                "distance": float(round(distance, 4)),
                "threshold": float(threshold),
                "verified": bool(verified)  # Convert numpy.bool_ to Python bool
            },
            "performance": {
                "processing_time_seconds": float(round(processing_time, 3))
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.info(json.dumps(audit_entry))
    
    def log_ocr_extraction(
        self,
        request_id: str,
        text_length: int,
        word_count: int,
        confidence: float,
        extracted_fields: Dict[str, Any],
        processing_time: float
    ) -> None:
        """
        Log OCR text extraction
        
        Args:
            request_id: Request identifier
            text_length: Length of extracted text
            word_count: Number of words extracted
            confidence: OCR confidence score
            extracted_fields: Structured data extracted
            processing_time: Time taken in seconds
        """
        audit_entry = {
            "event": "ocr_extraction",
            "request_id": request_id,
            "results": {
                "text_length": text_length,
                "word_count": word_count,
                "confidence": round(confidence, 4),
                "fields_extracted": list(extracted_fields.keys())
            },
            "performance": {
                "processing_time_seconds": round(processing_time, 3)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.info(json.dumps(audit_entry))
    
    def log_quality_check(
        self,
        request_id: str,
        image_type: str,
        dimensions: tuple,
        blur_score: float,
        brightness: float,
        is_valid: bool,
        issues: list
    ) -> None:
        """
        Log image quality check
        
        Args:
            request_id: Request identifier
            image_type: Type of image (id_front, selfie, etc.)
            dimensions: Image dimensions (width, height)
            blur_score: Blur detection score
            brightness: Average brightness
            is_valid: Whether image passed quality checks
            issues: List of quality issues found
        """
        audit_entry = {
            "event": "quality_check",
            "request_id": request_id,
            "image_type": image_type,
            "results": {
                "dimensions": {"width": int(dimensions[0]), "height": int(dimensions[1])},
                "blur_score": float(round(blur_score, 2)),
                "brightness": float(round(brightness, 2)),
                "is_valid": bool(is_valid),
                "issues": issues
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.info(json.dumps(audit_entry))
    
    def log_tampering_detection(
        self,
        request_id: str,
        suspicious: bool,
        reasons: list,
        noise_level: float,
        edge_density: float
    ) -> None:
        """
        Log tampering detection results
        
        Args:
            request_id: Request identifier
            suspicious: Whether tampering was detected
            reasons: List of suspicious indicators
            noise_level: Image noise level
            edge_density: Edge density metric
        """
        audit_entry = {
            "event": "tampering_detection",
            "request_id": request_id,
            "results": {
                "suspicious": bool(suspicious),
                "reasons": reasons,
                "noise_level": float(round(noise_level, 2)),
                "edge_density": float(round(edge_density, 4))
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.info(json.dumps(audit_entry))
    
    def log_final_decision(
        self,
        request_id: str,
        verified: bool,
        overall_confidence: float,
        component_scores: Dict[str, float],
        rejection_reasons: Optional[list],
        total_processing_time: float
    ) -> None:
        """
        Log final verification decision
        
        Args:
            request_id: Request identifier
            verified: Final verification status
            overall_confidence: Overall confidence score
            component_scores: Scores from each component
            rejection_reasons: Reasons for rejection (if any)
            total_processing_time: Total time taken
        """
        audit_entry = {
            "event": "final_decision",
            "request_id": request_id,
            "decision": {
                "verified": verified,
                "overall_confidence": round(overall_confidence, 4),
                "component_scores": {k: round(v, 4) for k, v in component_scores.items()},
                "rejection_reasons": rejection_reasons
            },
            "performance": {
                "total_processing_time_seconds": round(total_processing_time, 3)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.info(json.dumps(audit_entry))
        
        # Also log to dedicated decision log for compliance
        self._log_compliance_record(request_id, verified, overall_confidence)
    
    def log_model_performance(
        self,
        model_name: str,
        metrics: Dict[str, float]
    ) -> None:
        """
        Log model performance metrics
        
        Args:
            model_name: Name of the model
            metrics: Performance metrics
        """
        audit_entry = {
            "event": "model_performance",
            "model_name": model_name,
            "metrics": {k: round(v, 4) for k, v in metrics.items()},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.info(json.dumps(audit_entry))
    
    def log_error(
        self,
        request_id: str,
        error_type: str,
        error_message: str,
        stack_trace: Optional[str] = None
    ) -> None:
        """
        Log errors during verification
        
        Args:
            request_id: Request identifier
            error_type: Type of error
            error_message: Error message
            stack_trace: Optional stack trace
        """
        audit_entry = {
            "event": "error",
            "request_id": request_id,
            "error": {
                "type": error_type,
                "message": error_message,
                "stack_trace": stack_trace
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logger.error(json.dumps(audit_entry))
    
    def _log_compliance_record(
        self,
        request_id: str,
        verified: bool,
        confidence: float
    ) -> None:
        """
        Create tamper-proof compliance record
        
        Args:
            request_id: Request identifier
            verified: Verification status
            confidence: Confidence score
        """
        compliance_file = self.log_dir / "compliance_records.jsonl"
        
        record = {
            "request_id": request_id,
            "verified": verified,
            "confidence": confidence,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Create hash for integrity
        record_hash = hashlib.sha256(
            json.dumps(record, sort_keys=True).encode()
        ).hexdigest()
        record["record_hash"] = record_hash
        
        with open(compliance_file, 'a') as f:
            f.write(json.dumps(record) + '\n')

# Global audit logger instance
audit_logger = AIAuditLogger()

# Export
__all__ = ['AIAuditLogger', 'audit_logger']
