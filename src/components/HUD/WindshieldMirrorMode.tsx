'use client';

import React from 'react';
import { TripStatus } from '@/hooks/useTripMeter';
import { X, Eye } from 'lucide-react';

interface WindshieldMirrorModeProps {
  isOpen: boolean;
  status: TripStatus;
  distanceKm: number;
  waitingSeconds: number;
  currentSpeed: number;
  totalFare: number;
  currency: string;
  onClose: () => void;
}

export default function WindshieldMirrorMode({
  isOpen,
  status,
  distanceKm,
  waitingSeconds,
  currentSpeed,
  totalFare,
  currency,
  onClose,
}: WindshieldMirrorModeProps) {
  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 select-none cursor-pointer overflow-hidden"
    >
      {/* Windshield Reflection Horizontal Flip Class */}
      <div className="w-full h-full flex flex-col justify-between hud-mirror">
        {/* Top Header */}
        <div className="flex items-center justify-between opacity-70">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-sm font-bold">
            <Eye className="w-4 h-4" />
            <span>WINDSHIELD HUD MIRROR MODE</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">TAP ANYWHERE TO EXIT</div>
        </div>

        {/* Giant Speed & Fare Display */}
        <div className="flex flex-col items-center justify-center space-y-4 my-auto">
          {/* Main Giant Total Fare */}
          <div className="text-center">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-1">
              TOTAL FARE ({currency})
            </div>
            <div className="text-7xl lg:text-9xl font-black font-mono tracking-tight glow-cyan">
              {totalFare}
            </div>
          </div>

          {/* Speed & Distance Row */}
          <div className="flex items-center justify-center space-x-12 pt-6">
            <div className="text-center">
              <div className="text-xs font-mono text-emerald-400 font-bold">SPEED (KM/H)</div>
              <div className="text-5xl font-black font-mono glow-green mt-1">{currentSpeed}</div>
            </div>

            <div className="text-center">
              <div className="text-xs font-mono text-cyan-300 font-bold">DISTANCE (KM)</div>
              <div className="text-5xl font-black font-mono glow-cyan mt-1">{distanceKm.toFixed(2)}</div>
            </div>

            <div className="text-center">
              <div className="text-xs font-mono text-amber-400 font-bold">WAIT TIME</div>
              <div className="text-5xl font-black font-mono glow-amber mt-1">{formatTime(waitingSeconds)}</div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 opacity-60">
          <div>STATUS: {status}</div>
          <div>ANTIGRAVITY HUD ENGINE</div>
        </div>
      </div>
    </div>
  );
}
