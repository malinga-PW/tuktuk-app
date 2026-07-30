'use client';

import React, { useState, useEffect } from 'react';
import { TripStatus, TariffConfig, LocationItem } from '@/hooks/useTripMeter';
import { Play, Pause, Square, RotateCcw, Settings, Receipt, Volume2, VolumeX, Zap, Sliders, Plus, Minus, MapPin, Target, CheckCircle2, ShieldAlert, Loader2, X, Radio, Clock, Gauge } from 'lucide-react';

interface TelemetryPanelProps {
  status: TripStatus;
  distanceKm: number;
  elapsedSeconds: number;
  waitingSeconds: number;
  currentSpeed: number;
  totalFare: number;
  tariff: TariffConfig;
  isAudioMuted: boolean;
  isHudMirrored: boolean;
  pickupLocation: LocationItem;
  destinationLocation: LocationItem | null;
  isPinpointDraggingMode: boolean;
  avoidTolls: boolean;
  useRealGps: boolean;
  gpsError: string | null;
  searchResults: LocationItem[];
  isSearchingPlaces: boolean;
  onSearchPlaces: (query: string) => void;
  onClearAll: () => void;
  onToggleAvoidTolls: () => void;
  onToggleRealGps: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onReset: () => void;
  onToggleMute: () => void;
  onToggleMirror: () => void;
  onOpenTariffModal: () => void;
  onOpenReceiptModal: () => void;
  onUpdateTariff: (fn: (prev: TariffConfig) => TariffConfig) => void;
  onSelectDestination: (dest: LocationItem) => void;
  onClearDestination: () => void;
  onTogglePinpointMode: () => void;
}

