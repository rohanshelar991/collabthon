"""Google Services Integration Module for Collabthon"""

import os
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.cloud import storage, vision
import stripe
import googlemaps
from app.core.config import settings

class GoogleServices:
    def __init__(self):
        self.google_client_id = settings.GOOGLE_CLIENT_ID
        self.recaptcha_secret = settings.GOOGLE_RECAPTCHA_SECRET
        
    def verify_recaptcha(self, token: str) -> bool:
        """Verify reCAPTCHA token"""
        import requests
        
        payload = {
            'secret': self.recaptcha_secret,
            'response': token
        }
        
        response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data=payload
        )
        
        result = response.json()
        return result.get('success', False)
    
    def verify_google_token(self, token: str) -> dict:
        """Verify Google OAuth token"""
        try:
            # Verify the token and get user info
            idinfo = id_token.verify_oauth2_token(
                token, 
                Request(), 
                self.google_client_id
            )
            
            # Check if the token is from a valid domain (optional)
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
                
            return {
                'email': idinfo.get('email'),
                'name': idinfo.get('name'),
                'picture': idinfo.get('picture'),
                'sub': idinfo.get('sub')
            }
        except Exception as e:
            raise ValueError(f'Invalid token: {str(e)}')

class StorageService:
    def __init__(self):
        # Initialize Google Cloud Storage client lazily
        # In production, use service account key
        self._client = None
    
    @property
    def client(self):
        if self._client is None:
            try:
                self._client = storage.Client()
            except Exception as e:
                print(f"Warning: Could not initialize Google Cloud Storage: {e}")
                self._client = None
        return self._client
    
    def upload_file(self, bucket_name: str, source_file_name: str, destination_blob_name: str):
        """Upload a file to Google Cloud Storage"""
        if not self.client:
            raise Exception("Google Cloud Storage not available")
        
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)
        
        blob.upload_from_filename(source_file_name)
        return f"gs://{bucket_name}/{destination_blob_name}"
    
    def download_file(self, bucket_name: str, source_blob_name: str, destination_file_name: str):
        """Download a file from Google Cloud Storage"""
        if not self.client:
            raise Exception("Google Cloud Storage not available")
            
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(source_blob_name)
        
        blob.download_to_filename(destination_file_name)

class VisionService:
    def __init__(self):
        # Initialize Google Cloud Vision client lazily
        self._client = None
    
    @property
    def client(self):
        if self._client is None:
            try:
                self._client = vision.ImageAnnotatorClient()
            except Exception as e:
                print(f"Warning: Could not initialize Google Cloud Vision: {e}")
                self._client = None
        return self._client
    
    def detect_text(self, image_path: str):
        """Detect text in an image using Google Vision API"""
        if not self.client:
            raise Exception("Google Cloud Vision not available")
            
        with open(image_path, 'rb') as image_file:
            content = image_file.read()
        
        image = vision.Image(content=content)
        response = self.client.text_detection(image=image)
        texts = response.text_annotations
        
        if response.error.message:
            raise Exception(f'Vision API error: {response.error.message}')
        
        return [text.description for text in texts]

# Global instance
google_services = GoogleServices()
storage_service = StorageService()
vision_service = VisionService()

# Import and expose additional services
from .maps_service import maps_service
from .translation_service import translation_service