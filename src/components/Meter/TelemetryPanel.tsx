'use client';

import React, { useState } from 'react';
import { TripStatus, TariffConfig, LocationItem } from '@/hooks/useTripMeter';
import { Play, Pause, Square, RotateCcw, Settings, Receipt, Volume2, VolumeX, Zap, Sliders, ShieldAlert, Radio, Clock, Gauge, Maximize, Minimize, History, Navigation2 } from 'lucide-react';

interface TelemetryPanelProps {
  status: TripStatus;
  distanceKm: number;
  elapsedSeconds: number;
  waitingSeconds: number;
  currentSpeed: number;
  totalFare: number;
  tariff: TariffConfig;
  estimatedDistanceKm?: number;
  estimatedDurationMins?: number;
  estimatedFare?: number;
  isAudioMuted: boolean;
  isHudMirrored: boolean;
  pickupLocation: LocationItem;
  destinationLocation: LocationItem | null;
  isPinpointDraggingMode: boolean;
  avoidTolls: boolean;
  useRealGps: boolean;
  gpsError: string | null;
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
  onOpenHistoryModal: () => void;
  onUpdateTariff: (fn: (prev: TariffConfig) => TariffConfig) => void;
}

export default function TelemetryPanel({
  status,
  distanceKm,
  elapsedSeconds,
  waitingSeconds,
  currentSpeed,
  totalFare,
  tariff,
  estimatedDistanceKm = 0,
  estimatedDurationMins = 0,
  estimatedFare = 0,
  isAudioMuted,
  isHudMirrored,
  destinationLocation,
  useRealGps,
  gpsError,
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
  onOpenHistoryModal,
  onUpdateTariff,
}: TelemetryPanelProps) {
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  return (
    <div className={`w-full h-full flex flex-col justify-between p-2 glass-panel rounded-2xl border border-white/10 overflow-hidden ${isHudMirrored ? 'hud-mirror' : ''}`}>
      {/* 1. TOP HEADER SECTION */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onToggleRealGps}
            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase flex items-center space-x-1 transition-all border ${
              useRealGps
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20 animate-pulse'
                : 'glass-pill text-slate-400 border-white/10'
            }`}
            title="Toggle Phone Hardware GPS"
          >
            <Radio className={`w-3 h-3 ${useRealGps ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{useRealGps ? '📡 REAL GPS ACTIVE' : '📱 SIM GPS'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onOpenHistoryModal}
            className="px-2.5 py-1 rounded-xl glass-card border border-white/15 hover:border-cyan-400 text-cyan-300 text-[10px] font-extrabold flex items-center space-x-1 transition-all shadow-md"
            title="View Saved Trip History & Daily Revenue"
          >
            <History className="w-3 h-3 text-cyan-400" />
            <span>📜 HISTORY</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded-xl glass-card border border-white/15 hover:border-cyan-400 text-cyan-300 text-[10px] font-extrabold flex items-center space-x-1 transition-all shadow-md"
            title="Toggle Mobile Fullscreen Mode"
          >
            {isFullscreen ? <Minimize className="w-3 h-3 text-amber-400" /> : <Maximize className="w-3 h-3 text-cyan-400" />}
            <span>{isFullscreen ? 'EXIT' : '📺 FULL'}</span>
          </button>

          <button
            onClick={onClearAll}
            className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-extrabold text-[10px] flex items-center space-x-1 transition-all shadow-md"
            title="Fresh Start / Reset All"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>

          <button
            onClick={() => setShowControlPanel(!showControlPanel)}
            className={`p-1.5 rounded-xl text-xs font-bold border ${
              showControlPanel ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'glass-card text-slate-300'
            }`}
            title="Rate Control Drawer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleMute}
            title={isAudioMuted ? 'Unmute Audio & Voice Guidance' : 'Mute Audio'}
            className="p-1.5 glass-card rounded-xl text-slate-300 transition-all"
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>

          <button
            onClick={onOpenTariffModal}
            title="Tariff Settings"
            className="p-1.5 glass-card rounded-xl text-slate-300 hover:rotate-45"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="my-0.5 p-1 rounded-lg bg-rose-500/20 text-rose-300 text-[9px] font-mono flex items-center space-x-1 shrink-0">
          <ShieldAlert className="w-3 h-3 text-rose-400 flex-shrink-0" />
          <span className="truncate">{gpsError}</span>
        </div>
      )}

      {/* ESTIMATED FARE & TIME DISPLAY BADGE */}
      {destinationLocation && estimatedFare > 0 && (
        <div className="my-1 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between px-3 text-xs font-mono shrink-0 shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2 text-[10px] text-slate-300 font-bold">
            <span className="text-cyan-400 uppercase font-black">DEST:</span>
            <span className="text-white truncate max-w-[120px]">{destinationLocation.name}</span>
          </div>

          <div className="flex items-center space-x-2 text-[10px]">
            <span className="text-slate-400">{estimatedDistanceKm.toFixed(2)} KM ({estimatedDurationMins} Mins)</span>
            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-black border border-cyan-500/40">
              EST {tariff.currency} {estimatedFare.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Rate Control Drawer */}
      {showControlPanel && (
        <div className="my-1 p-2 glass-card rounded-xl border border-cyan-500/30 space-y-1 animate-fadeIn bg-slate-900/90 shadow-xl shrink-0">
          <div className="grid grid-cols-3 gap-1.5">
            <div className="p-1.5 bg-slate-950/70 rounded-lg border border-white/10 flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Base</span>
              <div className="flex items-center space-x-1.5 my-0.5">
                <button onClick={() => adjustBaseFare(-10)} className="w-5 h-5 rounded glass-card text-amber-400 font-bold flex items-center justify-center text-xs">-</button>
                <span className="text-sm font-black font-mono text-white">{tariff.baseFare}</span>
                <button onClick={() => adjustBaseFare(10)} className="w-5 h-5 rounded glass-card text-emerald-400 font-bold flex items-center justify-center text-xs">+</button>
              </div>
            </div>

            <div className="p-1.5 bg-slate-950/70 rounded-lg border border-white/10 flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Per KM</span>
              <div className="flex items-center space-x-1.5 my-0.5">
                <button onClick={() => adjustRatePerKm(-5)} className="w-5 h-5 rounded glass-card text-amber-400 font-bold flex items-center justify-center text-xs">-</button>
                <span className="text-sm font-black font-mono text-white">{tariff.ratePerKm}</span>
                <button onClick={() => adjustRatePerKm(5)} className="w-5 h-5 rounded glass-card text-emerald-400 font-bold flex items-center justify-center text-xs">+</button>
              </div>
            </div>

            <div className="p-1.5 bg-slate-950/70 rounded-lg border border-white/10 flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Wait/Min</span>
              <div className="flex items-center space-x-1.5 my-0.5">
                <button onClick={() => adjustWaitRate(-1)} className="w-5 h-5 rounded glass-card text-amber-400 font-bold flex items-center justify-center text-xs">-</button>
                <span className="text-sm font-black font-mono text-white">{tariff.waitRatePerMin}</span>
                <button onClick={() => adjustWaitRate(1)} className="w-5 h-5 rounded glass-card text-emerald-400 font-bold flex items-center justify-center text-xs">+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MIDDLE HERO HUD TILES */}
      <div className="my-1.5 grid grid-cols-12 gap-2 items-stretch shrink-0 max-h-[55%]">
        {/* Left Hero Tile (7 Cols): TOTAL FARE + DISTANCE KM */}
        <div className="col-span-7 p-3 glass-card rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/95 via-cyan-950/40 to-slate-900/95 flex flex-col justify-between items-center relative overflow-hidden shadow-2xl">
          <div className="text-[10px] uppercase tracking-widest font-black text-cyan-300 flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>TOTAL FARE ({tariff.currency})</span>
          </div>

          <div className="flex items-baseline space-x-1 my-1">
            <span className="text-lg font-black text-cyan-400">{tariff.currency}</span>
            <span className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter font-mono glow-cyan leading-none">
              {totalFare.toLocaleString('en-US')}
            </span>
            <span className="text-sm font-bold text-slate-400">.00</span>
          </div>

          <div className="w-full pt-1.5 border-t border-white/10 flex items-center justify-between px-1">
            <span className="text-[10px] uppercase font-black text-slate-300">Distance</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono glow-green leading-none">{distanceKm.toFixed(2)}</span>
              <span className="text-xs font-bold text-emerald-400">KM</span>
            </div>
          </div>
        </div>

        {/* Right Hero Stack (5 Cols): TOTAL TIME & WAIT TIME */}
        <div className="col-span-5 grid grid-rows-2 gap-2">
          <div className="p-2.5 glass-card rounded-2xl border border-white/10 flex flex-col justify-center items-center shadow-lg">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Total Time</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-cyan-200 mt-1 leading-none">
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          <div className="p-2.5 glass-card rounded-2xl border border-white/10 flex flex-col justify-center items-center shadow-lg">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Wait Time</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono glow-amber mt-1 leading-none">
              {formatTime(waitingSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ACTION SECTION */}
      <div className="pt-2 flex items-center space-x-2 shrink-0">
        <div className="w-[32%] p-2.5 glass-card rounded-2xl border border-cyan-500/40 flex items-center justify-between px-3 shadow-xl">
          <div className="flex items-center space-x-1 text-slate-400">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] uppercase font-black">Speed</span>
          </div>
          <div className="flex items-baseline space-x-0.5">
            <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-300 leading-none">{currentSpeed}</span>
            <span className="text-[9px] font-bold text-cyan-400">KM/H</span>
          </div>
        </div>

        <div className="flex-1">
          {status === 'IDLE' && (
            <button
              onClick={onStart}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-2xl shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all border border-emerald-300"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>{destinationLocation ? 'START RIDE NAVIGATION' : 'START ROAD PICKUP METER'}</span>
            </button>
          )}

          {status === 'RUNNING' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onPause}
                className="flex-1 py-4 px-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-amber-500/30 border border-amber-300"
              >
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>PAUSE</span>
              </button>
              <button
                onClick={onFinish}
                className="flex-1 py-4 px-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-red-500/30 border border-rose-400"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>END RIDE</span>
              </button>
            </div>
          )}

          {status === 'PAUSED' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onResume}
                className="flex-1 py-4 px-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-emerald-500/30 border border-emerald-300"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>RESUME</span>
              </button>
              <button
                onClick={onFinish}
                className="flex-1 py-4 px-3 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-red-500/30 border border-rose-400"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>END RIDE</span>
              </button>
            </div>
          )}

          {status === 'FINISHED' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenReceiptModal}
                className="flex-1 py-4 px-3 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xl shadow-cyan-500/30 border border-cyan-300"
              >
                <Receipt className="w-4 h-4" />
                <span>RECEIPT</span>
              </button>
              <button
                onClick={onReset}
                className="py-4 px-4 rounded-2xl glass-card text-slate-300 font-bold text-xs hover:text-white border border-white/10"
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
