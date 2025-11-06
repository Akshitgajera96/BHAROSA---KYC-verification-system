# 📁 File Utility Functions for AI Service
import os
import uuid
import tempfile
from pathlib import Path
from typing import Optional
import shutil
import cv2
import numpy as np
from PIL import Image

# Temporary directory for file storage
TEMP_DIR = Path(tempfile.gettempdir()) / "bharosa_ai"
TEMP_DIR.mkdir(exist_ok=True)

def save_uploaded_file(file_content: bytes, file_extension: str = ".jpg") -> str:
    """
    Save uploaded file to temporary storage
    
    Args:
        file_content: Binary file content
        file_extension: File extension (e.g., '.jpg', '.png')
    
    Returns:
        Path to saved file
    """
    filename = f"{uuid.uuid4()}{file_extension}"
    filepath = TEMP_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(file_content)
    
    return str(filepath)

def cleanup_file(filepath: str) -> bool:
    """
    Delete temporary file
    
    Args:
        filepath: Path to file to delete
    
    Returns:
        True if deleted successfully
    """
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file {filepath}: {e}")
        return False

def cleanup_multiple_files(*filepaths: str) -> None:
    """
    Delete multiple temporary files
    
    Args:
        *filepaths: Variable number of file paths
    """
    for filepath in filepaths:
        cleanup_file(filepath)

def validate_image_file(filepath: str) -> bool:
    """
    Validate if file is a valid image
    
    Args:
        filepath: Path to image file
    
    Returns:
        True if valid image
    """
    try:
        img = Image.open(filepath)
        img.verify()
        return True
    except Exception as e:
        print(f"Invalid image file: {e}")
        return False

def load_image_cv2(filepath: str) -> Optional[np.ndarray]:
    """
    Load image using OpenCV
    
    Args:
        filepath: Path to image file
    
    Returns:
        Image as numpy array or None if failed
    """
    try:
        img = cv2.imread(filepath)
        if img is None:
            print(f"Failed to load image: {filepath}")
            return None
        return img
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

def preprocess_image(image: np.ndarray, target_size: tuple = (640, 480)) -> np.ndarray:
    """
    Preprocess image for analysis
    
    Args:
        image: Input image as numpy array
        target_size: Target size for resizing (width, height)
    
    Returns:
        Preprocessed image
    """
    try:
        # Resize image
        resized = cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)
        
        # Enhance contrast
        lab = cv2.cvtColor(resized, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        return enhanced
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return image

def check_image_quality(filepath: str) -> dict:
    """
    Check basic image quality metrics
    
    Args:
        filepath: Path to image file
    
    Returns:
        Dictionary with quality metrics
    """
    try:
        img = cv2.imread(filepath)
        if img is None:
            return {"valid": False, "error": "Cannot load image"}
        
        # Check dimensions
        height, width = img.shape[:2]
        min_dimension = min(height, width)
        
        # Check if image is too small
        if min_dimension < 200:
            return {
                "valid": False,
                "error": "Image too small",
                "dimensions": (width, height)
            }
        
        # Calculate blur (Laplacian variance)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Check brightness
        brightness = np.mean(gray)
        
        is_clear = blur_score > 100  # Threshold for blur detection
        is_bright_enough = 40 < brightness < 220  # Not too dark or overexposed
        
        return {
            "valid": is_clear and is_bright_enough,
            "dimensions": (width, height),
            "blur_score": float(blur_score),
            "brightness": float(brightness),
            "is_clear": is_clear,
            "is_bright_enough": is_bright_enough
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}

def detect_file_tampering(filepath: str) -> dict:
    """
    Basic tampering detection checks
    
    Args:
        filepath: Path to image file
    
    Returns:
        Dictionary with tampering check results
    """
    try:
        # Check file metadata
        file_stat = os.stat(filepath)
        file_size = file_stat.st_size
        
        # Load image
        img = cv2.imread(filepath)
        if img is None:
            return {"suspicious": True, "reason": "Cannot load image"}
        
        # Check for suspicious patterns (very basic)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Check for excessive noise or artifacts
        noise_level = np.std(gray)
        
        # Detect edges (tampered images often have unusual edge patterns)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        # Basic checks
        suspicious = False
        reasons = []
        
        if file_size < 10000:  # Very small file
            suspicious = True
            reasons.append("File size too small")
        
        if noise_level > 80:  # Too much noise
            suspicious = True
            reasons.append("Excessive noise detected")
        
        if edge_density < 0.01:  # Too few edges (might be blank/fake)
            suspicious = True
            reasons.append("Insufficient detail")
        
        return {
            "suspicious": suspicious,
            "reasons": reasons,
            "file_size": file_size,
            "noise_level": float(noise_level),
            "edge_density": float(edge_density)
        }
    except Exception as e:
        return {"suspicious": True, "reason": f"Analysis error: {str(e)}"}

def cleanup_temp_directory():
    """
    Clean up old temporary files (older than 1 hour)
    """
    try:
        import time
        current_time = time.time()
        
        for filepath in TEMP_DIR.glob("*"):
            if filepath.is_file():
                file_age = current_time - filepath.stat().st_mtime
                if file_age > 3600:  # 1 hour
                    filepath.unlink()
                    print(f"Cleaned up old file: {filepath}")
    except Exception as e:
        print(f"Error cleaning temp directory: {e}")

# Export functions
__all__ = [
    'save_uploaded_file',
    'cleanup_file',
    'cleanup_multiple_files',
    'validate_image_file',
    'load_image_cv2',
    'preprocess_image',
    'check_image_quality',
    'detect_file_tampering',
    'cleanup_temp_directory'
]