export default function TelemetryPanel({
  status,
  distanceKm,
  elapsedSeconds,
  waitingSeconds,
  currentSpeed,
  totalFare,
  tariff,
  isAudioMuted,
  isHudMirrored,
  destinationLocation,
  isPinpointDraggingMode,
  useRealGps,
  gpsError,
  searchResults,
  isSearchingPlaces,
  onSearchPlaces,
  onClearAll,
  onToggleRealGps,
  onStart,
  onPause,
  onResume,
  onFinish,
  onReset,
  onToggleMute,
  onOpenTariffModal,
  onOpenReceiptModal,
  onUpdateTariff,
  onSelectDestination,
  onClearDestination,
  onTogglePinpointMode,
}: TelemetryPanelProps) {
  const [showControlPanel, setShowControlPanel] = useState(false);
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

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustBaseFare = (delta: number) => {
    onUpdateTariff((prev) => ({ ...prev, baseFare: Math.max(0, prev.baseFare + delta) }));
  };

  const adjustRatePerKm = (delta: number) => {
    onUpdateTariff((prev) => ({ ...prev, ratePerKm: Math.max(0, prev.ratePerKm + delta) }));
  };

  const adjustWaitRate = (delta: number) => {
    onUpdateTariff((prev) => ({ ...prev, waitRatePerMin: Math.max(0, prev.waitRatePerMin + delta) }));
  };

  const handleClearDestination = () => {
    setSearchQuery('');
    onClearDestination();
    setIsSearchOpen(false);
  };

  return (
    <div className={`w-full h-full flex flex-col justify-between p-2 glass-panel rounded-2xl border border-white/10 ${isHudMirrored ? 'hud-mirror' : ''}`}>
      {/* 1. Integrated Top Title Header Bar (Status, GPS, Reset, Rate Adjust, Settings, Audio) */}
      <div className="flex items-center justify-between pb-1 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-1.5">
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 ${
            status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' :
            status === 'PAUSED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
            status === 'FINISHED' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
            'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              status === 'RUNNING' ? 'bg-emerald-400' :
              status === 'PAUSED' ? 'bg-amber-400' :
              status === 'FINISHED' ? 'bg-cyan-400' : 'bg-slate-500'
            }`}></span>
            <span>{status === 'IDLE' ? 'ROAD PICKUP READY' : status}</span>
          </div>

          <button
            onClick={onToggleRealGps}
            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center space-x-1 transition-all border ${
              useRealGps
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20 animate-pulse'
                : 'glass-pill text-slate-400 border-white/10'
            }`}
            title="Toggle Phone Hardware GPS"
          >
            <Radio className={`w-2.5 h-2.5 ${useRealGps ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{useRealGps ? 'REAL GPS' : 'SIM GPS'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setSearchQuery('');
              onClearAll();
            }}
            className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-extrabold text-[9px] flex items-center space-x-1 transition-all"
            title="Fresh Start / Reset All"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>RESET</span>
          </button>

          <button
            onClick={() => setShowControlPanel(!showControlPanel)}
            className={`p-1 rounded-lg text-xs font-bold border ${
              showControlPanel ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'glass-card text-slate-300'
            }`}
            title="Rate Control Drawer"
          >
            <Sliders className="w-3 h-3" />
          </button>

          <button
            onClick={onToggleMute}
            title={isAudioMuted ? 'Unmute Audio & Voice Guidance' : 'Mute Audio'}
            className="p-1 glass-card rounded-lg text-slate-300 transition-all"
          >
            {isAudioMuted ? <VolumeX className="w-3 h-3 text-slate-500" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
          </button>

          <button
            onClick={onOpenTariffModal}
            title="Tariff Settings"
            className="p-1 glass-card rounded-lg text-slate-300 hover:rotate-45"
          >
            <Settings className="w-3 h-3 text-amber-400" />
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="my-0.5 p-1 rounded-lg bg-rose-500/20 text-rose-300 text-[9px] font-mono flex items-center space-x-1">
          <ShieldAlert className="w-3 h-3 text-rose-400 flex-shrink-0" />
          <span className="truncate">{gpsError}</span>
        </div>
      )}

      {/* 2. Destination Search & Drag Pin Row (Pickup row removed for maximum space) */}
      <div className="my-1 p-1.5 glass-card rounded-xl border border-white/10 flex items-center space-x-1.5 relative shrink-0">
        <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 fill-rose-400" />
        <div className="flex-1 relative">
          <div className="flex items-center space-x-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="(Optional) Search destination or tap start..."
              className="w-full bg-slate-900/90 border border-white/15 px-2 py-1 pr-6 rounded-md text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                onClick={handleClearDestination}
                className="absolute right-1.5 text-slate-400 hover:text-white"
                title="Clear Destination"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-panel rounded-xl border border-cyan-500/40 max-h-36 overflow-y-auto shadow-2xl p-1 bg-slate-950">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectDestination(item);
                    setSearchQuery(item.name);
                    setIsSearchOpen(false);
                  }}
                  className="w-full text-left p-1 hover:bg-cyan-500/20 rounded-md flex items-center justify-between text-[10px] transition-colors border-b border-white/5 last:border-0"
                >
                  <div className="overflow-hidden mr-1">
                    <div className="font-bold text-white truncate text-[10px]">{item.name}</div>
                    <div className="text-[8px] text-slate-400 font-mono truncate">{item.address}</div>
                  </div>
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onTogglePinpointMode}
          className={`px-2 py-1 rounded text-[9px] font-black transition-all border shrink-0 flex items-center space-x-1 ${
            isPinpointDraggingMode
              ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
              : 'glass-pill text-cyan-300 border-cyan-500/30'
          }`}
          title="Drag Map Center"
        >
          <Target className="w-3 h-3" />
          <span>{isPinpointDraggingMode ? 'PINNING' : 'DRAG PIN'}</span>
        </button>
      </div>

      {/* Rate Control Drawer */}
      {showControlPanel && (
        <div className="my-0.5 p-1.5 glass-card rounded-xl border border-cyan-500/30 space-y-1 animate-fadeIn bg-slate-900/90 shadow-xl shrink-0">
          <div className="grid grid-cols-3 gap-1">
            <div className="p-1 bg-slate-950/70 rounded-lg border border-white/10 flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Base</span>
              <div className="flex items-center space-x-1 my-0.5">
                <button onClick={() => adjustBaseFare(-10)} className="w-4 h-4 rounded glass-card text-amber-400 font-bold flex items-center justify-center text-[10px]">-</button>
                <span className="text-xs font-black font-mono text-white">{tariff.baseFare}</span>
                <button onClick={() => adjustBaseFare(10)} className="w-4 h-4 rounded glass-card text-emerald-400 font-bold flex items-center justify-center text-[10px]">+</button>
              </div>
            </div>

            <div className="p-1 bg-slate-950/70 rounded-lg border border-white/10 flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Per KM</span>
              <div className="flex items-center space-x-1 my-0.5">
                <button onClick={() => adjustRatePerKm(-5)} className="w-4 h-4 rounded glass-card text-amber-400 font-bold flex items-center justify-center text-[10px]">-</button>
                <span className="text-xs font-black font-mono text-white">{tariff.ratePerKm}</span>
                <button onClick={() => adjustRatePerKm(5)} className="w-4 h-4 rounded glass-card text-emerald-400 font-bold flex items-center justify-center text-[10px]">+</button>
              </div>
            </div>

            <div className="p-1 bg-slate-950/70 rounded-lg border border-white/10 flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Wait/Min</span>
              <div className="flex items-center space-x-1 my-0.5">
                <button onClick={() => adjustWaitRate(-1)} className="w-4 h-4 rounded glass-card text-amber-400 font-bold flex items-center justify-center text-[10px]">-</button>
                <span className="text-xs font-black font-mono text-white">{tariff.waitRatePerMin}</span>
                <button onClick={() => adjustWaitRate(1)} className="w-4 h-4 rounded glass-card text-emerald-400 font-bold flex items-center justify-center text-[10px]">+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. HERO LAYOUT: Total Fare + Distance (KM) on Left (60%), Total Time & Wait Time on Right (40%) */}
      <div className="my-1 grid grid-cols-12 gap-1.5 items-stretch flex-1">
        {/* Left Hero Box (7 Cols): TOTAL FARE + DISTANCE KM INTEGRATED */}
        <div className="col-span-7 p-2 glass-card rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-cyan-950/20 to-slate-900/90 flex flex-col justify-between items-center relative overflow-hidden">
          <div className="text-[8px] uppercase tracking-widest font-black text-cyan-300/80 mb-0.5 flex items-center space-x-1">
            <Zap className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
            <span>TOTAL FARE ({tariff.currency})</span>
          </div>

          <div className="flex items-baseline space-x-1 my-auto">
            <span className="text-xs font-black text-cyan-400/80">{tariff.currency}</span>
            <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono glow-cyan">
              {totalFare.toLocaleString('en-US')}
            </span>
            <span className="text-[9px] font-bold text-slate-400">.00</span>
          </div>

          {/* Integrated Distance Badge inside Top Hero Box */}
          <div className="w-full pt-1 border-t border-white/10 flex items-center justify-between px-2">
            <span className="text-[8px] uppercase font-black text-slate-400">Distance</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-black font-mono glow-green">{distanceKm.toFixed(2)}</span>
              <span className="text-[9px] font-bold text-emerald-400">KM</span>
            </div>
          </div>
        </div>

        {/* Right Stack (5 Cols): TOTAL TIME & WAIT TIME */}
        <div className="col-span-5 grid grid-rows-2 gap-1">
          <div className="p-1.5 glass-card rounded-xl border border-white/5 flex flex-col justify-center items-center">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Clock className="w-2.5 h-2.5 text-cyan-400" />
              <span>Total Time</span>
            </div>
            <div className="text-base font-black font-mono text-cyan-200 mt-0.5">
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          <div className="p-1.5 glass-card rounded-xl border border-white/5 flex flex-col justify-center items-center">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Clock className="w-2.5 h-2.5 text-amber-400" />
              <span>Wait Time</span>
            </div>
            <div className="text-base font-black font-mono glow-amber mt-0.5">
              {formatTime(waitingSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ACTION SECTION: Speed Badge (where Distance used to be) + Big Driving Action Button */}
      <div className="pt-1 flex items-center space-x-1.5 shrink-0">
        {/* Live Speed Gauge Badge (where Distance used to be) */}
        <div className="w-[35%] p-2 glass-card rounded-xl border border-cyan-500/30 flex items-center justify-between px-2">
          <div className="flex items-center space-x-1 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[8px] uppercase font-black">Speed</span>
          </div>
          <div className="flex items-baseline space-x-0.5">
            <span className="text-lg font-black font-mono text-cyan-300">{currentSpeed}</span>
            <span className="text-[8px] font-bold text-cyan-400">KM/H</span>
          </div>
        </div>

        {/* Big Driving Action Button (Increased height for driving touch targets) */}
        <div className="flex-1">
          {status === 'IDLE' && (
            <button
              onClick={onStart}
              className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{destinationLocation ? 'START RIDE NAVIGATION' : 'START ROAD PICKUP METER'}</span>
            </button>
          )}

          {status === 'RUNNING' && (
            <div className="flex items-center space-x-1">
              <button
                onClick={onPause}
                className="flex-1 py-3 px-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-amber-500/30"
              >
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>PAUSE</span>
              </button>
              <button
                onClick={onFinish}
                className="flex-1 py-3 px-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-red-500/30"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>END RIDE</span>
              </button>
            </div>
          )}

          {status === 'PAUSED' && (
            <div className="flex items-center space-x-1">
              <button
                onClick={onResume}
                className="flex-1 py-3 px-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-emerald-500/30"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>RESUME</span>
              </button>
              <button
                onClick={onFinish}
                className="flex-1 py-3 px-2 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-red-500/30"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>END RIDE</span>
              </button>
            </div>
          )}

          {status === 'FINISHED' && (
            <div className="flex items-center space-x-1">
              <button
                onClick={onOpenReceiptModal}
                className="flex-1 py-3 px-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-cyan-500/30"
              >
                <Receipt className="w-4 h-4" />
                <span>RECEIPT</span>
              </button>
              <button
                onClick={onReset}
                className="py-3 px-3 rounded-xl glass-card text-slate-300 font-bold text-xs hover:text-white border border-white/10"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
