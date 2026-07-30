'use client';

import React from 'react';
import { TariffConfig } from '@/hooks/useTripMeter';
import { X, Receipt, CheckCircle, Navigation2, Clock, Zap } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  distanceKm: number;
  elapsedSeconds: number;
  waitingSeconds: number;
  totalFare: number;
  tariff: TariffConfig;
  estimatedDistanceKm?: number;
  estimatedDurationMins?: number;
  estimatedFare?: number;
  onClose: () => void;
}

export default function ReceiptModal({
  isOpen,
  distanceKm,
  elapsedSeconds,
  waitingSeconds,
  totalFare,
  tariff,
  estimatedDistanceKm = 0,
  estimatedDurationMins = 0,
  estimatedFare = 0,
  onClose,
}: ReceiptModalProps) {
  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-cyan-500/30 p-5 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">OFFICIAL RIDE RECEIPT</h2>
              <p className="text-[10px] text-slate-400 font-mono">{currentDate} • {currentTime}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 glass-card rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Estimated Route vs Actual Real Ride Comparative Bar */}
        {estimatedDistanceKm > 0 && (
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs space-y-1.5 font-mono">
            <div className="text-[10px] uppercase font-black text-cyan-300 flex items-center justify-between">
              <span>📍 Route Estimate vs Actual Ride</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">OSRM ROUTING</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px] font-bold pt-1 border-t border-cyan-500/20">
              <div>
                <span className="text-[9px] text-slate-400 block">EST. DISTANCE</span>
                <span className="text-slate-200">{estimatedDistanceKm.toFixed(2)} KM</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">EST. TIME</span>
                <span className="text-slate-200">{estimatedDurationMins} Mins</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">EST. FARE</span>
                <span className="text-cyan-300">{tariff.currency} {estimatedFare}</span>
              </div>
            </div>
          </div>
        )}

        {/* Hero Total Amount Paid */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 text-center flex flex-col items-center shadow-inner">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300/80 mb-0.5">
            ACTUAL AMOUNT PAID
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-sm font-black text-cyan-400">{tariff.currency}</span>
            <span className="text-5xl font-black font-mono tracking-tight glow-cyan">
              {totalFare.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-bold text-slate-400">.00</span>
          </div>
        </div>

        {/* Detailed Actual Metrics List */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Navigation2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Actual Distance Traveled</span>
            </span>
            <span className="font-extrabold text-emerald-400 text-sm">{distanceKm.toFixed(2)} KM</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Total Duration</span>
            </span>
            <span className="font-bold text-white">{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Waiting Time</span>
            </span>
            <span className="font-bold text-amber-300">{formatTime(waitingSeconds)}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">Base Minimum Charge</span>
            <span className="font-bold text-white">{tariff.currency} {tariff.baseFare}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">Per Kilometer Rate</span>
            <span className="font-bold text-white">{tariff.currency} {tariff.ratePerKm}/KM</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 flex items-center justify-center space-x-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>CLOSE & START NEW RIDE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
