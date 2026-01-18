"""Google Translation Service for Collabthon Platform"""

try:
    from google.cloud import translate_v2 as translate
except ImportError:
    translate = None  # Fallback if library not available
from typing import Dict, List, Optional
from app.core.config import settings
import os


class TranslationService:
    def __init__(self):
        self.api_key = settings.GOOGLE_TRANSLATE_API_KEY
        self._client = None
        
    @property
    def client(self):
        if not self.api_key:
            return None
        if self._client is None:
            try:
                # Initialize with API key
                self._client = translate.Client()
            except Exception as e:
                print(f"Warning: Could not initialize Google Translation client: {e}")
                return None
        return self._client
    
    def translate_text(self, text: str, target_language: str, source_language: str = None) -> Optional[Dict]:
        """Translate text to target language"""
        if not self.client:
            return None
            
        try:
            if isinstance(text, bytes):
                text = text.decode("utf-8")
            
            # Perform translation
            result = self.client.translate(
                text,
                target_language=target_language,
                source_language=source_language
            )
            
            return {
                'translated_text': result['translatedText'],
                'detected_source_language': result.get('detectedSourceLanguage', source_language),
                'target_language': target_language
            }
        except Exception as e:
            print(f"Translation error: {e}")
            return None
    
    def detect_language(self, text: str) -> Optional[Dict]:
        """Detect the language of the given text"""
        if not self.client:
            return None
            
        try:
            if isinstance(text, bytes):
                text = text.decode("utf-8")
            
            result = self.client.detect_language(text)
            return {
                'language': result['language'],
                'confidence': result.get('confidence', 0)
            }
        except Exception as e:
            print(f"Language detection error: {e}")
            return None
    
    def get_supported_languages(self) -> List[Dict]:
        """Get list of supported languages"""
        if not self.client:
            return []
            
        try:
            languages = self.client.get_languages()
            return [
                {
                    'language_code': lang['languageCode'],
                    'name': lang['name']
                }
                for lang in languages
            ]
        except Exception as e:
            print(f"Error getting supported languages: {e}")
            return []
    
    def translate_document(self, text_list: List[str], target_language: str, source_language: str = None) -> Optional[List[Dict]]:
        """Translate multiple texts at once"""
        if not self.client:
            return None
            
        try:
            results = []
            for text in text_list:
                if isinstance(text, bytes):
                    text = text.decode("utf-8")
                
                result = self.client.translate(
                    text,
                    target_language=target_language,
                    source_language=source_language
                )
                
                results.append({
                    'original_text': text,
                    'translated_text': result['translatedText'],
                    'detected_source_language': result.get('detectedSourceLanguage', source_language),
                    'target_language': target_language
                })
            
            return results
        except Exception as e:
            print(f"Document translation error: {e}")
            return None


# Global instance
translation_service = TranslationService()