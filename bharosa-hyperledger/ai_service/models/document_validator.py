# 📄 Document Validator - Validates specific document types
import re
import cv2
import numpy as np
from typing import Dict, Optional, List, Any

def convert_to_native_types(obj: Any) -> Any:
    """Convert NumPy types to native Python types"""
    if isinstance(obj, dict):
        return {key: convert_to_native_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_native_types(item) for item in obj]
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

class DocumentValidator:
    """
    Validates specific document types with their unique requirements
    Ensures correct document type is uploaded (e.g., Aadhaar when Aadhaar is requested)
    """
    
    def __init__(self):
        """Initialize document validator"""
        print("📄 Document Validator initialized")
        
        # Define document type patterns and requirements
        self.document_patterns = {
            'aadhaar': {
                'number_pattern': r'\b\d{4}\s?\d{4}\s?\d{4}\b',
                'keywords': ['aadhaar', 'aadhar', 'uid', 'uidai'],
                'number_length': 12,
                'requires_photo': True,
                'description': 'Aadhaar Card with 12-digit number'
            },
            'pan': {
                'number_pattern': r'\b[A-Z]{5}\d{4}[A-Z]\b',
                'keywords': ['pan', 'permanent account', 'income tax'],
                'number_length': 10,
                'requires_photo': False,
                'description': 'PAN Card with 10-character alphanumeric'
            },
            'voter_id': {
                'number_pattern': r'\b[A-Z]{3}\d{7}\b',
                'keywords': ['voter', 'election', 'electors'],
                'number_length': 10,
                'requires_photo': True,
                'description': 'Voter ID with 3 letters + 7 digits'
            },
            'driving_license': {
                'number_pattern': r'\b[A-Z]{2}\d{13}\b',
                'keywords': ['driving', 'license', 'licence', 'transport'],
                'number_length': 15,
                'requires_photo': True,
                'description': 'Driving License with state code + 13 digits'
            },
            'passport': {
                'number_pattern': r'\b[A-Z]\d{7}\b',
                'keywords': ['passport', 'republic of india', 'surname'],
                'number_length': 8,
                'requires_photo': True,
                'description': 'Passport with 1 letter + 7 digits'
            },
            'ration_card': {
                'number_pattern': r'\b\d{8,15}\b',
                'keywords': ['ration', 'food', 'supply', 'bpl', 'apl'],
                'number_length': None,  # Variable length
                'requires_photo': False,
                'description': 'Ration Card'
            }
        }
    
    def detect_document_type(self, ocr_text: str) -> str:
        """
        Detect what type of document was actually uploaded based on text and patterns
        
        Args:
            ocr_text: Extracted OCR text
        
        Returns:
            Detected document type or 'unknown'
        """
        ocr_lower = ocr_text.lower()
        detected_types = []
        
        # Check each document type
        for doc_type, patterns in self.document_patterns.items():
            # Check for keywords
            keyword_matches = sum(1 for keyword in patterns['keywords'] 
                                if keyword in ocr_lower)
            
            # Check for number pattern
            number_match = re.search(patterns['number_pattern'], ocr_text, re.IGNORECASE)
            
            if keyword_matches > 0 or number_match:
                score = keyword_matches * 2 + (1 if number_match else 0)
                detected_types.append((doc_type, score))
        
        if detected_types:
            # Return type with highest score
            detected_types.sort(key=lambda x: x[1], reverse=True)
            detected = detected_types[0][0]
            print(f"🔍 Detected document type: {detected}")
            return detected
        
        print("⚠️  Could not detect document type")
        return 'unknown'
    
    def validate_document_type_match(self, ocr_text: str, expected_type: str) -> Dict:
        """
        Validate that the uploaded document matches the expected type
        
        Args:
            ocr_text: Extracted OCR text
            expected_type: Expected document type (aadhaar, pan, voter_id, etc.)
        
        Returns:
            Validation result with match status
        """
        detected_type = self.detect_document_type(ocr_text)
        
        # Normalize type names
        type_mapping = {
            'national_id': ['aadhaar', 'voter_id', 'driving_license'],
            'aadhaar': ['aadhaar'],
            'pan': ['pan'],
            'voter_id': ['voter_id'],
            'driving_license': ['driving_license'],
            'passport': ['passport']
        }
        
        expected_types = type_mapping.get(expected_type, [expected_type])
        
        if detected_type == 'unknown':
            return {
                'matches': False,
                'detected': 'unknown',
                'expected': expected_type,
                'error': f"Could not identify document type. Please upload a clear {expected_type.replace('_', ' ').title()}"
            }
        
        if detected_type not in expected_types:
            expected_desc = self.document_patterns.get(expected_type, {}).get('description', expected_type)
            detected_desc = self.document_patterns.get(detected_type, {}).get('description', detected_type)
            
            return {
                'matches': False,
                'detected': detected_type,
                'expected': expected_type,
                'error': f"Wrong document type uploaded! Detected: {detected_desc}. Please upload: {expected_desc}"
            }
        
        return {
            'matches': True,
            'detected': detected_type,
            'expected': expected_type
        }
    
    def validate_aadhaar(self, ocr_text: str, face_detected: bool, image_path: Optional[str] = None) -> Dict:
        """
        Validate Aadhaar card requirements:
        - Must have 12-digit Aadhaar number
        - Must have photo (verified by face detection)
        - Must have name
        
        Args:
            ocr_text: Extracted OCR text
            face_detected: Whether a face was detected in the document
            image_path: Optional path to image for additional checks
        
        Returns:
            Validation result dictionary
        """
        issues = []
        is_valid = True
        extracted_data = {}
        
        # 1. Check for 12-digit Aadhaar number
        aadhaar_patterns = [
            r'\b(\d{4}\s?\d{4}\s?\d{4})\b',
            r'(?:Aadhaar|Aadhar|UID)[\s:]+(\d{4}\s?\d{4}\s?\d{4})',
        ]
        
        aadhaar_found = False
        for pattern in aadhaar_patterns:
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                aadhaar_num = match.group(1).replace(' ', '').replace('-', '')
                if len(aadhaar_num) == 12 and aadhaar_num.isdigit():
                    aadhaar_found = True
                    extracted_data['aadhaar_number'] = aadhaar_num
                    extracted_data['aadhaar_masked'] = f"{aadhaar_num[:4]}****{aadhaar_num[-4:]}"
                    print(f"✅ Valid Aadhaar number found: {extracted_data['aadhaar_masked']}")
                    break
        
        if not aadhaar_found:
            is_valid = False
            issues.append("Aadhaar card must contain a valid 12-digit number")
            print("❌ No valid 12-digit Aadhaar number found")
        
        # 2. Check for photo (via face detection)
        if not face_detected:
            is_valid = False
            issues.append("Aadhaar card must contain a clear photo with detectable face")
            print("❌ No face detected in Aadhaar card photo")
        else:
            print("✅ Photo with face detected on Aadhaar card")
        
        # 3. Check for name
        name_patterns = [
            r'Name[:\s]+([A-Za-z\s]{3,50})',
            r'\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b',
        ]
        
        name_found = False
        for pattern in name_patterns:
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                if len(name) >= 3:
                    name_found = True
                    extracted_data['name'] = name
                    print(f"✅ Name found: {name}")
                    break
        
        if not name_found:
            issues.append("Aadhaar card must contain a readable name")
            print("⚠️  No clear name found on Aadhaar card")
        
        # 4. Check for gender
        gender_match = re.search(r'\b(Male|Female|MALE|FEMALE|M|F)\b', ocr_text, re.IGNORECASE)
        if gender_match:
            extracted_data['gender'] = gender_match.group(1).upper()
            print(f"✅ Gender found: {extracted_data['gender']}")
        
        # 5. Check for date of birth or year of birth
        dob_patterns = [
            r'(?:DOB|Date of Birth)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
            r'(?:YOB|Year of Birth)[:\s]+(\d{4})',
        ]
        
        for pattern in dob_patterns:
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                extracted_data['dob'] = match.group(1)
                print(f"✅ DOB/YOB found: {extracted_data['dob']}")
                break
        
        return convert_to_native_types({
            "is_valid": is_valid,
            "document_type": "aadhaar",
            "issues": issues,
            "extracted_data": extracted_data,
            "validation_passed": is_valid and len(issues) == 0
        })
    
    def validate_pan(self, ocr_text: str) -> Dict:
        """
        Validate PAN card requirements:
        - Must have 10-character PAN number (ABCDE1234F format)
        - Must have name
        
        Args:
            ocr_text: Extracted OCR text
        
        Returns:
            Validation result dictionary
        """
        issues = []
        is_valid = True
        extracted_data = {}
        
        # 1. Check for PAN number (10 alphanumeric: ABCDE1234F)
        pan_pattern = r'\b([A-Z]{5}\d{4}[A-Z])\b'
        pan_match = re.search(pan_pattern, ocr_text)
        
        if pan_match:
            extracted_data['pan_number'] = pan_match.group(1)
            print(f"✅ Valid PAN number found: {pan_match.group(1)}")
        else:
            is_valid = False
            issues.append("PAN card must contain a valid 10-character PAN number")
            print("❌ No valid PAN number found")
        
        # 2. Check for name
        name_patterns = [
            r'Name[:\s]+([A-Za-z\s]{3,50})',
            r'\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b',
        ]
        
        name_found = False
        for pattern in name_patterns:
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                if len(name) >= 3:
                    name_found = True
                    extracted_data['name'] = name
                    print(f"✅ Name found: {name}")
                    break
        
        if not name_found:
            issues.append("PAN card must contain a readable name")
        
        return convert_to_native_types({
            "is_valid": is_valid,
            "document_type": "pan",
            "issues": issues,
            "extracted_data": extracted_data,
            "validation_passed": is_valid and len(issues) == 0
        })
    
    def validate_document(self, ocr_text: str, face_detected: bool, 
                         document_type: str = "auto", image_path: Optional[str] = None,
                         expected_type: Optional[str] = None) -> Dict:
        """
        Validate document based on type and ensure it matches expected type
        
        Args:
            ocr_text: Extracted OCR text
            face_detected: Whether a face was detected
            document_type: Type of document or 'auto' to detect
            image_path: Optional path to image
            expected_type: Expected document type (what user should upload)
        
        Returns:
            Validation result dictionary
        """
        # Step 1: Check if document type matches expected type
        if expected_type and expected_type != "auto":
            type_match = self.validate_document_type_match(ocr_text, expected_type)
            if not type_match.get('matches', False):
                print(f"❌ Document type mismatch: {type_match.get('error')}")
                return convert_to_native_types({
                    "is_valid": False,
                    "document_type": type_match.get('detected', 'unknown'),
                    "expected_type": expected_type,
                    "issues": [type_match.get('error')],
                    "extracted_data": {},
                    "validation_passed": False,
                    "type_mismatch": True
                })
            
            # Use detected type for validation
            document_type = type_match.get('detected', document_type)
        
        # Step 2: Auto-detect document type if not specified
        if document_type == "auto":
            document_type = self.detect_document_type(ocr_text)
            if document_type == "unknown":
                return convert_to_native_types({
                    "is_valid": False,
                    "document_type": "unknown",
                    "issues": ["Could not identify document type. Please upload a clear document photo"],
                    "extracted_data": {},
                    "validation_passed": False
                })
        
        # Step 3: Validate based on detected document type
        if document_type == "aadhaar":
            return self.validate_aadhaar(ocr_text, face_detected, image_path)
        elif document_type == "pan":
            return self.validate_pan(ocr_text)
        elif document_type in ['voter_id', 'driving_license', 'passport']:
            # Generic validation for other ID types with photo requirement
            pattern = self.document_patterns.get(document_type, {})
            issues = []
            
            if pattern.get('requires_photo') and not face_detected:
                issues.append(f"{pattern.get('description', document_type)} must contain a clear photo")
            
            number_match = re.search(pattern.get('number_pattern', r''), ocr_text)
            if not number_match:
                issues.append(f"{pattern.get('description', document_type)} must contain valid identification number")
            
            return convert_to_native_types({
                "is_valid": len(issues) == 0,
                "document_type": document_type,
                "issues": issues,
                "extracted_data": {},
                "validation_passed": len(issues) == 0
            })
        else:
            # Unknown document type - reject
            return convert_to_native_types({
                "is_valid": False,
                "document_type": document_type,
                "issues": [f"Unsupported document type: {document_type}. Please upload Aadhaar, PAN, Voter ID, Driving License, or Passport"],
                "extracted_data": {},
                "validation_passed": False
            })

# Global instance
document_validator = DocumentValidator()

# Export
__all__ = ['DocumentValidator', 'document_validator']
