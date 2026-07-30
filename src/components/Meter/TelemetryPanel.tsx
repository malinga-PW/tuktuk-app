'use client';

import React, { useState } from 'react';
import { TripStatus, TariffConfig, LocationItem } from '@/hooks/useTripMeter';
import { Play, Pause, Square, RotateCcw, Settings, Receipt, Volume2, VolumeX, Zap, Sliders, ShieldAlert, Radio, Clock, Gauge, Maximize, Minimize, History } from 'lucide-react';

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
  isAudioMuted,
  isHudMirrored,
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
    <div className={`w-full h-full flex flex-col justify-between p-2 glass-panel rounded-2xl border border-white/10 ${isHudMirrored ? 'hud-mirror' : ''}`}>
      {/* 1. Top Title Header Bar (Status, GPS, History, Fullscreen, Reset, Rate Adjust, Settings, Audio) */}
      <div className="flex items-center justify-between pb-1 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-1">
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
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center space-x-0.5 transition-all border ${
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
          {/* Trip History Modal Button */}
          <button
            onClick={onOpenHistoryModal}
            className="px-2 py-0.5 rounded-lg glass-card border border-white/15 hover:border-cyan-400 text-cyan-300 text-[9px] font-extrabold flex items-center space-x-1 transition-all"
            title="View Saved Trip History & Daily Revenue"
          >
            <History className="w-2.5 h-2.5 text-cyan-400" />
            <span>📜 HISTORY</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="px-2 py-0.5 rounded-lg glass-card border border-white/15 hover:border-cyan-400 text-cyan-300 text-[9px] font-extrabold flex items-center space-x-1 transition-all"
            title="Toggle Mobile Fullscreen Mode"
          >
            {isFullscreen ? <Minimize className="w-2.5 h-2.5 text-amber-400" /> : <Maximize className="w-2.5 h-2.5 text-cyan-400" />}
            <span>{isFullscreen ? 'EXIT' : '📺 FULL'}</span>
          </button>

          <button
            onClick={onClearAll}
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

      {/* 2. HERO LAYOUT: Extra Large Passenger Readouts for Total Fare & Distance */}
      <div className="my-1 grid grid-cols-12 gap-1.5 items-stretch flex-1">
        {/* Left Hero Box (7 Cols): TOTAL FARE + DISTANCE KM (EXTRA LARGE PASSENGER READOUT) */}
        <div className="col-span-7 p-2.5 glass-card rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-cyan-950/30 to-slate-900/90 flex flex-col justify-between items-center relative overflow-hidden shadow-2xl">
          <div className="text-[10px] uppercase tracking-widest font-black text-cyan-300 mb-0.5 flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>TOTAL FARE ({tariff.currency})</span>
          </div>

          <div className="flex items-baseline space-x-1 my-auto">
            <span className="text-base font-black text-cyan-400">{tariff.currency}</span>
            <span className="text-6xl sm:text-7xl font-black tracking-tight font-mono glow-cyan">
              {totalFare.toLocaleString('en-US')}
            </span>
            <span className="text-sm font-bold text-slate-400">.00</span>
          </div>

          {/* Integrated Distance Badge (EXTRA LARGE) */}
          <div className="w-full pt-1.5 border-t border-white/10 flex items-center justify-between px-2">
            <span className="text-[10px] uppercase font-black text-slate-300">Distance</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl sm:text-4xl font-black font-mono glow-green">{distanceKm.toFixed(2)}</span>
              <span className="text-xs font-bold text-emerald-400">KM</span>
            </div>
          </div>
        </div>

        {/* Right Stack (5 Cols): TOTAL TIME & WAIT TIME (EXTRA LARGE PASSENGER READOUT) */}
        <div className="col-span-5 grid grid-rows-2 gap-1.5">
          <div className="p-2 glass-card rounded-xl border border-white/10 flex flex-col justify-center items-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Total Time</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-cyan-200 mt-0.5">
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          <div className="p-2 glass-card rounded-xl border border-white/10 flex flex-col justify-center items-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Wait Time</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono glow-amber mt-0.5">
              {formatTime(waitingSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ACTION SECTION: Extra Large Speed Badge + Driving Action Button */}
      <div className="pt-1 flex items-center space-x-1.5 shrink-0">
        <div className="w-[35%] p-2 glass-card rounded-xl border border-cyan-500/40 flex items-center justify-between px-2">
          <div className="flex items-center space-x-1 text-slate-400">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-[9px] uppercase font-black">Speed</span>
          </div>
          <div className="flex items-baseline space-x-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">{currentSpeed}</span>
            <span className="text-[9px] font-bold text-cyan-400">KM/H</span>
          </div>
        </div>

        <div className="flex-1">
          {status === 'IDLE' && (
            <button
              onClick={onStart}
              className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>START ROAD PICKUP METER</span>
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
