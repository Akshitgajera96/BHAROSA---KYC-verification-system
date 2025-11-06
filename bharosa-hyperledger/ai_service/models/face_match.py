# 👤 Face Matching Module using DeepFace
import cv2
import numpy as np
from typing import Dict, Optional
from deepface import DeepFace
import os

class FaceMatcher:
    """
    Face matching service using DeepFace
    """
    
    def __init__(self, model_name: str = "Facenet", distance_metric: str = "cosine"):
        """
        Initialize face matcher - OPTIMIZED
        
        Args:
            model_name: DeepFace model to use (Facenet=90MB FAST, VGG-Face=580MB, OpenFace, etc.)
            distance_metric: Distance metric (cosine, euclidean, euclidean_l2)
        """
        self.model_name = model_name
        self.distance_metric = distance_metric
        self.model_cache = None
        print(f"🎭 Face Matcher initialized with {model_name} model (OPTIMIZED)")
    
    def compare_faces(self, id_image_path: str, selfie_path: str) -> Dict:
        """
        Compare faces between ID document and selfie
        
        Args:
            id_image_path: Path to ID document image
            selfie_path: Path to selfie image
        
        Returns:
            Dictionary with match results
        """
        try:
            print(f"👤 Comparing faces...")
            print(f"   ID Image: {id_image_path}")
            print(f"   Selfie: {selfie_path}")
            
            # Verify both images
            result = DeepFace.verify(
                img1_path=id_image_path,
                img2_path=selfie_path,
                model_name=self.model_name,
                distance_metric=self.distance_metric,
                enforce_detection=True
            )
            
            # Calculate similarity score (0-1 range)
            # Convert distance to similarity
            if self.distance_metric == "cosine":
                similarity = 1 - result["distance"]
            elif self.distance_metric == "euclidean":
                # Normalize euclidean distance
                similarity = 1 / (1 + result["distance"])
            else:
                similarity = 1 - result["distance"]
            
            # Ensure similarity is between 0 and 1
            similarity = max(0.0, min(1.0, similarity))
            
            print(f"✅ Face match completed")
            print(f"   Verified: {result['verified']}")
            print(f"   Distance: {result['distance']:.4f}")
            print(f"   Similarity: {similarity:.4f}")
            
            return {
                "success": True,
                "match": bool(result["verified"]),  # Convert np.bool_ to Python bool
                "similarity": round(float(similarity), 4),
                "distance": round(float(result["distance"]), 4),
                "threshold": float(result["threshold"]),
                "model": self.model_name,
                "facial_areas": {
                    "id_image": result.get("facial_areas", {}).get("img1"),
                    "selfie": result.get("facial_areas", {}).get("img2")
                }
            }
            
        except ValueError as e:
            # Face not detected
            print(f"⚠️  Face detection failed: {str(e)}")
            return {
                "success": False,
                "match": False,
                "similarity": 0.0,
                "error": "Face not detected in one or both images",
                "details": str(e)
            }
        
        except Exception as e:
            print(f"❌ Face matching error: {str(e)}")
            return {
                "success": False,
                "match": False,
                "similarity": 0.0,
                "error": f"Face matching failed: {str(e)}"
            }
    
    def detect_faces(self, image_path: str) -> Dict:
        """
        Detect faces in an image
        
        Args:
            image_path: Path to image file
        
        Returns:
            Dictionary with detected faces
        """
        try:
            print(f"🔍 Detecting faces in: {image_path}")
            
            # Detect faces
            faces = DeepFace.extract_faces(
                img_path=image_path,
                detector_backend="opencv",
                enforce_detection=False
            )
            
            face_count = len(faces)
            print(f"✅ Detected {face_count} face(s)")
            
            return {
                "success": True,
                "face_count": face_count,
                "faces": [
                    {
                        "confidence": face.get("confidence", 0),
                        "facial_area": face.get("facial_area", {})
                    }
                    for face in faces
                ]
            }
            
        except Exception as e:
            print(f"❌ Face detection error: {str(e)}")
            return {
                "success": False,
                "face_count": 0,
                "error": str(e)
            }
    
    def analyze_face_attributes(self, image_path: str) -> Dict:
        """
        Analyze face attributes (age, gender, emotion, race)
        
        Args:
            image_path: Path to image file
        
        Returns:
            Dictionary with face attributes
        """
        try:
            print(f"📊 Analyzing face attributes...")
            
            # Analyze face
            analysis = DeepFace.analyze(
                img_path=image_path,
                actions=['age', 'gender', 'emotion', 'race'],
                enforce_detection=False
            )
            
            # Handle list or dict result
            if isinstance(analysis, list):
                analysis = analysis[0] if analysis else {}
            
            print(f"✅ Face analysis completed")
            
            return {
                "success": True,
                "age": analysis.get("age"),
                "gender": analysis.get("dominant_gender"),
                "emotion": analysis.get("dominant_emotion"),
                "race": analysis.get("dominant_race"),
                "region": analysis.get("region")
            }
            
        except Exception as e:
            print(f"⚠️  Face analysis error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# Create global instance
face_matcher = FaceMatcher()

# Export
__all__ = ['FaceMatcher', 'face_matcher']
