"use client";

import { useState, useEffect } from "react";
import { MapPin, X, Search, Save } from "lucide-react";

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
}

export default function LeafletLocationPicker({
  value,
  onChange,
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<[number, number]>([40.7128, -74.006]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMounted) return;

    // Dynamically import Leaflet only when modal opens
    let mapInstance: any = null;
    let markerInstance: any = null;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });

      // Wait for container to be in DOM
      await new Promise((resolve) => setTimeout(resolve, 100));

      const container = document.getElementById("map-container");
      if (!container) return;

      // Initialize map
      mapInstance = L.map(container).setView(position, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);

      // Add marker
      markerInstance = L.marker(position).addTo(mapInstance);

      // Handle map clicks
      mapInstance.on("click", async (e: any) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Update marker position
        markerInstance.setLatLng([lat, lng]);
        setPosition([lat, lng]);

        // Reverse geocode
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: {
                "User-Agent": "EventTicketBooking/1.0",
              },
            }
          );
          const data = await response.json();
          setSearchQuery(
            data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          );
        } catch (error) {
          console.error("Geocoding error:", error);
          setSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      });

      setMap(mapInstance);
    };

    // Just call initMap directly
    initMap();

    // Cleanup
    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [isOpen, isMounted]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !map) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "EventTicketBooking/1.0",
          },
        }
      );
      const data = await response.json();

      if (data && data[0]) {
        const { lat, lon, display_name } = data[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        setSearchQuery(display_name);
        setHasSelectedLocation(true);

        // Update map view
        if (map) {
          const L = await import("leaflet");
          map.setView(newPos, 13);

          // Update marker
          const markers: any[] = [];
          map.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) {
              markers.push(layer);
            }
          });
          markers.forEach((marker) => marker.setLatLng(newPos));
        }
      } else {
        alert("Location not found. Please try a different search.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Failed to search location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleConfirm = () => {
    if (searchQuery) {
      onChange(searchQuery);
      setIsOpen(false);
    }
  };

  const handleSaveLocation = () => {
    if (searchQuery && hasSelectedLocation) {
      onChange(searchQuery);
      setIsOpen(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter event location"
        />
        <button
          type="button"
          disabled
          className="px-4 py-2 bg-gray-400 text-white rounded-lg flex items-center gap-2 whitespace-nowrap"
        >
          <MapPin className="w-4 h-4" />
          Loading...
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter event location"
        />
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <MapPin className="w-4 h-4" />
          Pick Location
        </button>
      </div>

      {/* Map Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Select Location
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Click on the map or search to select a location
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery("");
                  setHasSelectedLocation(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-6 border-b bg-gray-50 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search for venues, cities, addresses..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {/* Map - Scrollable container */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div
                  id="map-container"
                  style={{
                    height: "350px",
                    width: "100%",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                  }}
                />
              </div>

              {/* Selected Location Display */}
              {hasSelectedLocation && searchQuery && (
                <div className="px-6 pb-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900">
                          Selected Location:
                        </p>
                        <p className="text-sm text-blue-700 break-words mt-1">
                          {searchQuery}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Always visible */}
            <div className="border-t bg-gray-50 p-6 flex-shrink-0">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-gray-500 flex-1 min-w-[200px]">
                  {hasSelectedLocation
                    ? "✓ Location selected - click Save to confirm"
                    : "Search or click on the map to select a location"}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setSearchQuery("");
                      setHasSelectedLocation(false);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    disabled={!searchQuery || !hasSelectedLocation}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Save Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}