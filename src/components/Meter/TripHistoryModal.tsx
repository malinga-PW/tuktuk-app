'use client';

import React from 'react';
import { X, Clock, Navigation2, Trash2 } from 'lucide-react';

export interface SavedTripRecord {
  id: string;
  date: string;
  time: string;
  distanceKm: number;
  durationSec: number;
  totalFare: number;
  currency: string;
}

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedTripRecord[];
  onClearHistory: () => void;
}

export default function TripHistoryModal({
  isOpen,
  onClose,
  history,
  onClearHistory,
}: TripHistoryModalProps) {
  if (!isOpen) return null;

  const totalEarnings = history.reduce((sum, item) => sum + item.totalFare, 0);
  const totalKm = history.reduce((sum, item) => sum + item.distanceKm, 0);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[94vh] overflow-y-auto glass-panel rounded-2xl border border-cyan-500/30 p-3 sm:p-4 shadow-2xl my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              📜
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">Trip History & Daily Summary</h2>
              <p className="text-[9px] text-slate-400 font-mono">Saved ride receipts & total daily earnings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 glass-card rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daily Summary Cards Bar */}
        <div className="grid grid-cols-3 gap-1.5 my-2 shrink-0">
          <div className="p-2 glass-card rounded-xl border border-emerald-500/30 flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase">Total Rides</span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-0.5">{history.length}</span>
          </div>

          <div className="p-2 glass-card rounded-xl border border-cyan-500/30 flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase">Total Revenue</span>
            <span className="text-lg font-black font-mono text-cyan-300 mt-0.5">Rs. {totalEarnings.toLocaleString()}</span>
          </div>

          <div className="p-2 glass-card rounded-xl border border-amber-500/30 flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase">Total KM</span>
            <span className="text-lg font-black font-mono text-amber-400 mt-0.5">{totalKm.toFixed(1)} KM</span>
          </div>
        </div>

        {/* History List Container */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 my-1 max-h-[48vh]">
          {history.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">
              No completed trips recorded yet. Complete a ride to save receipt here!
            </div>
          ) : (
            history.map((trip, idx) => (
              <div
                key={trip.id || idx}
                className="p-2.5 glass-card rounded-xl border border-white/10 flex items-center justify-between hover:border-cyan-500/30 transition-all text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-bold text-white">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[9px]">
                      #{history.length - idx}
                    </span>
                    <span>{trip.date} at {trip.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Navigation2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{trip.distanceKm.toFixed(2)} KM</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{formatTime(trip.durationSec)}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] text-slate-400 font-mono">Total Fare</div>
                  <div className="text-sm font-black text-cyan-300 font-mono">
                    {trip.currency} {trip.totalFare.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between shrink-0">
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center space-x-1 hover:bg-rose-500/30"
            >
              <Trash2 className="w-3 h-3" />
              <span>CLEAR HISTORY</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs uppercase"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
