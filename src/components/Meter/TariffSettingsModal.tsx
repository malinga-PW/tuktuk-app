'use client';

import React, { useState, useEffect } from 'react';
import { TariffConfig } from '@/hooks/useTripMeter';
import { X, Settings, Moon, Zap, Save, Check } from 'lucide-react';

interface TariffSettingsModalProps {
  isOpen: boolean;
  tariff: TariffConfig;
  onClose: () => void;
  onSave: (newTariff: TariffConfig) => void;
}

export default function TariffSettingsModal({
  isOpen,
  tariff,
  onClose,
  onSave,
}: TariffSettingsModalProps) {
  const [localTariff, setLocalTariff] = useState<TariffConfig>(tariff);

  useEffect(() => {
    setLocalTariff(tariff);
  }, [tariff]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localTariff);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[94vh] overflow-y-auto glass-panel rounded-2xl border border-cyan-500/30 p-3 sm:p-4 shadow-2xl my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">TARIFF RATES & FARE CONFIG</h2>
              <p className="text-[9px] text-slate-400 font-mono">Custom rates for Meter calculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 glass-card rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Grid Layout for Mobile Landscape */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 overflow-y-auto pr-1">
          {/* Base Minimum Fare */}
          <div className="p-2 glass-card rounded-xl border border-white/10 space-y-1">
            <label className="text-[9px] font-bold text-slate-300 uppercase block">Base Minimum Fare ({localTariff.currency})</label>
            <div className="flex items-center space-x-1.5">
              <input
                type="number"
                value={localTariff.baseFare}
                onChange={(e) => setLocalTariff({ ...localTariff, baseFare: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-slate-950/80 border border-white/15 px-2 py-1 rounded-lg text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <span className="text-[8px] text-slate-400">First {localTariff.baseKmIncluded} KM included</span>
          </div>

          {/* Rate Per KM */}
          <div className="p-2 glass-card rounded-xl border border-white/10 space-y-1">
            <label className="text-[9px] font-bold text-slate-300 uppercase block">Per KM Rate ({localTariff.currency})</label>
            <div className="flex items-center space-x-1.5">
              <input
                type="number"
                value={localTariff.ratePerKm}
                onChange={(e) => setLocalTariff({ ...localTariff, ratePerKm: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-slate-950/80 border border-white/15 px-2 py-1 rounded-lg text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <span className="text-[8px] text-slate-400">Rate charged after initial 1 KM</span>
          </div>

          {/* Waiting Rate */}
          <div className="p-2 glass-card rounded-xl border border-white/10 space-y-1">
            <label className="text-[9px] font-bold text-slate-300 uppercase block">Wait Rate Per Min ({localTariff.currency})</label>
            <div className="flex items-center space-x-1.5">
              <input
                type="number"
                value={localTariff.waitRatePerMin}
                onChange={(e) => setLocalTariff({ ...localTariff, waitRatePerMin: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-slate-950/80 border border-white/15 px-2 py-1 rounded-lg text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>
            <span className="text-[8px] text-slate-400">Traffic / Idle waiting time</span>
          </div>

          {/* Night Tariff Toggle */}
          <div className="p-2 glass-card rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <span className="text-[9px] font-bold text-white block">Night Tariff (+20%)</span>
                <span className="text-[8px] text-slate-400">10 PM - 5 AM Night rate</span>
              </div>
            </div>
            <button
              onClick={() => setLocalTariff({ ...localTariff, isNightTariff: !localTariff.isNightTariff })}
              className={`w-9 h-5 rounded-full transition-all relative ${localTariff.isNightTariff ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${localTariff.isNightTariff ? 'right-0.75' : 'left-0.75'}`}></span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-end space-x-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl glass-card text-slate-400 text-xs font-bold hover:text-white"
          >
            CANCEL
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase flex items-center space-x-1 shadow-lg shadow-amber-500/30"
          >
            <Check className="w-3.5 h-3.5" />
            <span>SAVE TARIFF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
