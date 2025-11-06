# ✅ Document Verification Logic
from typing import Dict, Optional
import numpy as np

class DocumentVerifier:
    """
    Combines OCR and Face matching results to make final verification decision
    """
    
    def __init__(
        self,
        face_match_threshold: float = 0.75,
        ocr_confidence_threshold: float = 0.6,
        overall_confidence_threshold: float = 0.70
    ):
        """
        Initialize verifier with thresholds
        
        Args:
            face_match_threshold: Minimum face similarity score (0-1)
            ocr_confidence_threshold: Minimum OCR confidence (0-1)
            overall_confidence_threshold: Minimum overall confidence for verification
        """
        self.face_match_threshold = face_match_threshold
        self.ocr_confidence_threshold = ocr_confidence_threshold
        self.overall_confidence_threshold = overall_confidence_threshold
        
        print(f"✅ Document Verifier initialized")
        print(f"   Face Match Threshold: {face_match_threshold}")
        print(f"   OCR Confidence Threshold: {ocr_confidence_threshold}")
        print(f"   Overall Threshold: {overall_confidence_threshold}")
    
    def verify_document(
        self,
        face_match_result: Dict,
        ocr_result: Dict,
        quality_check: Dict,
        tampering_check: Dict
    ) -> Dict:
        """
        Combine all verification results and make final decision
        
        Args:
            face_match_result: Face matching results
            ocr_result: OCR extraction results
            quality_check: Image quality check results
            tampering_check: Tampering detection results
        
        Returns:
            Dictionary with final verification decision
        """
        print("\n🔍 Starting document verification...")
        
        # Initialize verification components
        verification_details = {
            "face_match": self._evaluate_face_match(face_match_result),
            "ocr_extraction": self._evaluate_ocr(ocr_result),
            "image_quality": self._evaluate_quality(quality_check),
            "tampering_check": self._evaluate_tampering(tampering_check)
        }
        
        # Calculate component scores
        face_score = verification_details["face_match"]["score"]
        ocr_score = verification_details["ocr_extraction"]["score"]
        quality_score = verification_details["image_quality"]["score"]
        tampering_score = verification_details["tampering_check"]["score"]
        
        # Calculate weighted overall confidence
        # Face match is most important (40%), OCR (30%), Quality (20%), Tampering (10%)
        overall_confidence = (
            face_score * 0.40 +
            ocr_score * 0.30 +
            quality_score * 0.20 +
            tampering_score * 0.10
        )
        
        # Determine pass/fail for each component
        face_passed = face_score >= self.face_match_threshold
        ocr_passed = ocr_score >= self.ocr_confidence_threshold
        quality_passed = quality_score >= 0.5
        tampering_passed = tampering_score >= 0.7
        
        # Final decision logic
        all_passed = face_passed and ocr_passed and quality_passed and tampering_passed
        final_status = "verified" if (all_passed and overall_confidence >= self.overall_confidence_threshold) else "rejected"
        
        # Generate rejection reasons if applicable
        rejection_reasons = []
        if not face_passed:
            rejection_reasons.append("Face match below threshold")
        if not ocr_passed:
            rejection_reasons.append("OCR confidence too low")
        if not quality_passed:
            rejection_reasons.append("Image quality insufficient")
        if not tampering_passed:
            rejection_reasons.append("Document tampering suspected")
        if overall_confidence < self.overall_confidence_threshold:
            rejection_reasons.append("Overall confidence below threshold")
        
        # Build result
        result = {
            "final_status": final_status,
            "confidence": round(overall_confidence, 4),
            "verified": final_status == "verified",
            "verification_details": verification_details,
            "component_scores": {
                "face_match": round(face_score, 4),
                "ocr_extraction": round(ocr_score, 4),
                "image_quality": round(quality_score, 4),
                "tampering_check": round(tampering_score, 4)
            },
            "thresholds": {
                "face_match": self.face_match_threshold,
                "ocr_confidence": self.ocr_confidence_threshold,
                "overall": self.overall_confidence_threshold
            },
            "rejection_reasons": rejection_reasons if rejection_reasons else None
        }
        
        print(f"\n{'='*50}")
        print(f"🎯 VERIFICATION RESULT: {final_status.upper()}")
        print(f"{'='*50}")
        print(f"Overall Confidence: {overall_confidence:.2%}")
        print(f"Face Match: {face_score:.2%} {'✅' if face_passed else '❌'}")
        print(f"OCR Quality: {ocr_score:.2%} {'✅' if ocr_passed else '❌'}")
        print(f"Image Quality: {quality_score:.2%} {'✅' if quality_passed else '❌'}")
        print(f"Tampering Check: {tampering_score:.2%} {'✅' if tampering_passed else '❌'}")
        if rejection_reasons:
            print(f"\n⚠️  Rejection Reasons:")
            for reason in rejection_reasons:
                print(f"   - {reason}")
        print(f"{'='*50}\n")
        
        return result
    
    def _evaluate_face_match(self, face_result: Dict) -> Dict:
        """Evaluate face matching results"""
        if not face_result.get("success", False):
            return {
                "passed": False,
                "score": 0.0,
                "message": face_result.get("error", "Face matching failed"),
                "similarity": 0.0
            }
        
        similarity = face_result.get("similarity", 0.0)
        passed = similarity >= self.face_match_threshold
        
        return {
            "passed": passed,
            "score": similarity,
            "message": "Face match successful" if passed else "Face similarity below threshold",
            "similarity": similarity,
            "model": face_result.get("model", "unknown")
        }
    
    def _evaluate_ocr(self, ocr_result: Dict) -> Dict:
        """Evaluate OCR extraction results"""
        if not ocr_result.get("success", False):
            return {
                "passed": False,
                "score": 0.0,
                "message": ocr_result.get("error", "OCR extraction failed"),
                "text_extracted": False
            }
        
        confidence = ocr_result.get("confidence", 0.0)
        text_length = len(ocr_result.get("text", ""))
        word_count = ocr_result.get("word_count", 0)
        
        # OCR is considered good if confidence is high and text was extracted
        passed = confidence >= self.ocr_confidence_threshold and word_count > 5
        
        return {
            "passed": passed,
            "score": confidence,
            "message": "OCR successful" if passed else "OCR confidence or text insufficient",
            "text_length": text_length,
            "word_count": word_count,
            "extracted_data": ocr_result.get("extracted_data", {})
        }
    
    def _evaluate_quality(self, quality_check: Dict) -> Dict:
        """Evaluate image quality"""
        if not quality_check.get("valid", False):
            return {
                "passed": False,
                "score": 0.0,
                "message": quality_check.get("error", "Quality check failed")
            }
        
        is_clear = quality_check.get("is_clear", False)
        is_bright = quality_check.get("is_bright_enough", False)
        blur_score = quality_check.get("blur_score", 0)
        
        # Calculate quality score
        if is_clear and is_bright:
            score = 0.9
        elif is_clear or is_bright:
            score = 0.6
        else:
            score = 0.3
        
        passed = is_clear and is_bright
        
        return {
            "passed": passed,
            "score": score,
            "message": "Image quality acceptable" if passed else "Image quality issues detected",
            "is_clear": is_clear,
            "is_bright_enough": is_bright,
            "blur_score": blur_score,
            "dimensions": quality_check.get("dimensions")
        }
    
    def _evaluate_tampering(self, tampering_check: Dict) -> Dict:
        """Evaluate tampering detection results"""
        suspicious = tampering_check.get("suspicious", False)
        reasons = tampering_check.get("reasons", [])
        
        # If tampering detected, score is low
        score = 0.3 if suspicious else 0.95
        passed = not suspicious
        
        return {
            "passed": passed,
            "score": score,
            "message": "No tampering detected" if passed else "Tampering suspected",
            "suspicious": suspicious,
            "reasons": reasons,
            "file_size": tampering_check.get("file_size"),
            "noise_level": tampering_check.get("noise_level"),
            "edge_density": tampering_check.get("edge_density")
        }
    
    def get_confidence_level(self, confidence: float) -> str:
        """
        Get human-readable confidence level
        
        Args:
            confidence: Confidence score (0-1)
        
        Returns:
            Confidence level string
        """
        if confidence >= 0.9:
            return "Very High"
        elif confidence >= 0.8:
            return "High"
        elif confidence >= 0.7:
            return "Medium"
        elif confidence >= 0.5:
            return "Low"
        else:
            return "Very Low"

# Create global instance
document_verifier = DocumentVerifier()

# Export
__all__ = ['DocumentVerifier', 'document_verifier']
