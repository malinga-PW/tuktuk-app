'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RoutePoint, LocationItem } from '@/hooks/useTripMeter';
import { Navigation, Layers, Crosshair, Eye, MapPin, X, CheckCircle2, Target, Loader2 } from 'lucide-react';
import { meterAudio } from '@/utils/audio';

// Custom Smaller TukTuk Vehicle Icon
const tuktukIcon = L.divIcon({
  className: 'tuktuk-marker-icon-clean',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-7 h-7 text-2xl filter drop-shadow-md animate-pulse">
        🛺
      </div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Destination Pin Icon
const destIcon = L.divIcon({
  className: 'dest-marker-icon',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-2xl flex items-center justify-center text-white z-10 animate-bounce">
        📍
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Smooth Map Pan Controller (Eliminates Jitter/Shaking)
function SmoothMapController({ center, zoomLevel }: { center: [number, number], zoomLevel?: number }) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);

  useEffect(() => {
    const [prevLat, prevLng] = prevCenterRef.current;
    const [lat, lng] = center;
    const dist = Math.hypot(lat - prevLat, lng - prevLng);

    // Pan smoothly only if position moved significantly (> 0.00005 deg ~ 5m)
    if (dist > 0.00005) {
      map.panTo(center, { animate: true, duration: 0.8 });
      prevCenterRef.current = center;
    }
  }, [center, map]);

  useEffect(() => {
    if (zoomLevel) {
      map.setZoom(zoomLevel);
    }
  }, [zoomLevel, map]);

  return null;
}

// Drag Pin Center Detector
function MapCenterListener({ onCenterChange, isPinpointMode }: { onCenterChange: (coords: { lat: number, lng: number }) => void, isPinpointMode: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!isPinpointMode) return;
    const handleMove = () => {
      const center = map.getCenter();
      onCenterChange({ lat: center.lat, lng: center.lng });
    };
    map.on('move', handleMove);
    return () => {
      map.off('move', handleMove);
    };
  }, [map, isPinpointMode, onCenterChange]);
  return null;
}

interface InteractiveMapProps {
  currentPosition: RoutePoint;
  routePath: RoutePoint[];
  fullNavPath: RoutePoint[];
  currentSpeed: number;
  tileStyle: 'streets' | 'dark' | 'satellite';
  isSimulatingTraffic: boolean;
  showTrafficOverlay: boolean;
  pickupLocation: LocationItem;
  destinationLocation: LocationItem | null;
  isPinpointDraggingMode: boolean;
  avoidTolls: boolean;
  searchResults: LocationItem[];
  isSearchingPlaces: boolean;
  onSearchPlaces: (query: string) => void;
  onSelectDestination: (dest: LocationItem) => void;
  onClearDestination: () => void;
  onTogglePinpointMode: () => void;
  onTileStyleChange: (style: 'streets' | 'dark' | 'satellite') => void;
  onToggleTraffic: () => void;
  onToggleTrafficOverlay: () => void;
  onMapCenterChange: (coords: { lat: number, lng: number }) => void;
  onConfirmPinpoint: () => void;
}

