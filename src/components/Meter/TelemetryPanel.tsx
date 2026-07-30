'use client';

import React, { useState, useEffect } from 'react';
import { TripStatus, TariffConfig, LocationItem } from '@/hooks/useTripMeter';
import { Play, Pause, Square, RotateCcw, Settings, Receipt, Volume2, VolumeX, Moon, Zap, Luggage, Wind, Eye, Sliders, Plus, Minus, MapPin, Navigation, Search, Target, CheckCircle2, ShieldAlert, Navigation2, Loader2, Trash2, X, Radio, Smartphone } from 'lucide-react';

interface TelemetryPanelProps {
  status: TripStatus;
  distanceKm: number;
  elapsedSeconds: number;
  waitingSeconds: number;
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
  totalFare,
  tariff,
  isAudioMuted,
  isHudMirrored,
  pickupLocation,
  destinationLocation,
  isPinpointDraggingMode,
  avoidTolls,
  useRealGps,
  gpsError,
  searchResults,
  isSearchingPlaces,
  onSearchPlaces,
  onClearAll,
  onToggleAvoidTolls,
  onToggleRealGps,
  onStart,
  onPause,
  onResume,
  onFinish,
  onReset,
  onToggleMute,
  onToggleMirror,
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
    <div className={`w-full h-full flex flex-col justify-between p-4 glass-panel rounded-2xl border border-white/10 ${isHudMirrored ? 'hud-mirror' : ''}`}>
      {/* Header Bar: Status Badge + Real Mobile GPS Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center space-x-2">
          {/* Status Pill */}
          <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 ${
            status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' :
            status === 'PAUSED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
            status === 'FINISHED' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
            'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              status === 'RUNNING' ? 'bg-emerald-400' :
              status === 'PAUSED' ? 'bg-amber-400' :
              status === 'FINISHED' ? 'bg-cyan-400' : 'bg-slate-500'
            }`}></span>
            <span>{status === 'IDLE' ? 'METER READY' : status}</span>
          </div>

          {/* Real Device Mobile GPS Toggle Button */}
          <button
            onClick={onToggleRealGps}
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 transition-all border ${
              useRealGps
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20 animate-pulse'
                : 'glass-pill text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Enable Real Phone Hardware GPS Tracking"
          >
            <Radio className={`w-3 h-3 ${useRealGps ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{useRealGps ? '📡 REAL PHONE GPS ACTIVE' : '📱 ENABLE PHONE GPS'}</span>
          </button>
        </div>

        {/* Quick Utility Icons & Fresh Start Button */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setSearchQuery('');
              onClearAll();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-extrabold text-xs flex items-center space-x-1 transition-all"
            title="Fresh Start / Clear All Trip Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>FRESH START</span>
          </button>

          <button
            onClick={() => setShowControlPanel(!showControlPanel)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              showControlPanel ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'glass-card text-slate-300 hover:text-white'
            }`}
            title="Rate Control Drawer"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMirror}
            title="Mirror Display (Windshield HUD)"
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              isHudMirrored ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30' : 'glass-card text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 glass-card rounded-xl text-slate-300 hover:text-white transition-all"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onOpenTariffModal}
            title="Detailed Rate Settings Modal"
            className="p-2 glass-card rounded-xl text-slate-300 hover:text-white transition-all hover:rotate-45"
          >
            <Settings className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* GPS Error Notification Warning */}
      {gpsError && (
        <div className="my-1 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Pickup & Destination Search Section */}
      <div className="my-2 p-3 glass-card rounded-2xl border border-white/10 space-y-2 relative">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Navigation className="w-3.5 h-3.5 fill-emerald-400" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Pickup Location</div>
            <div className="text-xs font-bold text-white truncate">{pickupLocation.name}</div>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-mono">
            {useRealGps ? 'REAL GPS' : 'ROAD ANCHOR'}
          </span>
        </div>

        <div className="border-t border-white/10 my-1"></div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            <MapPin className="w-3.5 h-3.5 fill-rose-400" />
          </div>
          <div className="flex-1 relative">
            <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center justify-between">
              <span>Destination</span>
              {isSearchingPlaces && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
            </div>
            <div className="flex items-center space-x-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search any place, shop or city in Sri Lanka..."
                className="w-full bg-slate-900/90 border border-white/15 px-2.5 py-1 pr-7 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={handleClearDestination}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-white transition-colors"
                  title="Clear Destination"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-panel rounded-xl border border-cyan-500/40 max-h-48 overflow-y-auto shadow-2xl p-1 bg-slate-950">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectDestination(item);
                      setSearchQuery(item.name);
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-left p-2 hover:bg-cyan-500/20 rounded-lg flex items-center justify-between text-xs transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="overflow-hidden mr-2">
                      <div className="font-bold text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{item.address}</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onTogglePinpointMode}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border flex items-center space-x-1 ${
              isPinpointDraggingMode
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'glass-pill text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
            }`}
            title="Drag Map Center to Pinpoint Destination"
          >
            <Target className="w-3.5 h-3.5" />
            <span>{isPinpointDraggingMode ? 'PINNING...' : 'DRAG PIN'}</span>
          </button>
        </div>

        {/* Route Preferences Bar */}
        <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
          <button
            onClick={onToggleAvoidTolls}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center space-x-1 ${
              avoidTolls
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'glass-pill text-slate-400 border-white/10'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>{avoidTolls ? '🚫 Avoid Tolls (TukTuk Safety)' : 'Allow Expressways'}</span>
          </button>

          <div className="flex items-center space-x-1 text-[10px] font-mono text-cyan-300">
            <Navigation2 className="w-3 h-3 text-cyan-400" />
            <span>OSRM Real Road Routing Active</span>
          </div>
        </div>
      </div>

      {/* Collapsible Rate Control Panel Drawer */}
      {showControlPanel && (
        <div className="my-2 p-3 glass-card rounded-2xl border border-cyan-500/30 space-y-2 animate-fadeIn bg-slate-900/90 shadow-xl">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-300 pb-1 border-b border-white/10">
            <span className="flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5" />
              <span>LIVE FARE RATE CONTROLLER</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2 bg-slate-950/70 rounded-xl border border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Base Fare</span>
              <div className="flex items-center space-x-1 my-1">
                <button onClick={() => adjustBaseFare(-10)} className="w-6 h-6 rounded-lg glass-card text-amber-400 font-bold flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-black font-mono text-white">{tariff.baseFare}</span>
                <button onClick={() => adjustBaseFare(10)} className="w-6 h-6 rounded-lg glass-card text-emerald-400 font-bold flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-2 bg-slate-950/70 rounded-xl border border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Per KM</span>
              <div className="flex items-center space-x-1 my-1">
                <button onClick={() => adjustRatePerKm(-5)} className="w-6 h-6 rounded-lg glass-card text-amber-400 font-bold flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-black font-mono text-white">{tariff.ratePerKm}</span>
                <button onClick={() => adjustRatePerKm(5)} className="w-6 h-6 rounded-lg glass-card text-emerald-400 font-bold flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-2 bg-slate-950/70 rounded-xl border border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Wait / Min</span>
              <div className="flex items-center space-x-1 my-1">
                <button onClick={() => adjustWaitRate(-1)} className="w-6 h-6 rounded-lg glass-card text-amber-400 font-bold flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-black font-mono text-white">{tariff.waitRatePerMin}</span>
                <button onClick={() => adjustWaitRate(1)} className="w-6 h-6 rounded-lg glass-card text-emerald-400 font-bold flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Fare Display Box (Hero HUD Display) */}
      <div className="my-2 p-4 glass-card rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-cyan-950/20 to-slate-900/90 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

        <div className="text-xs uppercase tracking-widest font-extrabold text-cyan-300/80 mb-1 flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>TOTAL FARE ({tariff.currency})</span>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-sm font-black text-cyan-400/80">{tariff.currency}</span>
          <span className="text-5xl lg:text-6xl font-black tracking-tight font-mono glow-cyan">
            {totalFare.toLocaleString('en-US')}
          </span>
          <span className="text-xs font-bold text-slate-400">.00</span>
        </div>

        <div className="mt-1 text-[11px] text-slate-400 font-mono">
          Base {tariff.currency} {tariff.baseFare} + {tariff.currency} {tariff.ratePerKm}/KM
        </div>
      </div>

      {/* Grid of Key Telemetry Indicators */}
      <div className="grid grid-cols-3 gap-2 my-1">
        <div className="p-2.5 glass-card rounded-xl border border-white/5 flex flex-col items-center justify-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Distance</div>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-2xl font-black font-mono glow-green">{distanceKm.toFixed(2)}</span>
            <span className="text-[10px] font-bold text-emerald-400">KM</span>
          </div>
        </div>

        <div className="p-2.5 glass-card rounded-xl border border-white/5 flex flex-col items-center justify-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wait Time</div>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-2xl font-black font-mono glow-amber">{formatTime(waitingSeconds)}</span>
          </div>
        </div>

        <div className="p-2.5 glass-card rounded-xl border border-white/5 flex flex-col items-center justify-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Time</div>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-2xl font-black font-mono text-cyan-200">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Surcharges & Extras Toggle Bar */}
      <div className="flex items-center justify-between py-1.5 px-1 border-t border-b border-white/10 text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateTariff(t => ({ ...t, isNightTariff: !t.isNightTariff }))}
            className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1 transition-all border ${
              tariff.isNightTariff ? 'bg-purple-500/30 text-purple-200 border-purple-500/50' : 'glass-pill text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span>Night +20%</span>
          </button>

          <button
            onClick={() => onUpdateTariff(t => ({ ...t, isAcEnabled: !t.isAcEnabled }))}
            className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1 transition-all border ${
              tariff.isAcEnabled ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/50' : 'glass-pill text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>AC (+50)</span>
          </button>

          <button
            onClick={() => onUpdateTariff(t => ({ ...t, isLuggageEnabled: !t.isLuggageEnabled }))}
            className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1 transition-all border ${
              tariff.isLuggageEnabled ? 'bg-amber-500/30 text-amber-200 border-amber-500/50' : 'glass-pill text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Luggage className="w-3 h-3" />
            <span>Luggage (+100)</span>
          </button>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="pt-2 flex items-center justify-between space-x-2">
        {status === 'IDLE' && (
          <button
            onClick={onStart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>START RIDE NAVIGATION</span>
          </button>
        )}

        {status === 'RUNNING' && (
          <>
            <button
              onClick={onPause}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Pause className="w-5 h-5 fill-slate-950" />
              <span>PAUSE</span>
            </button>
            <button
              onClick={onFinish}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Square className="w-5 h-5 fill-white" />
              <span>END TRIP</span>
            </button>
          </>
        )}

        {status === 'PAUSED' && (
          <>
            <button
              onClick={onResume}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>RESUME</span>
            </button>
            <button
              onClick={onFinish}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Square className="w-5 h-5 fill-white" />
              <span>END TRIP</span>
            </button>
          </>
        )}

        {status === 'FINISHED' && (
          <>
            <button
              onClick={onOpenReceiptModal}
              className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Receipt className="w-5 h-5" />
              <span>VIEW RECEIPT</span>
            </button>
            <button
              onClick={onReset}
              className="py-3 px-4 rounded-xl glass-card text-slate-300 font-bold hover:text-white border border-white/10 transition-all flex items-center justify-center space-x-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
