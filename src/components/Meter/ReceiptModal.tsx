'use client';

import React from 'react';
import { TariffConfig } from '@/hooks/useTripMeter';
import { X, Receipt, CheckCircle, Navigation2, Clock } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[94vh] overflow-y-auto glass-panel rounded-2xl border border-cyan-500/30 p-3 sm:p-4 shadow-2xl my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">OFFICIAL RIDE RECEIPT</h2>
              <p className="text-[9px] text-slate-400 font-mono">{currentDate} • {currentTime}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 glass-card rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Responsive Body for Landscape Screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 overflow-y-auto">
          {/* Left Column: Hero Amount & Estimate Bar */}
          <div className="space-y-2 flex flex-col justify-between">
            {/* Hero Total Amount Paid */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 text-center flex flex-col items-center justify-center shadow-inner flex-1">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-cyan-300/80 mb-0.5">
                ACTUAL AMOUNT PAID
              </span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xs font-black text-cyan-400">{tariff.currency}</span>
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight glow-cyan">
                  {totalFare.toLocaleString('en-US')}
                </span>
                <span className="text-xs font-bold text-slate-400">.00</span>
              </div>
            </div>

            {/* Estimated Route vs Actual Real Ride Comparative Bar */}
            {estimatedDistanceKm > 0 && (
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[10px] space-y-1 font-mono">
                <div className="uppercase font-black text-cyan-300 flex items-center justify-between text-[9px]">
                  <span>📍 Route Estimate</span>
                  <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[8px]">OSRM</span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-cyan-500/20 text-[9px]">
                  <div>
                    <span className="text-[8px] text-slate-400 block">EST. DIST</span>
                    <span className="text-slate-200">{estimatedDistanceKm.toFixed(2)} KM</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block">EST. TIME</span>
                    <span className="text-slate-200">{estimatedDurationMins} M</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block">EST. FARE</span>
                    <span className="text-cyan-300">{tariff.currency} {estimatedFare}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Detailed Actual Metrics */}
          <div className="p-2.5 glass-card rounded-xl border border-white/10 space-y-1.5 text-xs font-mono flex flex-col justify-between">
            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-slate-400 flex items-center space-x-1">
                <Navigation2 className="w-3 h-3 text-emerald-400" />
                <span>Actual Distance</span>
              </span>
              <span className="font-extrabold text-emerald-400">{distanceKm.toFixed(2)} KM</span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Total Duration</span>
              </span>
              <span className="font-bold text-white">{formatTime(elapsedSeconds)}</span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Waiting Time</span>
              </span>
              <span className="font-bold text-amber-300">{formatTime(waitingSeconds)}</span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-slate-400">Base Fare</span>
              <span className="font-bold text-white">{tariff.currency} {tariff.baseFare}</span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400">Rate / KM</span>
              <span className="font-bold text-white">{tariff.currency} {tariff.ratePerKm}</span>
            </div>
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="pt-2 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 flex items-center justify-center space-x-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>CLOSE & START NEW RIDE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
