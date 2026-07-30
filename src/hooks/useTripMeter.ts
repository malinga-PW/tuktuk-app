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
  heading?: number;
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

export interface SavedTripRecord {
  id: string;
  date: string;
  time: string;
  distanceKm: number;
  durationSec: number;
  totalFare: number;
  currency: string;
}

export const INITIAL_REAL_GPS_PICKUP: LocationItem = {
  id: 'pickup-gps-auto',
  name: 'Current Location',
  address: 'Detecting GPS Address...',
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

export function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos((lon2 - lon1) * (Math.PI / 180));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function useTripMeter() {
  const [status, setStatus] = useState<TripStatus>('IDLE');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [waitingSeconds, setWaitingSeconds] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [vehicleHeading, setVehicleHeading] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isHudMirrored, setIsHudMirrored] = useState<boolean>(false);

  // Estimates state
  const [estimatedDistanceKm, setEstimatedDistanceKm] = useState<number>(0);
  const [estimatedDurationMins, setEstimatedDurationMins] = useState<number>(0);
  const [estimatedFare, setEstimatedFare] = useState<number>(0);

  // Saved Trip History State
  const [tripHistory, setTripHistory] = useState<SavedTripRecord[]>([]);

  // Real Mobile GPS state
  const [useRealGps, setUseRealGps] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<unknown | null>(null);
  const lastAnnouncedKmRef = useRef<number>(0);
  const prevCoordsRef = useRef<{ lat: number, lng: number } | null>(null);
  const lastReverseGeocodedRef = useRef<string>('');

  // Locations state
  const [pickupLocation, setPickupLocation] = useState<LocationItem>(INITIAL_REAL_GPS_PICKUP);
  const pickupLocationRef = useRef<LocationItem>(INITIAL_REAL_GPS_PICKUP);
  const [destinationLocation, setDestinationLocation] = useState<LocationItem | null>(null);
  const [isPinpointDraggingMode, setIsPinpointDraggingMode] = useState<boolean>(false);
  const [mapCenterCoords, setMapCenterCoords] = useState<{ lat: number, lng: number }>({ lat: INITIAL_REAL_GPS_PICKUP.lat, lng: INITIAL_REAL_GPS_PICKUP.lng });

  // Sync pickup ref
  useEffect(() => {
    pickupLocationRef.current = pickupLocation;
  }, [pickupLocation]);

  // Toll & highway avoidance is ALWAYS ON (hardcoded for TukTuk use)
  const [routeType, setRouteType] = useState<'fastest' | 'shortest'>('fastest');

  // Navigation route path state
  const [fullNavPath, setFullNavPath] = useState<RoutePoint[]>([
    { lat: INITIAL_REAL_GPS_PICKUP.lat, lng: INITIAL_REAL_GPS_PICKUP.lng, heading: 0, streetName: INITIAL_REAL_GPS_PICKUP.name },
  ]);
  const [routeIndex, setRouteIndex] = useState<number>(0);
  const [routePath, setRoutePath] = useState<RoutePoint[]>([{ lat: INITIAL_REAL_GPS_PICKUP.lat, lng: INITIAL_REAL_GPS_PICKUP.lng, heading: 0 }]);

  // Map tile style
  const [mapTileStyle, setMapTileStyle] = useState<'streets' | 'dark' | 'satellite'>('streets');
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState<boolean>(false);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState<boolean>(true);

  // Search Results State
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);

  // Tariff config state
  const [tariff, setTariff] = useState<TariffConfig>({
    currency: 'Rs.',
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

  // Reverse Geocode helper
  const fetchReverseGeocode = useCallback(async (lat: number, lng: number) => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (lastReverseGeocodedRef.current === key) return;
    lastReverseGeocodedRef.current = key;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          const mainName = parts[0] || 'Current Location';
          const subLocation = parts.slice(1, 3).join(',').trim();
          setPickupLocation({
            id: 'real-gps-named',
            name: mainName,
            address: subLocation || data.display_name,
            lat,
            lng,
          });
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Load Trip History from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tuktuk_trip_history');
        if (stored) {
          setTripHistory(JSON.parse(stored));
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  // Screen Wake Lock API Auto-Rebind
  const requestWakeLock = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request('screen');
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    requestWakeLock();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [requestWakeLock]);

  // Robust Geolocation Handler
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, heading } = pos.coords;
          setMapCenterCoords({ lat: latitude, lng: longitude });
          if (heading !== null && heading !== undefined && !isNaN(heading)) {
            setVehicleHeading(heading);
          }
          setRoutePath([{ lat: latitude, lng: longitude, heading: heading || 0, streetName: 'Current Location' }]);
          prevCoordsRef.current = { lat: latitude, lng: longitude };
          fetchReverseGeocode(latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
      );
    }
  }, [fetchReverseGeocode]);

  // Calculate estimated fare helper
  const calcEstimatedFare = useCallback((distKm: number, tariffCfg: TariffConfig) => {
    let total = tariffCfg.baseFare;
    if (distKm > tariffCfg.baseKmIncluded) {
      total += (distKm - tariffCfg.baseKmIncluded) * tariffCfg.ratePerKm;
    }
    return Math.round(total);
  }, []);

  // Routing Engine:
  // ALWAYS uses OpenRouteService (ORS) to avoid tollways + highways (hardcoded for TukTuks)
  // Falls back to OSRM if ORS is unavailable.
  const fetchOsrmRoute = useCallback(async (start: { lat: number, lng: number }, end: { lat: number, lng: number }) => {
    const buildRoute = (coords: [number, number][], label: string): RoutePoint[] =>
      coords.map((c, idx) => {
        const nextC = coords[idx + 1] || c;
        return { lat: c[1], lng: c[0], heading: getBearing(c[1], c[0], nextC[1], nextC[0]), streetName: label };
      });

    // --- PRIMARY: ORS always avoids toll roads and highways ---
    try {
      const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
      const orsBody = {
        coordinates: [[start.lng, start.lat], [end.lng, end.lat]],
        options: { avoid_features: ['tollways', 'highways'] },
      };
      const orsRes = await fetch(orsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': '5b3ce3597851110001cf6248c0ec5e34a4944d1db1fc95cfe94c6b37' },
        body: JSON.stringify(orsBody),
      });
      if (orsRes.ok) {
        const orsData = await orsRes.json();
        const feature = orsData?.features?.[0];
        if (feature?.geometry?.coordinates?.length > 1) {
          const props = feature.properties?.summary;
          const distKm = (props?.distance ?? 0) / 1000;
          const durMins = Math.round((props?.duration ?? 0) / 60);
          setEstimatedDistanceKm(distKm);
          setEstimatedDurationMins(durMins);
          setEstimatedFare(calcEstimatedFare(distKm, tariff));
          const orsPoints = buildRoute(feature.geometry.coordinates, 'Local Road (No Toll)');
          setFullNavPath(orsPoints);
          setRouteIndex(0);
          setRoutePath([orsPoints[0]]);
          return;
        }
      } else {
        console.warn('[ORS] HTTP error:', orsRes.status, '— falling back to OSRM');
      }
    } catch (err) {
      console.warn('[ORS] Failed:', err, '— falling back to OSRM');
    }

    // --- FALLBACK: OSRM (fastest road, no toll avoidance) ---
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(osrmUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes?.[0]) {
          const route = data.routes[0];
          const distKm = route.distance / 1000;
          const durMins = Math.round(route.duration / 60);
          setEstimatedDistanceKm(distKm);
          setEstimatedDurationMins(durMins);
          setEstimatedFare(calcEstimatedFare(distKm, tariff));
          if (route.geometry?.coordinates?.length > 1) {
            const osrmPoints = buildRoute(route.geometry.coordinates, 'Sri Lanka Road');
            setFullNavPath(osrmPoints);
            setRouteIndex(0);
            setRoutePath([osrmPoints[0]]);
            return;
          }
        }
      }
    } catch (err) {
      console.error('[OSRM] Fetch failed:', err);
    }

    // Straight-line LAST resort — only if both APIs completely unreachable
    console.error('[Routing] All engines failed — using straight-line fallback');
    const fallbackDist = getHaversineDistance(start.lat, start.lng, end.lat, end.lng);
    setEstimatedDistanceKm(fallbackDist);
    setEstimatedDurationMins(Math.round((fallbackDist / 25) * 60));
    setEstimatedFare(calcEstimatedFare(fallbackDist, tariff));
    setFullNavPath([
      { lat: start.lat, lng: start.lng, heading: 0 },
      { lat: end.lat, lng: end.lng, heading: 0 },
    ]);
  }, [tariff, calcEstimatedFare]);

  // Fetch OSRM Route only when destination or tolls option changes
  useEffect(() => {
    if (destinationLocation) {
      fetchOsrmRoute(pickupLocationRef.current, destinationLocation);
    } else {
      setEstimatedDistanceKm(0);
      setEstimatedDurationMins(0);
      setEstimatedFare(0);
      setFullNavPath([{ lat: pickupLocationRef.current.lat, lng: pickupLocationRef.current.lng, heading: vehicleHeading, streetName: pickupLocationRef.current.name }]);
    }
  }, [destinationLocation, fetchOsrmRoute, vehicleHeading]);

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
        const { latitude, longitude, speed, heading } = pos.coords;
        const speedKmH = speed ? Math.round(speed * 3.6) : 0;
        setCurrentSpeed(speedKmH);

        let currentHeading = vehicleHeading;
        if (heading !== null && heading !== undefined && !isNaN(heading) && speedKmH > 2) {
          currentHeading = heading;
        } else if (prevCoordsRef.current) {
          const calculatedBearing = getBearing(
            prevCoordsRef.current.lat,
            prevCoordsRef.current.lng,
            latitude,
            longitude
          );
          const delta = getHaversineDistance(prevCoordsRef.current.lat, prevCoordsRef.current.lng, latitude, longitude);
          if (delta > 0.003) {
            currentHeading = calculatedBearing;
          }
        }
        setVehicleHeading(currentHeading);
        prevCoordsRef.current = { lat: latitude, lng: longitude };

        fetchReverseGeocode(latitude, longitude);

        if (status === 'RUNNING') {
          setRoutePath((prev) => {
            const lastPt = prev[prev.length - 1];
            if (lastPt) {
              const deltaKm = getHaversineDistance(lastPt.lat, lastPt.lng, latitude, longitude);
              if (deltaKm > 0.003) {
                setDistanceKm((d) => {
                  const newDist = d + deltaKm;
                  const currentKmFloor = Math.floor(newDist);
                  if (currentKmFloor > lastAnnouncedKmRef.current && currentKmFloor >= 1) {
                    lastAnnouncedKmRef.current = currentKmFloor;
                    meterAudio.speak(`${currentKmFloor} kilometer completed.`);
                  }
                  return newDist;
                });
                meterAudio.playTick();
              }
            }
            return [...prev, { lat: latitude, lng: longitude, heading: currentHeading, streetName: pickupLocationRef.current.name }];
          });
        }
      },
      (err) => {
        if (err.code === 3) {
          setGpsError("GPS Signal Weak (Awaiting Satellite Lock...)");
        } else {
          setGpsError(err.message || "Failed to access mobile GPS.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [useRealGps, status, fetchReverseGeocode]);

  // Multi-Engine Search
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearchingPlaces(true);
    const resultsMap = new Map<string, LocationItem>();

    try {
      const photonPromise = fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&bbox=79.5,5.9,81.9,9.8&limit=8`
      ).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.features) {
            data.features.forEach((feat: { properties: { name?: string, city?: string, street?: string, country?: string }, geometry: { coordinates: [number, number] } }, idx: number) => {
              const p = feat.properties;
              if (p.name) {
                const address = [p.street, p.city, p.country].filter(Boolean).join(', ');
                const key = `${p.name.toLowerCase()}-${feat.geometry.coordinates[1].toFixed(3)}`;
                resultsMap.set(key, {
                  id: `phot-${idx}-${Date.now()}`,
                  name: p.name,
                  address: address || p.name,
                  lat: feat.geometry.coordinates[1],
                  lng: feat.geometry.coordinates[0],
                });
              }
            });
          }
        }
      }).catch(() => {});

      const nominatimPromise = fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Sri Lanka')}&countrycodes=lk&limit=8`
      ).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((item: { place_id: number, display_name: string, lat: string, lon: string }, idx: number) => {
              const parts = item.display_name.split(',');
              const mainName = parts[0] || query;
              const fullAddress = parts.slice(1).join(',').trim();
              const key = `${mainName.toLowerCase()}-${parseFloat(item.lat).toFixed(3)}`;
              if (!resultsMap.has(key)) {
                resultsMap.set(key, {
                  id: `nom-${item.place_id || idx}`,
                  name: mainName,
                  address: fullAddress || item.display_name,
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lon),
                });
              }
            });
          }
        }
      }).catch(() => {});

      await Promise.all([photonPromise, nominatimPromise]);

      const mergedList = Array.from(resultsMap.values());
      setSearchResults(mergedList);
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
    lastAnnouncedKmRef.current = 0;
    meterAudio.playStartChime();
    meterAudio.speak("Ride started. Drive safely.");
  };

  const pauseTrip = () => {
    setStatus('PAUSED');
    setCurrentSpeed(0);
    meterAudio.speak("Meter paused.");
  };

  const resumeTrip = () => {
    setStatus('RUNNING');
    meterAudio.speak("Meter resumed.");
  };

  const finishTrip = () => {
    setStatus('FINISHED');
    setCurrentSpeed(0);
    meterAudio.playStopChime();
    const finalFare = calculateFare();
    meterAudio.speak(`Trip completed. Total fare ${tariff.currency} ${finalFare}`);

    const newRecord: SavedTripRecord = {
      id: `trip-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      distanceKm: distanceKm,
      durationSec: elapsedSeconds,
      totalFare: finalFare,
      currency: tariff.currency,
    };

    setTripHistory((prev) => {
      const updated = [newRecord, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('tuktuk_trip_history', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setTripHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tuktuk_trip_history');
    }
  };

  const resetTrip = () => {
    setStatus('IDLE');
    setDistanceKm(0);
    setElapsedSeconds(0);
    setWaitingSeconds(0);
    setCurrentSpeed(0);
    setRouteIndex(0);
    lastAnnouncedKmRef.current = 0;
    setRoutePath([pickupLocation]);
  };

  const clearAllTripData = () => {
    setStatus('IDLE');
    setDistanceKm(0);
    setElapsedSeconds(0);
    setWaitingSeconds(0);
    setCurrentSpeed(0);
    setDestinationLocation(null);
    setEstimatedDistanceKm(0);
    setEstimatedDurationMins(0);
    setEstimatedFare(0);
    setFullNavPath([
      { lat: pickupLocation.lat, lng: pickupLocation.lng, heading: vehicleHeading },
    ]);
    setRouteIndex(0);
    lastAnnouncedKmRef.current = 0;
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
    meterAudio.speak("Destination pinned.");
  };

  // Simulation Loop
  useEffect(() => {
    if (status !== 'RUNNING' && status !== 'PAUSED') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      if (status === 'PAUSED' || currentSpeed === 0 || isSimulatingTraffic) {
        setWaitingSeconds((prev) => prev + 1);
      }

      if (status === 'RUNNING' && !useRealGps) {
        if (!isSimulatingTraffic) {
          const simSpeed = Math.floor(25 + Math.random() * 20);
          setCurrentSpeed(simSpeed);

          const addKm = simSpeed / 3600;
          setDistanceKm((prev) => {
            const nextVal = prev + addKm;
            const currentKmFloor = Math.floor(nextVal);
            if (currentKmFloor > lastAnnouncedKmRef.current && currentKmFloor >= 1) {
              lastAnnouncedKmRef.current = currentKmFloor;
              meterAudio.speak(`${currentKmFloor} kilometer completed.`);
            }
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
                meterAudio.speak("Arrived at destination.");
                return prevIdx;
              }
              const newPoint = fullNavPath[nextIdx];
              if (newPoint.heading !== undefined) {
                setVehicleHeading(newPoint.heading);
              }
              setRoutePath((prevPath) => [...prevPath, newPoint]);
              return nextIdx;
            });
          }
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, isSimulatingTraffic, fullNavPath, useRealGps, destinationLocation, currentSpeed]);

  const currentPosition = routePath[routePath.length - 1] || pickupLocation;

  return {
    status,
    distanceKm,
    elapsedSeconds,
    waitingSeconds,
    currentSpeed,
    vehicleHeading,
    currentPosition,
    routePath,
    fullNavPath,
    tariff,
    totalFare: calculateFare(),
    estimatedDistanceKm,
    estimatedDurationMins,
    estimatedFare,
    isAudioMuted,
    isHudMirrored,
    mapTileStyle,
    isSimulatingTraffic,
    showTrafficOverlay,
    pickupLocation,
    destinationLocation,
    isPinpointDraggingMode,
    mapCenterCoords,
    routeType,
    useRealGps,
    gpsError,
    searchResults,
    isSearchingPlaces,
    tripHistory,
    clearHistory,
    searchPlaces,
    clearAllTripData,
    setUseRealGps,
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
