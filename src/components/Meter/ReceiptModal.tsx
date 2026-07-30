'use client';

import React, { useEffect } from 'react';
import { TariffConfig } from '@/hooks/useTripMeter';
import { X, CheckCircle, Share2, Printer, MapPin, Clock, Navigation, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptModalProps {
  isOpen: boolean;
  distanceKm: number;
  elapsedSeconds: number;
  waitingSeconds: number;
  totalFare: number;
  tariff: TariffConfig;
  onClose: () => void;
}

export default function ReceiptModal({
  isOpen,
  distanceKm,
  elapsedSeconds,
  waitingSeconds,
  totalFare,
  tariff,
  onClose,
}: ReceiptModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger celebrate confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore confetti error
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  // Distance charge portion calculation
  const distanceCharge = distanceKm > tariff.baseKmIncluded
    ? (distanceKm - tariff.baseKmIncluded) * tariff.ratePerKm
    : 0;

  // Waiting time charge portion calculation
  const waitMinutes = waitingSeconds / 60;
  const waitingCharge = waitMinutes * tariff.waitRatePerMin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-white/20 p-6 shadow-2xl relative overflow-hidden">
        {/* Glow Header Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center space-x-1.5">
                <span>RIDE RECEIPT</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p className="text-[11px] text-slate-400">Digital Trip Summary & Fare Breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-card text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Driver & Vehicle Tag Bar */}
        <div className="my-3 p-3 glass-card rounded-2xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xl">
              🛺
            </div>
            <div>
              <div className="text-xs font-bold text-white">Smart TukTuk Driver</div>
              <div className="text-[10px] text-slate-400 font-mono">ID: TK-9042 • Verified Meter</div>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono font-bold text-cyan-300">
            WP AB-8942
          </div>
        </div>

        {/* Trip Key Stats Grid */}
        <div className="grid grid-cols-3 gap-2 my-3 text-center">
          <div className="p-2.5 glass-card rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center space-x-1">
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span>Distance</span>
            </div>
            <div className="text-sm font-black font-mono text-cyan-200 mt-0.5">{distanceKm.toFixed(2)} KM</div>
          </div>

          <div className="p-2.5 glass-card rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center space-x-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Duration</span>
            </div>
            <div className="text-sm font-black font-mono text-emerald-200 mt-0.5">{formatTime(elapsedSeconds)}</div>
          </div>

          <div className="p-2.5 glass-card rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center space-x-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>Waiting</span>
            </div>
            <div className="text-sm font-black font-mono text-amber-200 mt-0.5">{formatTime(waitingSeconds)}</div>
          </div>
        </div>

        {/* Itemized Fare Breakdown List */}
        <div className="my-3 p-3 glass-card rounded-2xl space-y-2 text-xs font-mono">
          <div className="flex justify-between text-slate-300">
            <span>Base Fare (1st {tariff.baseKmIncluded} KM)</span>
            <span>{tariff.currency} {tariff.baseFare.toFixed(2)}</span>
          </div>

          {distanceCharge > 0 && (
            <div className="flex justify-between text-slate-300">
              <span>Distance Charge ({(distanceKm - tariff.baseKmIncluded).toFixed(2)} KM)</span>
              <span>{tariff.currency} {distanceCharge.toFixed(2)}</span>
            </div>
          )}

          {waitingCharge > 0 && (
            <div className="flex justify-between text-slate-300">
              <span>Waiting Time ({Math.round(waitMinutes)} mins)</span>
              <span>{tariff.currency} {waitingCharge.toFixed(2)}</span>
            </div>
          )}

          {tariff.isAcEnabled && (
            <div className="flex justify-between text-cyan-300">
              <span>AC TukTuk Surcharge</span>
              <span>+ {tariff.currency} {tariff.acSurcharge.toFixed(2)}</span>
            </div>
          )}

          {tariff.isLuggageEnabled && (
            <div className="flex justify-between text-amber-300">
              <span>Luggage Fee</span>
              <span>+ {tariff.currency} {tariff.luggageSurcharge.toFixed(2)}</span>
            </div>
          )}

          {tariff.isNightTariff && (
            <div className="flex justify-between text-purple-300">
              <span>Night Tariff (+20%)</span>
              <span>Applied (x{tariff.nightMultiplier})</span>
            </div>
          )}

          <div className="pt-2 border-t border-white/10 flex justify-between items-baseline font-sans">
            <span className="font-extrabold uppercase text-slate-200 text-xs">TOTAL AMOUNT</span>
            <div className="text-right">
              <span className="text-xs font-bold text-cyan-400 mr-1">{tariff.currency}</span>
              <span className="text-2xl font-black font-mono text-white glow-cyan">
                {totalFare.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="pt-2 flex items-center justify-between space-x-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 px-3 rounded-xl glass-card text-slate-300 font-bold text-xs flex items-center justify-center space-x-1.5 hover:text-white transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-all text-center"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}
