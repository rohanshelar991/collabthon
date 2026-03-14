"use client";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

export function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return <p className="text-xs text-slate-500">Add GOOGLE_MAPS_API_KEY to show map.</p>;
  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={[places]}>
      <GoogleMap mapContainerStyle={{ width: "100%", height: "220px", borderRadius: 16 }} center={{ lat, lng }} zoom={12}>
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </LoadScript>
  );
}
