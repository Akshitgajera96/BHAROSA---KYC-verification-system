# 🚀 Enhanced Document Verifier with Improved Accuracy

from typing import Dict, Optional, Any
import numpy as np
import time
from .audit_logger import audit_logger

def convert_to_json_serializable(obj: Any) -> Any:
    """Convert NumPy types to native Python types for JSON serialization"""
    if isinstance(obj, dict):
        return {key: convert_to_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_json_serializable(item) for item in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj

class EnhancedDocumentVerifier:
    """
    Enhanced verification with adaptive thresholds and continuous learning
    """
    
    def __init__(
        self,
        base_face_threshold: float = 0.75,
        base_ocr_threshold: float = 0.6,
        adaptive_learning: bool = True
    ):
        """
        Initialize enhanced verifier
        
        Args:
            base_face_threshold: Base face matching threshold
            base_ocr_threshold: Base OCR threshold
            adaptive_learning: Enable adaptive threshold learning
        """
        self.base_face_threshold = base_face_threshold
        self.base_ocr_threshold = base_ocr_threshold
        self.adaptive_learning = adaptive_learning
        
        # Performance tracking for adaptive learning
        self.verification_history = []
        self.max_history = 1000
        
        # Dynamic thresholds (start with base)
        self.current_face_threshold = base_face_threshold
        self.current_ocr_threshold = base_ocr_threshold
        
        print(f"🚀 Enhanced Verifier initialized")
        print(f"   Adaptive Learning: {adaptive_learning}")
        print(f"   Base Thresholds - Face: {base_face_threshold}, OCR: {base_ocr_threshold}")
    
    def verify_document(
        self,
        request_id: str,
        face_match_result: Dict,
        ocr_result: Dict,
        quality_check: Dict,
        tampering_check: Dict
    ) -> Dict:
        """
        Enhanced verification with audit logging and adaptive thresholds
        
        Args:
            request_id: Unique request identifier
            face_match_result: Face matching results
            ocr_result: OCR extraction results
            quality_check: Image quality results
            tampering_check: Tampering detection results
        
        Returns:
            Comprehensive verification decision with audit trail
        """
        start_time = time.time()
        
        print(f"\n{'='*60}")
        print(f"🔍 Enhanced Verification - Request ID: {request_id}")
        print(f"{'='*60}")
        
        # Evaluate each component with adaptive thresholds
        face_eval = self._evaluate_face_match_enhanced(face_match_result)
        ocr_eval = self._evaluate_ocr_enhanced(ocr_result)
        quality_eval = self._evaluate_quality_enhanced(quality_check)
        tampering_eval = self._evaluate_tampering_enhanced(tampering_check)
        
        # Advanced scoring with weighted components
        component_scores = {
            "face_match": face_eval["score"],
            "ocr_extraction": ocr_eval["score"],
            "image_quality": quality_eval["score"],
            "tampering_check": tampering_eval["score"]
        }
        
        # Context-aware weighting
        weights = self._calculate_adaptive_weights(component_scores)
        
        # Calculate overall confidence
        overall_confidence = sum(
            score * weights[component]
            for component, score in component_scores.items()
        )
        
        # Multi-factor decision logic
        face_passed = face_eval["score"] >= self.current_face_threshold
        ocr_passed = ocr_eval["score"] >= self.current_ocr_threshold
        quality_passed = quality_eval["score"] >= 0.5
        tampering_passed = tampering_eval["score"] >= 0.7
        
        # Advanced decision rules
        critical_failures = []
        if not face_passed:
            critical_failures.append("face_match_below_threshold")
        if not tampering_passed:
            critical_failures.append("tampering_suspected")
        
        # Decision with risk assessment
        if critical_failures:
            final_status = "rejected"
            verified = False
        elif face_passed and ocr_passed and quality_passed and tampering_passed:
            final_status = "verified"
            verified = True
        elif overall_confidence >= 0.75 and not critical_failures:
            final_status = "verified"
            verified = True
        else:
            final_status = "rejected"
            verified = False
        
        # Collect rejection reasons
        rejection_reasons = []
        if not face_passed:
            rejection_reasons.append(f"Face similarity {face_eval['score']:.2%} below threshold {self.current_face_threshold:.2%}")
        if not ocr_passed:
            rejection_reasons.append(f"OCR confidence {ocr_eval['score']:.2%} below threshold {self.current_ocr_threshold:.2%}")
        if not quality_passed:
            rejection_reasons.append("Image quality insufficient")
        if not tampering_passed:
            rejection_reasons.append("Document tampering suspected")
        
        processing_time = time.time() - start_time
        
        # Build comprehensive result
        result = {
            "request_id": request_id,
            "final_status": final_status,
            "verified": verified,
            "confidence": round(overall_confidence, 4),
            "risk_level": self._calculate_risk_level(overall_confidence, critical_failures),
            "verification_details": {
                "face_match": face_eval,
                "ocr_extraction": ocr_eval,
                "image_quality": quality_eval,
                "tampering_check": tampering_eval
            },
            "component_scores": component_scores,
            "adaptive_weights": weights,
            "thresholds": {
                "face_match": self.current_face_threshold,
                "ocr_confidence": self.current_ocr_threshold,
                "overall": 0.70
            },
            "rejection_reasons": rejection_reasons if rejection_reasons else None,
            "processing_time_seconds": round(processing_time, 3),
            "metadata": {
                "model_version": "2.0-enhanced",
                "adaptive_learning_enabled": self.adaptive_learning
            }
        }
        
        # Audit logging
        audit_logger.log_final_decision(
            request_id=request_id,
            verified=verified,
            overall_confidence=overall_confidence,
            component_scores=component_scores,
            rejection_reasons=rejection_reasons,
            total_processing_time=processing_time
        )
        
        # Update learning if enabled
        if self.adaptive_learning:
            self._update_adaptive_thresholds(result)
        
        # Print summary
        self._print_verification_summary(result)
        
        # Convert all NumPy types to native Python types for JSON serialization
        return convert_to_json_serializable(result)
    
    def _evaluate_face_match_enhanced(self, face_result: Dict) -> Dict:
        """Enhanced face matching evaluation with context awareness"""
        if not face_result.get("success", False):
            return {
                "passed": False,
                "score": 0.0,
                "message": face_result.get("error", "Face matching failed"),
                "confidence": "very_low"
            }
        
        similarity = face_result.get("similarity", 0.0)
        
        # Context-aware confidence levels
        if similarity >= 0.90:
            confidence_level = "very_high"
        elif similarity >= 0.80:
            confidence_level = "high"
        elif similarity >= 0.70:
            confidence_level = "medium"
        elif similarity >= 0.60:
            confidence_level = "low"
        else:
            confidence_level = "very_low"
        
        passed = similarity >= self.current_face_threshold
        
        return {
            "passed": passed,
            "score": similarity,
            "message": f"Face match {confidence_level} confidence" if passed else "Face similarity below threshold",
            "similarity": similarity,
            "confidence": confidence_level,
            "model": face_result.get("model", "unknown")
        }
    
    def _evaluate_ocr_enhanced(self, ocr_result: Dict) -> Dict:
        """Enhanced OCR evaluation with structured data validation"""
        if not ocr_result.get("success", False):
            return {
                "passed": False,
                "score": 0.0,
                "message": ocr_result.get("error", "OCR extraction failed"),
                "structured_data_found": False
            }
        
        confidence = ocr_result.get("confidence", 0.0)
        word_count = ocr_result.get("word_count", 0)
        extracted_data = ocr_result.get("extracted_data", {})
        
        # Bonus score for structured data extraction
        structured_bonus = len(extracted_data) * 0.05  # 5% per field extracted
        adjusted_score = min(1.0, confidence + structured_bonus)
        
        passed = adjusted_score >= self.current_ocr_threshold and word_count > 5
        
        return {
            "passed": passed,
            "score": adjusted_score,
            "base_confidence": confidence,
            "structured_bonus": structured_bonus,
            "message": "OCR successful" if passed else "OCR quality insufficient",
            "word_count": word_count,
            "structured_fields": list(extracted_data.keys()),
            "structured_data_found": len(extracted_data) > 0
        }
    
    def _evaluate_quality_enhanced(self, quality_check: Dict) -> Dict:
        """Enhanced quality evaluation with detailed metrics"""
        if not quality_check.get("valid", False):
            return {
                "passed": False,
                "score": 0.0,
                "message": quality_check.get("error", "Quality check failed")
            }
        
        is_clear = quality_check.get("is_clear", False)
        is_bright = quality_check.get("is_bright_enough", False)
        blur_score = quality_check.get("blur_score", 0)
        brightness = quality_check.get("brightness", 0)
        
        # Nuanced scoring based on metrics
        clarity_score = min(1.0, blur_score / 200) if blur_score > 0 else 0
        brightness_score = 1.0 - abs(brightness - 128) / 128  # Optimal ~128
        
        overall_quality = (clarity_score * 0.6 + brightness_score * 0.4)
        
        passed = is_clear and is_bright
        
        return {
            "passed": passed,
            "score": overall_quality,
            "message": "Image quality acceptable" if passed else "Image quality issues",
            "is_clear": is_clear,
            "is_bright_enough": is_bright,
            "blur_score": blur_score,
            "brightness": brightness,
            "dimensions": quality_check.get("dimensions")
        }
    
    def _evaluate_tampering_enhanced(self, tampering_check: Dict) -> Dict:
        """Enhanced tampering detection with severity levels"""
        suspicious = tampering_check.get("suspicious", False)
        reasons = tampering_check.get("reasons", [])
        
        # Severity assessment
        if not suspicious:
            severity = "none"
            score = 0.95
        elif len(reasons) == 1:
            severity = "low"
            score = 0.6
        elif len(reasons) == 2:
            severity = "medium"
            score = 0.4
        else:
            severity = "high"
            score = 0.2
        
        passed = not suspicious
        
        return {
            "passed": passed,
            "score": score,
            "message": f"Tampering {severity}" if suspicious else "No tampering detected",
            "suspicious": suspicious,
            "severity": severity,
            "reasons": reasons,
            "indicators_count": len(reasons)
        }
    
    def _calculate_adaptive_weights(self, scores: Dict[str, float]) -> Dict[str, float]:
        """Calculate context-aware component weights"""
        # Base weights
        weights = {
            "face_match": 0.40,
            "ocr_extraction": 0.30,
            "image_quality": 0.20,
            "tampering_check": 0.10
        }
        
        # Increase face weight if OCR is weak
        if scores["ocr_extraction"] < 0.5:
            weights["face_match"] += 0.10
            weights["ocr_extraction"] -= 0.10
        
        # Increase tampering weight if suspicious
        if scores["tampering_check"] < 0.7:
            weights["tampering_check"] += 0.10
            weights["image_quality"] -= 0.10
        
        return weights
    
    def _calculate_risk_level(self, confidence: float, critical_failures: list) -> str:
        """Calculate verification risk level"""
        if critical_failures:
            return "high"
        elif confidence >= 0.90:
            return "very_low"
        elif confidence >= 0.80:
            return "low"
        elif confidence >= 0.70:
            return "medium"
        else:
            return "high"
    
    def _update_adaptive_thresholds(self, result: Dict) -> None:
        """Update thresholds based on verification history"""
        self.verification_history.append(result)
        
        if len(self.verification_history) > self.max_history:
            self.verification_history.pop(0)
        
        # Adjust every 100 verifications
        if len(self.verification_history) >= 100 and len(self.verification_history) % 100 == 0:
            self._recalculate_thresholds()
    
    def _recalculate_thresholds(self) -> None:
        """Recalculate optimal thresholds from history"""
        if not self.verification_history:
            return
        
        verified_face_scores = [
            v["component_scores"]["face_match"]
            for v in self.verification_history
            if v["verified"]
        ]
        
        if verified_face_scores:
            # Set threshold at 10th percentile of verified scores
            new_face_threshold = np.percentile(verified_face_scores, 10)
            self.current_face_threshold = max(0.65, min(0.85, new_face_threshold))
            
            print(f"📊 Adaptive threshold updated: Face {self.current_face_threshold:.3f}")
    
    def _print_verification_summary(self, result: Dict) -> None:
        """Print verification summary"""
        print(f"\n{'='*60}")
        print(f"🎯 VERIFICATION RESULT: {result['final_status'].upper()}")
        print(f"{'='*60}")
        print(f"Overall Confidence: {result['confidence']:.2%}")
        print(f"Risk Level: {result['risk_level'].upper()}")
        print(f"Processing Time: {result['processing_time_seconds']}s")
        
        for component, score in result['component_scores'].items():
            status = "✅" if result['verification_details'][component]['passed'] else "❌"
            print(f"{status} {component.replace('_', ' ').title()}: {score:.2%}")
        
        if result['rejection_reasons']:
            print(f"\n⚠️  Rejection Reasons:")
            for reason in result['rejection_reasons']:
                print(f"   - {reason}")
        
        print(f"{'='*60}\n")

# Global instance
enhanced_verifier = EnhancedDocumentVerifier()

__all__ = ['EnhancedDocumentVerifier', 'enhanced_verifier']
