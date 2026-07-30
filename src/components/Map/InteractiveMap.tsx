'use client';

import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { RoutePoint, LocationItem } from '@/hooks/useTripMeter';
import { Navigation, AlertTriangle, Gauge, ShieldAlert, Activity, Target, MapPin, Check } from 'lucide-react';

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
  isSimulatingTraffic,
  showTrafficOverlay,
  pickupLocation,
  destinationLocation,
  isPinpointDraggingMode,
  avoidTolls,
  onTileStyleChange,
  onToggleTraffic,
  onToggleTrafficOverlay,
  onMapCenterChange,
  onConfirmPinpoint,
}: InteractiveMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [LInstance, setLInstance] = useState<typeof import('leaflet') | null>(null);
  const [mapInstance, setMapInstance] = useState<import('leaflet').Map | null>(null);
  const [markerInstance, setMarkerInstance] = useState<import('leaflet').Marker | null>(null);
  const [destMarkerInstance, setDestMarkerInstance] = useState<import('leaflet').Marker | null>(null);
  const [pickupMarkerInstance, setPickupMarkerInstance] = useState<import('leaflet').Marker | null>(null);
  const [polylineGroup, setPolylineGroup] = useState<import('leaflet').FeatureGroup | null>(null);
  const [trafficGroup, setTrafficGroup] = useState<import('leaflet').FeatureGroup | null>(null);

  // Initialize Leaflet on Client Side
  useEffect(() => {
    import('leaflet').then((L) => {
      setLInstance(L);
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapLoaded(true);
    });
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!mapLoaded || !LInstance) return;

    const container = document.getElementById('leaflet-map-container');
    if (!container || (container as unknown as { _leaflet_id?: string })._leaflet_id) return;

    const initialMap = LInstance.map('leaflet-map-container', {
      center: [currentPosition.lat, currentPosition.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    const pGroup = LInstance.featureGroup().addTo(initialMap);
    const tGroup = LInstance.featureGroup().addTo(initialMap);

    setPolylineGroup(pGroup);
    setTrafficGroup(tGroup);
    setMapInstance(initialMap);

    initialMap.on('move', () => {
      const center = initialMap.getCenter();
      onMapCenterChange({ lat: center.lat, lng: center.lng });
    });

    return () => {
      initialMap.remove();
    };
  }, [mapLoaded, LInstance]);

  // Tile Layer Updates
  useEffect(() => {
    if (!mapInstance || !LInstance) return;

    mapInstance.eachLayer((layer) => {
      if (layer instanceof LInstance.TileLayer) {
        mapInstance.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (tileStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (tileStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    LInstance.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstance);
  }, [mapInstance, LInstance, tileStyle]);

  // Render Traffic Condition Colors along fullNavPath
  useEffect(() => {
    if (!mapInstance || !LInstance || !trafficGroup || !fullNavPath) return;

    trafficGroup.clearLayers();
    if (!showTrafficOverlay) return;

    for (let i = 0; i < fullNavPath.length - 1; i++) {
      const p1 = fullNavPath[i];
      const p2 = fullNavPath[i + 1];

      let strokeColor = '#00e676';
      if (p1.trafficStatus === 'moderate') strokeColor = '#ffb300';
      if (p1.trafficStatus === 'heavy') strokeColor = '#ff1744';

      const trafficSegment = LInstance.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
        color: strokeColor,
        weight: 9,
        opacity: 0.65,
        lineCap: 'round',
      });

      trafficSegment.addTo(trafficGroup);
    }
  }, [mapInstance, LInstance, trafficGroup, showTrafficOverlay, fullNavPath]);

  // Pickup & Destination Pins Rendering
  useEffect(() => {
    if (!mapInstance || !LInstance) return;

    // Pickup Pin
    const pickupHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs">
          📍
        </div>
      </div>
    `;
    const pickupIcon = LInstance.divIcon({
      html: pickupHtml,
      className: 'pickup-marker-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!pickupMarkerInstance) {
      const newPickup = LInstance.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon }).addTo(mapInstance);
      newPickup.bindPopup(`<b>${pickupLocation.name}</b><br/>Pickup Location`);
      setPickupMarkerInstance(newPickup);
    } else {
      pickupMarkerInstance.setLatLng([pickupLocation.lat, pickupLocation.lng]);
    }

    // Destination Pin
    if (destinationLocation) {
      const destHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-9 h-9 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs animate-bounce">
            🚩
          </div>
        </div>
      `;

      const destIcon = LInstance.divIcon({
        html: destHtml,
        className: 'dest-marker-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (!destMarkerInstance) {
        const newDest = LInstance.marker([destinationLocation.lat, destinationLocation.lng], { icon: destIcon }).addTo(mapInstance);
        newDest.bindPopup(`<b>${destinationLocation.name}</b><br/>Destination Location`);
        setDestMarkerInstance(newDest);
      } else {
        destMarkerInstance.setLatLng([destinationLocation.lat, destinationLocation.lng]);
        destMarkerInstance.setPopupContent(`<b>${destinationLocation.name}</b><br/>Destination Location`);
      }

      if (!isPinpointDraggingMode) {
        const bounds = LInstance.latLngBounds(
          [pickupLocation.lat, pickupLocation.lng],
          [destinationLocation.lat, destinationLocation.lng]
        );
        mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [mapInstance, LInstance, pickupLocation, destinationLocation, isPinpointDraggingMode]);

  // Vehicle Marker & Navigation Polyline Updates
  useEffect(() => {
    if (!mapInstance || !LInstance || !polylineGroup) return;

    const tuktukHtml = `
      <div class="relative flex items-center justify-center">
        <div class="tuktuk-pulse"></div>
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-cyan-200 shadow-xl flex items-center justify-center text-white font-bold text-xs transform hover:scale-110 transition-transform">
          🛺
        </div>
      </div>
    `;

    const customIcon = LInstance.divIcon({
      html: tuktukHtml,
      className: 'tuktuk-marker-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!markerInstance) {
      const newMarker = LInstance.marker([currentPosition.lat, currentPosition.lng], { icon: customIcon }).addTo(mapInstance);
      setMarkerInstance(newMarker);
    } else {
      markerInstance.setLatLng([currentPosition.lat, currentPosition.lng]);
    }

    // Render Full Planned Navigation Line (Upcoming Route in Cyan dashed)
    polylineGroup.clearLayers();
    if (fullNavPath && fullNavPath.length > 1) {
      const fullLatLngs = fullNavPath.map(pt => [pt.lat, pt.lng] as [number, number]);
      const navPolyline = LInstance.polyline(fullLatLngs, {
        color: '#00f2fe',
        weight: 6,
        opacity: 0.5,
        dashArray: '8, 8',
      });
      navPolyline.addTo(polylineGroup);
    }

    // Render Traveled Active Route (Solid Green)
    const activeLatLngs = routePath.map((pt) => [pt.lat, pt.lng] as [number, number]);
    if (activeLatLngs.length > 1) {
      const activePath = LInstance.polyline(activeLatLngs, {
        color: '#00e676',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
      });
      activePath.addTo(polylineGroup);
    }

    if (!isPinpointDraggingMode) {
      mapInstance.panTo([currentPosition.lat, currentPosition.lng], { animate: true, duration: 0.5 });
    }

  }, [mapInstance, LInstance, polylineGroup, currentPosition, routePath, fullNavPath, isPinpointDraggingMode]);

  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.setView([currentPosition.lat, currentPosition.lng], 16, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
      {/* Leaflet Map DOM Container */}
      <div id="leaflet-map-container" className="w-full h-full z-0" />

      {/* Target Crosshair overlay when Drag Pinpoint Mode is ACTIVE */}
      {isPinpointDraggingMode && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-rose-500/60 animate-ping absolute"></div>
            <div className="w-12 h-12 rounded-full border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold shadow-2xl">
              <Target className="w-8 h-8 animate-pulse text-rose-500" />
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute"></div>
          </div>
        </div>
      )}

      {/* Top Banner when Drag Pinpoint Mode is ACTIVE */}
      {isPinpointDraggingMode && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 flex items-center space-x-2">
          <button
            onClick={onConfirmPinpoint}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-2xl hover:bg-rose-500 transition-all border border-rose-300 animate-bounce"
          >
            <Check className="w-4 h-4" />
            <span>CONFIRM DESTINATION AT CENTER</span>
          </button>
        </div>
      )}

      {/* Top Left - Speedometer HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-3 glass-panel px-4 py-2.5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          <Gauge className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Live Speed</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black tracking-tight glow-cyan">{currentSpeed}</span>
            <span className="text-xs font-bold text-cyan-300">KM/H</span>
          </div>
        </div>
      </div>

      {/* Top Center - Current Street & Avoid Tolls Badge */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 glass-panel px-4 py-2 rounded-2xl shadow-xl flex items-center space-x-2 border border-white/15">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="text-xs font-bold font-mono text-cyan-200">
          {currentPosition.streetName || "Colombo Navigation Route"}
        </span>
        {avoidTolls && (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>NO TOLLS</span>
          </span>
        )}
      </div>

      {/* Top Right - Map Controls & Style Selector */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <div className="glass-panel p-1 rounded-2xl flex items-center space-x-1">
          <button
            onClick={() => onTileStyleChange('streets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tileStyle === 'streets'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Google Style
          </button>
          <button
            onClick={() => onTileStyleChange('dark')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tileStyle === 'dark'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Neon Dark
          </button>
          <button
            onClick={() => onTileStyleChange('satellite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tileStyle === 'satellite'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Satellite
          </button>
        </div>

        <div className="flex items-center space-x-2 justify-end">
          <button
            onClick={onToggleTrafficOverlay}
            title="Toggle Traffic Colors Layer (Green/Amber/Red)"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              showTrafficOverlay
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'glass-panel text-slate-400 border-white/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Traffic Overlay</span>
          </button>

          <button
            onClick={onToggleTraffic}
            title="Simulate Traffic Delay (Accumulates Waiting Time)"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              isSimulatingTraffic
                ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 animate-pulse'
                : 'glass-panel text-slate-300 border-white/10 hover:border-amber-500/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isSimulatingTraffic ? 'Traffic Jam (Waiting)' : 'Simulate Jam'}</span>
          </button>

          <button
            onClick={handleRecenter}
            title="Recenter Map on TukTuk"
            className="glass-panel p-2 rounded-xl text-cyan-400 hover:text-white hover:border-cyan-500/40 transition-all"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Traffic Legend Badge Bottom Left */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-300 flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Clear</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Moderate</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Heavy Traffic</span>
        </div>
      </div>
    </div>
  );
}
