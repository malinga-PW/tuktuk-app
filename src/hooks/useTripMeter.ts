import { useState, useEffect, useRef, useCallback } from 'react';
import { meterAudio } from '@/utils/audio';

export type TripStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';

export interface TariffConfig {
  currency: string;
  baseFare: number;       // Initial minimum fare (e.g., LKR 120)
  baseKmIncluded: number; // KM included in base fare (e.g., 1.0 km)
  ratePerKm: number;      // Fare per km after base (e.g., LKR 100/km)
  waitRatePerMin: number; // Fare per min idle/waiting (e.g., LKR 6/min)
  isNightTariff: boolean;
  nightMultiplier: number;
  acSurcharge: number;
  luggageSurcharge: number;
  isAcEnabled: boolean;
  isLuggageEnabled: boolean;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  streetName?: string;
  isOneWay?: boolean;
  trafficStatus?: 'clear' | 'moderate' | 'heavy';
}

export interface LocationItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const INITIAL_REAL_GPS_PICKUP: LocationItem = {
  id: 'pickup-gps-auto',
  name: 'Current GPS Location',
  address: 'Live device location',
  lat: 6.92712,
  lng: 79.86120,
};

export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useTripMeter() {
  const [status, setStatus] = useState<TripStatus>('IDLE');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [waitingSeconds, setWaitingSeconds] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isHudMirrored, setIsHudMirrored] = useState<boolean>(false);

  // Real Mobile GPS state
  const [useRealGps, setUseRealGps] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<unknown | null>(null);

  // Locations state (No hardcoded destination by default)
  const [pickupLocation, setPickupLocation] = useState<LocationItem>(INITIAL_REAL_GPS_PICKUP);
  const [destinationLocation, setDestinationLocation] = useState<LocationItem | null>(null);
  const [isPinpointDraggingMode, setIsPinpointDraggingMode] = useState<boolean>(false);
  const [mapCenterCoords, setMapCenterCoords] = useState<{ lat: number, lng: number }>({ lat: INITIAL_REAL_GPS_PICKUP.lat, lng: INITIAL_REAL_GPS_PICKUP.lng });

  // Route Options
  const [avoidTolls, setAvoidTolls] = useState<boolean>(true);
  const [routeType, setRouteType] = useState<'fastest' | 'shortest'>('fastest');

  // Navigation route path state
  const [fullNavPath, setFullNavPath] = useState<RoutePoint[]>([
    { lat: INITIAL_REAL_GPS_PICKUP.lat, lng: INITIAL_REAL_GPS_PICKUP.lng, streetName: INITIAL_REAL_GPS_PICKUP.name },
  ]);
  const [routeIndex, setRouteIndex] = useState<number>(0);
  const [routePath, setRoutePath] = useState<RoutePoint[]>([INITIAL_REAL_GPS_PICKUP]);

  // Map tile style
  const [mapTileStyle, setMapTileStyle] = useState<'streets' | 'dark' | 'satellite'>('streets');
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState<boolean>(false);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState<boolean>(true);

  // Search Results State
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);

  // Tariff config state
  const [tariff, setTariff] = useState<TariffConfig>({
    currency: 'LKR',
    baseFare: 120,
    baseKmIncluded: 1.0,
    ratePerKm: 100,
    waitRatePerMin: 6,
    isNightTariff: false,
    nightMultiplier: 1.2,
    acSurcharge: 50,
    luggageSurcharge: 100,
    isAcEnabled: false,
    isLuggageEnabled: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Screen Wake Lock API
  const requestWakeLock = async () => {
    try {
      if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request('screen');
      }
    } catch {
      // Ignore
    }
  };

  // Auto-Detect Real Mobile GPS Location on App Load
  useEffect(() => {
    requestWakeLock();
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const realPickup: LocationItem = {
            id: 'real-pickup-initial',
            name: 'Current Location (Real GPS)',
            address: `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            lat: latitude,
            lng: longitude,
          };
          setPickupLocation(realPickup);
          setMapCenterCoords({ lat: latitude, lng: longitude });
          setRoutePath([{ lat: latitude, lng: longitude, streetName: 'Current Location' }]);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // OSRM Real-Road Routing Engine (only called if destination exists)
  const fetchOsrmRoute = useCallback(async (start: { lat: number, lng: number }, end: { lat: number, lng: number }) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0] && data.routes[0].geometry) {
          const coords = data.routes[0].geometry.coordinates;
          const osrmPoints: RoutePoint[] = coords.map((c: [number, number], idx: number) => ({
            lat: c[1],
            lng: c[0],
            streetName: "Colombo Street Route",
            trafficStatus: idx % 10 === 0 ? 'moderate' : idx % 23 === 0 ? 'heavy' : 'clear',
            isOneWay: idx % 15 === 0,
          }));
          setFullNavPath(osrmPoints);
          setRouteIndex(0);
          setRoutePath([osrmPoints[0]]);
          return;
        }
      }
    } catch {
      // Fallback
    }

    setFullNavPath([
      { lat: start.lat, lng: start.lng },
      { lat: end.lat, lng: end.lng },
    ]);
  }, []);

  useEffect(() => {
    if (destinationLocation) {
      fetchOsrmRoute(pickupLocation, destinationLocation);
    } else {
      setFullNavPath([{ lat: pickupLocation.lat, lng: pickupLocation.lng, streetName: pickupLocation.name }]);
    }
  }, [pickupLocation, destinationLocation, avoidTolls, fetchOsrmRoute]);

  // Real Mobile GPS Tracking Handler
  useEffect(() => {
    if (!useRealGps) {
      if (watchIdRef.current !== null && typeof window !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError("GPS is not supported on this browser.");
      setUseRealGps(false);
      return;
    }

    setGpsError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const speedKmH = speed ? Math.round(speed * 3.6) : 0;
        setCurrentSpeed(speedKmH);

        const newPoint: LocationItem = {
          id: 'real-gps',
          name: 'Live Device GPS Location',
          address: `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          lat: latitude,
          lng: longitude,
        };

        setPickupLocation(newPoint);

        if (status === 'RUNNING') {
          setRoutePath((prev) => {
            const lastPt = prev[prev.length - 1];
            if (lastPt) {
              const deltaKm = getHaversineDistance(lastPt.lat, lastPt.lng, latitude, longitude);
              if (deltaKm > 0.005) {
                setDistanceKm((d) => d + deltaKm);
                meterAudio.playTick();
              }
            }
            return [...prev, { lat: latitude, lng: longitude, streetName: "Live GPS Road" }];
          });
        }
      },
      (err) => {
        setGpsError(err.message || "Failed to access mobile GPS.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [useRealGps, status]);

  // Nominatim Search
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearchingPlaces(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=lk&limit=7`
      );
      if (res.ok) {
        const data = await res.json();
        const formatted: LocationItem[] = data.map((item: { place_id: number, display_name: string, lat: string, lon: string }, idx: number) => {
          const parts = item.display_name.split(',');
          const mainName = parts[0] || query;
          const fullAddress = parts.slice(1).join(',').trim();
          return {
            id: `nom-${item.place_id || idx}`,
            name: mainName,
            address: fullAddress || item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });
        setSearchResults(formatted);
      }
    } catch {
      // Ignore
    } finally {
      setIsSearchingPlaces(false);
    }
  }, []);

  const toggleMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    meterAudio.setMuted(next);
  };

  const calculateFare = useCallback(() => {
    const { baseFare, baseKmIncluded, ratePerKm, waitRatePerMin, isNightTariff, nightMultiplier, isAcEnabled, acSurcharge, isLuggageEnabled, luggageSurcharge } = tariff;
    
    let total = baseFare;
    if (distanceKm > baseKmIncluded) {
      total += (distanceKm - baseKmIncluded) * ratePerKm;
    }

    const waitMinutes = waitingSeconds / 60;
    total += waitMinutes * waitRatePerMin;

    if (isAcEnabled) total += acSurcharge;
    if (isLuggageEnabled) total += luggageSurcharge;

    if (isNightTariff) {
      total *= nightMultiplier;
    }

    return Math.round(total);
  }, [distanceKm, waitingSeconds, tariff]);

  const startTrip = () => {
    requestWakeLock();
    setStatus('RUNNING');
    meterAudio.playStartChime();
  };

  const pauseTrip = () => {
    setStatus('PAUSED');
    setCurrentSpeed(0);
  };

  const resumeTrip = () => {
    setStatus('RUNNING');
  };

  const finishTrip = () => {
    setStatus('FINISHED');
    setCurrentSpeed(0);
    meterAudio.playStopChime();
  };

  const resetTrip = () => {
    setStatus('IDLE');
    setDistanceKm(0);
    setElapsedSeconds(0);
    setWaitingSeconds(0);
    setCurrentSpeed(0);
    setRouteIndex(0);
    setRoutePath([pickupLocation]);
  };

  const clearAllTripData = () => {
    setStatus('IDLE');
    setDistanceKm(0);
    setElapsedSeconds(0);
    setWaitingSeconds(0);
    setCurrentSpeed(0);
    setDestinationLocation(null);
    setFullNavPath([
      { lat: pickupLocation.lat, lng: pickupLocation.lng },
    ]);
    setRouteIndex(0);
    setRoutePath([pickupLocation]);
    setIsPinpointDraggingMode(false);
    setSearchResults([]);
  };

  const confirmPinpointDestination = () => {
    const customPin: LocationItem = {
      id: `pin-${Date.now()}`,
      name: 'Pinned Map Location',
      address: `GPS (${mapCenterCoords.lat.toFixed(4)}, ${mapCenterCoords.lng.toFixed(4)})`,
      lat: mapCenterCoords.lat,
      lng: mapCenterCoords.lng,
    };
    setDestinationLocation(customPin);
    setIsPinpointDraggingMode(false);
  };

  // Main Simulation Loop
  useEffect(() => {
    if (status !== 'RUNNING' || useRealGps) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      if (isSimulatingTraffic) {
        setCurrentSpeed(0);
        setWaitingSeconds((prev) => prev + 1);
      } else {
        const simSpeed = Math.floor(25 + Math.random() * 20);
        setCurrentSpeed(simSpeed);

        const addKm = simSpeed / 3600;
        setDistanceKm((prev) => {
          const nextVal = prev + addKm;
          if (Math.floor(nextVal * 10) > Math.floor(prev * 10)) {
            meterAudio.playTick();
          }
          return nextVal;
        });

        if (destinationLocation && fullNavPath.length > 1) {
          setRouteIndex((prevIdx) => {
            const nextIdx = prevIdx + 1;
            if (nextIdx >= fullNavPath.length) {
              setStatus('FINISHED');
              setCurrentSpeed(0);
              meterAudio.playStopChime();
              return prevIdx;
            }

            const newPoint = fullNavPath[nextIdx];
            setRoutePath((prevPath) => [...prevPath, newPoint]);
            return nextIdx;
          });
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, isSimulatingTraffic, fullNavPath, useRealGps, destinationLocation]);

  const currentPosition = routePath[routePath.length - 1] || pickupLocation;

  return {
    status,
    distanceKm,
    elapsedSeconds,
    waitingSeconds,
    currentSpeed,
    currentPosition,
    routePath,
    fullNavPath,
    tariff,
    totalFare: calculateFare(),
    isAudioMuted,
    isHudMirrored,
    mapTileStyle,
    isSimulatingTraffic,
    showTrafficOverlay,
    pickupLocation,
    destinationLocation,
    isPinpointDraggingMode,
    mapCenterCoords,
    avoidTolls,
    routeType,
    searchResults,
    isSearchingPlaces,
    searchPlaces,
    clearAllTripData,
    setUseRealGps,
    setAvoidTolls,
    setRouteType,
    setTariff,
    setPickupLocation,
    setDestinationLocation,
    setIsPinpointDraggingMode,
    setMapCenterCoords,
    confirmPinpointDestination,
    startTrip,
    pauseTrip,
    resumeTrip,
    finishTrip,
    resetTrip,
    toggleMute,
    setIsHudMirrored,
    setMapTileStyle,
    setIsSimulatingTraffic,
    setShowTrafficOverlay,
    setDistanceKm,
    setWaitingSeconds
  };
}