export default function InteractiveMap({
  currentPosition,
  routePath,
  fullNavPath,
  currentSpeed,
  tileStyle,
  destinationLocation,
  isPinpointDraggingMode,
  searchResults,
  isSearchingPlaces,
  onSearchPlaces,
  onSelectDestination,
  onClearDestination,
  onTogglePinpointMode,
  onTileStyleChange,
  onMapCenterChange,
  onConfirmPinpoint,
}: InteractiveMapProps) {
  const [targetZoom, setTargetZoom] = useState<number>(15);
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState(destinationLocation ? destinationLocation.name : '');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (destinationLocation) {
      setSearchQuery(destinationLocation.name);
    } else {
      setSearchQuery('');
    }
  }, [destinationLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        onSearchPlaces(searchQuery);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearchPlaces]);

  const getTileUrl = () => {
    switch (tileStyle) {
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const navPolylineCoords: [number, number][] = fullNavPath.map((p) => [p.lat, p.lng]);
  const drivenPolylineCoords: [number, number][] = routePath.map((p) => [p.lat, p.lng]);

  const handleCenterAndZoomIn = () => {
    setTargetZoom(18);
    meterAudio.speak("Map centered close-up.");
  };

  const handleClearDestination = () => {
    setSearchQuery('');
    onClearDestination();
    setIsSearchOpen(false);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      {/* Edge-to-edge 1:1 Leaflet Map */}
      <MapContainer
        center={[currentPosition.lat, currentPosition.lng]}
        zoom={targetZoom}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <SmoothMapController center={[currentPosition.lat, currentPosition.lng]} zoomLevel={targetZoom} />
        <MapCenterListener onCenterChange={onMapCenterChange} isPinpointMode={isPinpointDraggingMode} />

        <TileLayer
          attribution='&copy; OpenStreetMap'
          url={getTileUrl()}
        />

        {/* 100% OSRM Real Road Route Line */}
        {navPolylineCoords.length > 1 && (
          <Polyline
            positions={navPolylineCoords}
            pathOptions={{
              color: '#00f2fe',
              weight: 5,
              opacity: 0.85,
              dashArray: '8, 8',
            }}
          />
        )}

        {/* Driven Polyline Path */}
        {drivenPolylineCoords.length > 1 && (
          <Polyline
            positions={drivenPolylineCoords}
            pathOptions={{
              color: '#39ff14',
              weight: 6,
              opacity: 0.95,
            }}
          />
        )}

        {/* Smaller TukTuk Vehicle Marker */}
        <Marker position={[currentPosition.lat, currentPosition.lng]} icon={tuktukIcon}>
          <Popup>
            <div className="text-xs font-mono font-bold text-slate-900">
              🛺 TukTuk Live Location<br />
              Speed: {currentSpeed} KM/H
            </div>
          </Popup>
        </Marker>

        {/* Destination Location Marker */}
        {destinationLocation && (
          <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destIcon}>
            <Popup>
              <div className="text-xs font-mono font-bold text-slate-900">
                📍 {destinationLocation.name}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* 1. OVERLAY DESTINATION SEARCH BAR & DRAG PIN AT TOP OF MAP AREA */}
      <div className="absolute top-2 left-2 right-12 z-30 flex items-center space-x-1.5 pointer-events-auto">
        <div className="flex-1 relative glass-panel rounded-xl border border-cyan-500/40 p-1 shadow-2xl bg-slate-950/90">
          <div className="flex items-center space-x-1.5 relative">
            <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 fill-rose-400 ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search place, shop or city in SL..."
              className="w-full bg-transparent border-0 py-1 pr-6 text-xs font-bold text-white focus:outline-none placeholder-slate-400"
            />
            {isSearchingPlaces && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-2" />}
            {searchQuery && !isSearchingPlaces && (
              <button
                onClick={handleClearDestination}
                className="absolute right-2 text-slate-400 hover:text-white"
                title="Clear Destination"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-panel rounded-xl border border-cyan-500/50 max-h-48 overflow-y-auto shadow-2xl p-1 bg-slate-950">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectDestination(item);
                    setSearchQuery(item.name);
                    setIsSearchOpen(false);
                  }}
                  className="w-full text-left p-1.5 hover:bg-cyan-500/20 rounded-lg flex items-center justify-between text-xs transition-colors border-b border-white/5 last:border-0"
                >
                  <div className="overflow-hidden mr-1">
                    <div className="font-bold text-white truncate text-[11px]">{item.name}</div>
                    <div className="text-[9px] text-slate-400 font-mono truncate">{item.address}</div>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drag Pin Button */}
        <button
          onClick={onTogglePinpointMode}
          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all border shrink-0 flex items-center space-x-1 shadow-xl ${
            isPinpointDraggingMode
              ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
              : 'glass-panel text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20'
          }`}
          title="Drag Map Center"
        >
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">{isPinpointDraggingMode ? 'PINNING' : 'DRAG PIN'}</span>
        </button>
      </div>

      {/* Floating Map Layers Button */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center space-x-1.5">
        <button
          onClick={() => setShowStyleMenu(!showStyleMenu)}
          className="p-1.5 glass-panel rounded-xl text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/20 shadow-xl flex items-center space-x-1 text-xs font-bold"
          title="Map Layer Styles"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
        </button>

        {showStyleMenu && (
          <div className="flex items-center space-x-1 glass-panel p-1 rounded-xl border border-cyan-500/30 animate-fadeIn">
            <button
              onClick={() => onTileStyleChange('streets')}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold ${tileStyle === 'streets' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
            >
              Google
            </button>
            <button
              onClick={() => onTileStyleChange('dark')}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold ${tileStyle === 'dark' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
            >
              Dark
            </button>
            <button
              onClick={() => onTileStyleChange('satellite')}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold ${tileStyle === 'satellite' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
            >
              Satellite
            </button>
          </div>
        )}
      </div>

      {/* Re-Center Navigation Arrow Button */}
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={handleCenterAndZoomIn}
          className="p-2.5 rounded-full bg-cyan-500 text-slate-950 font-black shadow-2xl hover:scale-110 active:scale-95 transition-all border border-cyan-300 flex items-center justify-center"
          title="Re-Center & Zoom In +3 Levels to Vehicle"
        >
          <Navigation className="w-5 h-5 fill-slate-950" />
        </button>
      </div>

      {/* Pinpoint Drag Crosshair Overlay */}
      {isPinpointDraggingMode && (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-rose-500 animate-ping"></div>
            <Crosshair className="w-8 h-8 text-rose-500 absolute" />
          </div>
          <div className="mt-2 px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow-2xl pointer-events-auto">
            DRAG MAP TO CENTER PIN
          </div>
          <button
            onClick={onConfirmPinpoint}
            className="mt-2 px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-2xl pointer-events-auto hover:scale-105 active:scale-95"
          >
            SET DESTINATION PIN
          </button>
        </div>
      )}

      {/* Traffic Legend Toggle Badge */}
      <div className="absolute bottom-2 right-2 z-20">
        {!showLegend ? (
          <button
            onClick={() => setShowLegend(true)}
            className="px-2 py-1 glass-card rounded-lg text-[9px] text-cyan-300 border border-white/10 font-bold flex items-center space-x-1"
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>Traffic Legend</span>
          </button>
        ) : (
          <div
            onClick={() => setShowLegend(false)}
            className="px-2 py-1 glass-card rounded-lg border border-white/10 text-[9px] font-mono text-slate-300 flex items-center space-x-2 cursor-pointer"
          >
            <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span>Clear</span></div>
            <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span>Mod</span></div>
            <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span>Heavy</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
