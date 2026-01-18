"""Google Maps Service for Collabthon Platform"""

import os
import googlemaps
from typing import Dict, List, Optional
from app.core.config import settings
import requests


class MapsService:
    def __init__(self):
        self.api_key = settings.GOOGLE_MAPS_API_KEY
        self._client = None
        
    @property
    def client(self):
        if not self.api_key:
            return None
        if self._client is None:
            try:
                self._client = googlemaps.Client(key=self.api_key)
            except Exception as e:
                print(f"Warning: Could not initialize Google Maps client: {e}")
                return None
        return self._client
    
    def get_coordinates(self, address: str) -> Optional[Dict]:
        """Get coordinates (lat, lng) for an address"""
        if not self.client:
            return None
            
        try:
            geocode_result = self.client.geocode(address)
            if geocode_result:
                location = geocode_result[0]['geometry']['location']
                return {
                    'latitude': location['lat'],
                    'longitude': location['lng']
                }
        except Exception as e:
            print(f"Error getting coordinates: {e}")
            return None
    
    def get_address_from_coordinates(self, lat: float, lng: float) -> Optional[str]:
        """Get address from coordinates"""
        if not self.client:
            return None
            
        try:
            reverse_geocode_result = self.client.reverse_geocode((lat, lng))
            if reverse_geocode_result:
                return reverse_geocode_result[0]['formatted_address']
        except Exception as e:
            print(f"Error getting address from coordinates: {e}")
            return None
    
    def calculate_distance(self, origin: str, destination: str) -> Optional[Dict]:
        """Calculate distance and duration between two locations"""
        if not self.client:
            return None
            
        try:
            directions_result = self.client.directions(origin, destination, mode="driving")
            if directions_result:
                leg = directions_result[0]['legs'][0]
                return {
                    'distance': leg['distance']['text'],
                    'duration': leg['duration']['text'],
                    'distance_value': leg['distance']['value'],  # in meters
                    'duration_value': leg['duration']['value']   # in seconds
                }
        except Exception as e:
            print(f"Error calculating distance: {e}")
            return None
    
    def get_nearby_places(self, location: str, place_type: str = "university", radius: int = 5000) -> List[Dict]:
        """Get nearby places of a specific type"""
        if not self.client:
            return []
            
        try:
            # First get coordinates for the location
            coords = self.get_coordinates(location)
            if not coords:
                return []
            
            # Search for nearby places
            places_result = self.client.places_nearby(
                location=(coords['latitude'], coords['longitude']),
                radius=radius,
                type=place_type
            )
            
            places = []
            for place in places_result.get('results', []):
                places.append({
                    'name': place.get('name'),
                    'address': place.get('vicinity'),
                    'rating': place.get('rating', 0),
                    'place_id': place.get('place_id'),
                    'coordinates': {
                        'latitude': place['geometry']['location']['lat'],
                        'longitude': place['geometry']['location']['lng']
                    },
                    'types': place.get('types', [])
                })
            
            return places
        except Exception as e:
            print(f"Error getting nearby places: {e}")
            return []


# Global instance
maps_service = MapsService()