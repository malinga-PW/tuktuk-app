'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTripMeter } from '@/hooks/useTripMeter';
import TelemetryPanel from '@/components/Meter/TelemetryPanel';
import TariffSettingsModal from '@/components/Meter/TariffSettingsModal';
import ReceiptModal from '@/components/Meter/ReceiptModal';
import TripHistoryModal from '@/components/Meter/TripHistoryModal';
import WindshieldMirrorMode from '@/components/HUD/WindshieldMirrorMode';

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
    vehicleHeading,
    currentPosition,
    routePath,
    fullNavPath,
    tariff,
    totalFare,
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
    avoidTolls,
    useRealGps,
    gpsError,
    searchResults,
    isSearchingPlaces,
    tripHistory,
    clearHistory,
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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  return (
    <main className="w-screen h-screen p-1 md:p-2 flex flex-col sm:flex-row justify-between overflow-hidden bg-slate-950 text-white space-y-1 sm:space-y-0 sm:space-x-2">
      {/* Map Section: 20% Height Increase in Portrait mode (58vh), Left in Landscape (Full Height Aspect-Square) */}
      <section className="w-full sm:w-auto h-[58vh] sm:h-full sm:aspect-square shrink-0 relative overflow-hidden bg-slate-950 rounded-2xl">
        <InteractiveMap
          status={status}
          currentPosition={currentPosition}
          routePath={routePath}
          fullNavPath={fullNavPath}
          currentSpeed={currentSpeed}
          vehicleHeading={vehicleHeading}
          tileStyle={mapTileStyle}
          isSimulatingTraffic={isSimulatingTraffic}
          showTrafficOverlay={showTrafficOverlay}
          pickupLocation={pickupLocation}
          destinationLocation={destinationLocation}
          estimatedDistanceKm={estimatedDistanceKm}
          estimatedDurationMins={estimatedDurationMins}
          estimatedFare={estimatedFare}
          currency={tariff.currency}
          isPinpointDraggingMode={isPinpointDraggingMode}
          avoidTolls={avoidTolls}
          searchResults={searchResults}
          isSearchingPlaces={isSearchingPlaces}
          onSearchPlaces={searchPlaces}
          onSelectDestination={(dest) => setDestinationLocation(dest)}
          onClearDestination={() => setDestinationLocation(null)}
          onTogglePinpointMode={() => setIsPinpointDraggingMode(!isPinpointDraggingMode)}
          onTileStyleChange={setMapTileStyle}
          onToggleTraffic={() => setIsSimulatingTraffic(!isSimulatingTraffic)}
          onToggleTrafficOverlay={() => setShowTrafficOverlay(!showTrafficOverlay)}
          onMapCenterChange={(coords) => setMapCenterCoords(coords)}
          onConfirmPinpoint={(customCoords) => {
            if (customCoords) {
              setDestinationLocation({
                id: `pin-${Date.now()}`,
                name: 'Pinned Map Location',
                address: `GPS (${customCoords.lat.toFixed(4)}, ${customCoords.lng.toFixed(4)})`,
                lat: customCoords.lat,
                lng: customCoords.lng,
              });
              setIsPinpointDraggingMode(false);
            } else {
              confirmPinpointDestination();
            }
          }}
          onToggleAvoidTolls={() => setAvoidTolls(!avoidTolls)}
        />
      </section>

      {/* Telemetry Section: Bottom in Portrait (41vh), Right in Landscape (Flex 1 Full Height) */}
      <section className="w-full sm:flex-1 h-[41vh] sm:h-full min-w-0 flex flex-col overflow-hidden">
        <TelemetryPanel
          status={status}
          distanceKm={distanceKm}
          elapsedSeconds={elapsedSeconds}
          waitingSeconds={waitingSeconds}
          currentSpeed={currentSpeed}
          totalFare={totalFare}
          tariff={tariff}
          estimatedDistanceKm={estimatedDistanceKm}
          estimatedDurationMins={estimatedDurationMins}
          estimatedFare={estimatedFare}
          isAudioMuted={isAudioMuted}
          isHudMirrored={isHudMirrored}
          pickupLocation={pickupLocation}
          destinationLocation={destinationLocation}
          isPinpointDraggingMode={isPinpointDraggingMode}
          avoidTolls={avoidTolls}
          useRealGps={useRealGps}
          gpsError={gpsError}
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
          onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
          onUpdateTariff={setTariff}
        />
      </section>

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
        estimatedDistanceKm={estimatedDistanceKm}
        estimatedDurationMins={estimatedDurationMins}
        estimatedFare={estimatedFare}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      <TripHistoryModal
        isOpen={isHistoryModalOpen}
        history={tripHistory}
        onClose={() => setIsHistoryModalOpen(false)}
        onClearHistory={clearHistory}
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
