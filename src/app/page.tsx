'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTripMeter } from '@/hooks/useTripMeter';
import TelemetryPanel from '@/components/Meter/TelemetryPanel';
import TariffSettingsModal from '@/components/Meter/TariffSettingsModal';
import ReceiptModal from '@/components/Meter/ReceiptModal';
import WindshieldMirrorMode from '@/components/HUD/WindshieldMirrorMode';
import { Compass, Sparkles, Maximize, Minimize, ChevronUp, ChevronDown } from 'lucide-react';

const InteractiveMap = dynamic(() => import('@/components/Map/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] rounded-2xl glass-panel flex flex-col items-center justify-center space-y-2">
      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-[10px] font-mono font-bold text-cyan-300">LOADING 1:1 SQUARE GPS MAP...</div>
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
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

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
    <main className="w-screen h-screen p-1.5 md:p-2.5 flex flex-col justify-between overflow-hidden bg-slate-950 text-white">
      {/* 1. Top Header Navbar (Collapsible / Auto-Hide for Maximum Viewport Height) */}
      {!isHeaderHidden ? (
        <header className="h-7 px-2.5 glass-panel rounded-lg flex items-center justify-between mb-1.5 shrink-0 transition-all">
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs">
              🛺
            </div>
            <h1 className="text-[10px] font-black tracking-wider text-white uppercase flex items-center space-x-1">
              <span>TukTuk Go</span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO
              </span>
            </h1>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-[10px] font-mono text-slate-300">
            <div className="flex items-center space-x-1">
              <Compass className="w-3 h-3 text-cyan-400 animate-spin" />
              <span>OSRM Real-Road Routing</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1 text-emerald-400 font-bold">
              <Sparkles className="w-3 h-3" />
              <span>{useRealGps ? '📡 Phone GPS Active' : 'Sim GPS Mode'}</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex items-center space-x-1.5">
            <button
              onClick={toggleFullscreen}
              className="px-2 py-0.5 rounded glass-card border border-white/15 hover:border-cyan-400 text-cyan-300 text-[9px] font-extrabold flex items-center space-x-1"
              title="Toggle Mobile Fullscreen Mode"
            >
              {isFullscreen ? <Minimize className="w-2.5 h-2.5 text-amber-400" /> : <Maximize className="w-2.5 h-2.5 text-cyan-400" />}
              <span>{isFullscreen ? 'EXIT' : '📺 FULL'}</span>
            </button>

            <button
              onClick={() => setIsHeaderHidden(true)}
              className="p-0.5 glass-card rounded text-slate-400 hover:text-white"
              title="Hide Header to Expand Screen"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        </header>
      ) : (
        <div className="flex justify-end mb-1 shrink-0">
          <button
            onClick={() => setIsHeaderHidden(false)}
            className="px-2 py-0.5 glass-card rounded text-cyan-400 text-[9px] font-bold flex items-center space-x-1 border border-cyan-500/30"
            title="Show Header"
          >
            <ChevronDown className="w-3 h-3" />
            <span>SHOW HEADER</span>
          </button>
        </div>
      )}

      {/* 2. Main Landscape Split View: Left 1:1 Square Map Container & Right Telemetry HUD Panel */}
      <div className="flex-1 flex flex-row space-x-1.5 md:space-x-2.5 min-h-0 overflow-hidden">
        {/* Left Panel: 1:1 Square Aspect Ratio Map Container */}
        <section className="h-full aspect-square shrink-0 relative">
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

        {/* Right Panel: Telemetry HUD (Takes all remaining width & 100% height without overflow) */}
        <section className="flex-1 h-full min-w-0 flex flex-col">
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
