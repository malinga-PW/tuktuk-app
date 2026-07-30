'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTripMeter } from '@/hooks/useTripMeter';
import TelemetryPanel from '@/components/Meter/TelemetryPanel';
import TariffSettingsModal from '@/components/Meter/TariffSettingsModal';
import ReceiptModal from '@/components/Meter/ReceiptModal';
import WindshieldMirrorMode from '@/components/HUD/WindshieldMirrorMode';
import { Compass, Sparkles, Maximize, Minimize } from 'lucide-react';

const InteractiveMap = dynamic(() => import('@/components/Map/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] rounded-2xl glass-panel flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-xs font-mono font-bold text-cyan-300">LOADING 1:1 SCALE GPS MAP...</div>
    </div>
  ),
});

export default function Home() {
  const {
    status,
    distanceKm,
    elapsedSeconds,
    waitingSeconds,
    currentSpeed,
    currentPosition,
    routePath,
    fullNavPath,
    tariff,
    totalFare,
    isAudioMuted,
    isHudMirrored,
    mapTileStyle,
    isSimulatingTraffic,
    showTrafficOverlay,
    pickupLocation,
    destinationLocation,
    isPinpointDraggingMode,
    avoidTolls,
    useRealGps,
    gpsError,
    searchResults,
    isSearchingPlaces,
    searchPlaces,
    clearAllTripData,
    setUseRealGps,
    setAvoidTolls,
    setTariff,
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
  } = useTripMeter();

  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen API toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <main className="w-screen h-screen p-2 md:p-3 flex flex-col justify-between overflow-hidden bg-slate-950 text-white">
      {/* Top Header Navbar */}
      <header className="h-10 px-3 glass-panel rounded-xl flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-cyan-500/20">
            🛺
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-white uppercase flex items-center space-x-1.5">
              <span>TukTuk Go</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO METER
              </span>
            </h1>
          </div>
        </div>

        {/* Center Live Status Banner */}
        <div className="hidden sm:flex items-center space-x-3 text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>OSRM Real-Road Engine</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1 text-emerald-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{useRealGps ? '📡 Real Phone GPS Connected' : 'Simulated GPS Mode'}</span>
          </div>
        </div>

        {/* Right Info & Fullscreen Toggle Button */}
        <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded-lg glass-card border border-white/15 hover:border-cyan-400 text-cyan-300 text-[10px] font-extrabold flex items-center space-x-1 transition-all"
            title="Toggle Mobile Fullscreen Mode"
          >
            {isFullscreen ? <Minimize className="w-3 h-3 text-amber-400" /> : <Maximize className="w-3 h-3 text-cyan-400" />}
            <span>{isFullscreen ? 'EXIT FULLSCREEN' : '📺 FULLSCREEN'}</span>
          </button>

          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="hidden sm:inline">1:1 SCALE MAP</span>
        </div>
      </header>

      {/* Landscape Split Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 min-h-0 overflow-hidden">
        {/* Left Panel: 1:1 Scale Map */}
        <section className="md:col-span-7 h-full w-full relative">
          <InteractiveMap
            currentPosition={currentPosition}
            routePath={routePath}
            fullNavPath={fullNavPath}
            currentSpeed={currentSpeed}
            tileStyle={mapTileStyle}
            isSimulatingTraffic={isSimulatingTraffic}
            showTrafficOverlay={showTrafficOverlay}
            pickupLocation={pickupLocation}
            destinationLocation={destinationLocation}
            isPinpointDraggingMode={isPinpointDraggingMode}
            avoidTolls={avoidTolls}
            onTileStyleChange={setMapTileStyle}
            onToggleTraffic={() => setIsSimulatingTraffic(!isSimulatingTraffic)}
            onToggleTrafficOverlay={() => setShowTrafficOverlay(!showTrafficOverlay)}
            onMapCenterChange={(coords) => setMapCenterCoords(coords)}
            onConfirmPinpoint={confirmPinpointDestination}
          />
        </section>

        {/* Right Panel: Cost, KM, Waiting Time Telemetry HUD */}
        <section className="md:col-span-5 h-full w-full flex flex-col">
          <TelemetryPanel
            status={status}
            distanceKm={distanceKm}
            elapsedSeconds={elapsedSeconds}
            waitingSeconds={waitingSeconds}
            totalFare={totalFare}
            tariff={tariff}
            isAudioMuted={isAudioMuted}
            isHudMirrored={isHudMirrored}
            pickupLocation={pickupLocation}
            destinationLocation={destinationLocation}
            isPinpointDraggingMode={isPinpointDraggingMode}
            avoidTolls={avoidTolls}
            useRealGps={useRealGps}
            gpsError={gpsError}
            searchResults={searchResults}
            isSearchingPlaces={isSearchingPlaces}
            onSearchPlaces={searchPlaces}
            onClearAll={clearAllTripData}
            onToggleAvoidTolls={() => setAvoidTolls(!avoidTolls)}
            onToggleRealGps={() => setUseRealGps(!useRealGps)}
            onStart={startTrip}
            onPause={pauseTrip}
            onResume={resumeTrip}
            onFinish={finishTrip}
            onReset={resetTrip}
            onToggleMute={toggleMute}
            onToggleMirror={() => setIsHudMirrored(true)}
            onOpenTariffModal={() => setIsTariffModalOpen(true)}
            onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
            onUpdateTariff={setTariff}
            onSelectDestination={(dest) => setDestinationLocation(dest)}
            onClearDestination={() => setDestinationLocation(null)}
            onTogglePinpointMode={() => setIsPinpointDraggingMode(!isPinpointDraggingMode)}
          />
        </section>
      </div>

      {/* Modals & Overlays */}
      <TariffSettingsModal
        isOpen={isTariffModalOpen}
        tariff={tariff}
        onClose={() => setIsTariffModalOpen(false)}
        onSave={(newTariff) => setTariff(newTariff)}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        distanceKm={distanceKm}
        elapsedSeconds={elapsedSeconds}
        waitingSeconds={waitingSeconds}
        totalFare={totalFare}
        tariff={tariff}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      <WindshieldMirrorMode
        isOpen={isHudMirrored}
        status={status}
        distanceKm={distanceKm}
        waitingSeconds={waitingSeconds}
        currentSpeed={currentSpeed}
        totalFare={totalFare}
        currency={tariff.currency}
        onClose={() => setIsHudMirrored(false)}
      />
    </main>
  );
}
