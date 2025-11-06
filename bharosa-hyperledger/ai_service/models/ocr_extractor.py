# 📝 OCR Text Extraction Module using Tesseract
import cv2
import numpy as np
import pytesseract
from typing import Dict, Optional
import re

class OCRExtractor:
    """
    OCR text extraction service using Tesseract
    """
    
    def __init__(self):
        """
        Initialize OCR extractor
        """
        print("📝 OCR Extractor initialized")
        
        # Try to set tesseract path for Windows
        try:
            import platform
            if platform.system() == "Windows":
                pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        except:
            pass
    
    def extract_text(self, image_path: str, lang: str = 'eng') -> Dict:
        """
        Extract text from image using OCR
        
        Args:
            image_path: Path to image file
            lang: Language code (default: 'eng' for English)
        
        Returns:
            Dictionary with extracted text and confidence
        """
        try:
            print(f"📝 Extracting text from: {image_path}")
            
            # Load and preprocess image
            img = cv2.imread(image_path)
            if img is None:
                return {
                    "success": False,
                    "text": "",
                    "error": "Cannot load image"
                }
            
            # Preprocess image for better OCR
            processed_img = self._preprocess_for_ocr(img)
            
            # Extract text with confidence
            ocr_data = pytesseract.image_to_data(
                processed_img,
                lang=lang,
                output_type=pytesseract.Output.DICT
            )
            
            # Extract text
            text = pytesseract.image_to_string(processed_img, lang=lang)
            
            # Clean extracted text
            cleaned_text = self._clean_text(text)
            
            # Calculate average confidence
            confidences = [int(conf) for conf in ocr_data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Extract structured data
            extracted_data = self._extract_structured_data(cleaned_text)
            
            print(f"✅ OCR completed")
            print(f"   Text length: {len(cleaned_text)} characters")
            print(f"   Confidence: {avg_confidence:.2f}%")
            
            return {
                "success": True,
                "text": cleaned_text,
                "raw_text": text,
                "confidence": round(avg_confidence / 100, 4),  # Normalize to 0-1
                "word_count": len(cleaned_text.split()),
                "extracted_data": extracted_data
            }
            
        except Exception as e:
            print(f"❌ OCR error: {str(e)}")
            return {
                "success": False,
                "text": "",
                "error": f"OCR extraction failed: {str(e)}"
            }
    
    def _preprocess_for_ocr(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for better OCR results
        
        Args:
            image: Input image as numpy array
        
        Returns:
            Preprocessed image
        """
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply denoising
            denoised = cv2.fastNlMeansDenoising(gray, h=10)
            
            # Apply adaptive thresholding
            thresh = cv2.adaptiveThreshold(
                denoised,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                11,
                2
            )
            
            # Morphological operations to remove noise
            kernel = np.ones((1, 1), np.uint8)
            processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel)
            
            return processed
            
        except Exception as e:
            print(f"⚠️  Preprocessing error: {e}, using original image")
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    def _clean_text(self, text: str) -> str:
        """
        Clean extracted text
        
        Args:
            text: Raw OCR text
        
        Returns:
            Cleaned text
        """
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep important ones
        cleaned = re.sub(r'[^\w\s\-.,:/]', '', cleaned)
        
        # Trim
        cleaned = cleaned.strip()
        
        return cleaned
    
    def _extract_structured_data(self, text: str) -> Dict:
        """
        Extract structured data from text (name, ID number, dates, etc.)
        
        Args:
            text: Cleaned text
        
        Returns:
            Dictionary with extracted structured data
        """
        extracted = {}
        
        # Extract name patterns (e.g., "Name: John Doe")
        name_patterns = [
            r'Name[:\s]+([A-Za-z\s]+)',
            r'Full\s+Name[:\s]+([A-Za-z\s]+)',
        ]
        for pattern in name_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                extracted['name'] = match.group(1).strip()
                break
        
        # Extract Aadhaar number (12 digits, may have spaces)
        aadhaar_patterns = [
            r'\b(\d{4}\s?\d{4}\s?\d{4})\b',  # 1234 5678 9012 or 123456789012
            r'(?:Aadhaar|Aadhar|UID)[\s:]+(\d{4}\s?\d{4}\s?\d{4})',
        ]
        for pattern in aadhaar_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                aadhaar_num = match.group(1).replace(' ', '').replace('-', '')
                if len(aadhaar_num) == 12 and aadhaar_num.isdigit():
                    extracted['aadhaar_number'] = aadhaar_num
                    extracted['document_type'] = 'aadhaar'
                    print(f"✅ Extracted Aadhaar: {aadhaar_num[:4]}****{aadhaar_num[-4:]}")
                    break
        
        # Extract PAN card number (10 alphanumeric: ABCDE1234F)
        pan_match = re.search(r'\b([A-Z]{5}\d{4}[A-Z])\b', text)
        if pan_match:
            extracted['pan_number'] = pan_match.group(1)
            extracted['document_type'] = 'pan'
            print(f"✅ Extracted PAN: {pan_match.group(1)}")
        
        # Extract other ID/document numbers (various formats)
        id_patterns = [
            r'(?:ID|Document|Passport|License)\s*(?:No|Number|#)?[:\s]+([A-Z0-9\-]+)',
            r'\b([A-Z]{1,3}\d{6,10})\b',
        ]
        if 'aadhaar_number' not in extracted and 'pan_number' not in extracted:
            for pattern in id_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    extracted['document_number'] = match.group(1).strip()
                    break
        
        # Extract dates (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
        date_patterns = [
            r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',
            r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b',
        ]
        dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            dates.extend(matches)
        if dates:
            extracted['dates'] = dates
            if len(dates) >= 1:
                extracted['date_of_birth'] = dates[0]
        
        # Extract gender
        gender_match = re.search(r'\b(Male|Female|M|F|MALE|FEMALE)\b', text, re.IGNORECASE)
        if gender_match:
            extracted['gender'] = gender_match.group(1).upper()
        
        # Extract address patterns (simple)
        address_match = re.search(r'Address[:\s]+([A-Za-z0-9\s,.-]+)', text, re.IGNORECASE)
        if address_match:
            extracted['address'] = address_match.group(1).strip()
        
        # Extract year of birth (4 digits)
        yob_match = re.search(r'(?:Year of Birth|YOB|DOB)[:\s]+(\d{4})', text, re.IGNORECASE)
        if yob_match:
            extracted['year_of_birth'] = yob_match.group(1)
        
        return extracted
    
    def extract_specific_field(self, image_path: str, field_region: tuple) -> Dict:
        """
        Extract text from specific region of image
        
        Args:
            image_path: Path to image file
            field_region: Tuple (x, y, width, height) defining region
        
        Returns:
            Dictionary with extracted text from region
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {"success": False, "error": "Cannot load image"}
            
            x, y, w, h = field_region
            roi = img[y:y+h, x:x+w]
            
            # Process ROI
            processed = self._preprocess_for_ocr(roi)
            text = pytesseract.image_to_string(processed)
            cleaned = self._clean_text(text)
            
            return {
                "success": True,
                "text": cleaned,
                "region": field_region
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Create global instance
ocr_extractor = OCRExtractor()

# Export
__all__ = ['OCRExtractor', 'ocr_extractor']
