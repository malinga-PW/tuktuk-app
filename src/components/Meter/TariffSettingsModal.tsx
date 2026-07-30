'use client';

import React, { useState } from 'react';
import { TariffConfig } from '@/hooks/useTripMeter';
import { X, DollarSign, Save, RotateCcw, Check } from 'lucide-react';

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
  const [form, setForm] = useState<TariffConfig>(tariff);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const handleResetDefaults = () => {
    const defaults: TariffConfig = {
      currency: 'LKR',
      baseFare: 120,
      baseKmIncluded: 1.0,
      ratePerKm: 100,
      waitRatePerMin: 6,
      isNightTariff: false,
      nightMultiplier: 1.2,
      acSurcharge: 50,
      luggageSurcharge: 100,
      isAcEnabled: false,
      isLuggageEnabled: false,
    };
    setForm(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-white/15 p-6 shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Tariff Rate Settings</h2>
              <p className="text-xs text-slate-400">Configure base fares, per KM rates & wait time charges</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-card text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Currency Symbol
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-card border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="LKR" className="bg-slate-900">LKR (Rs)</option>
                <option value="USD" className="bg-slate-900">USD ($)</option>
                <option value="EUR" className="bg-slate-900">EUR (€)</option>
                <option value="INR" className="bg-slate-900">INR (₹)</option>
              </select>
            </div>

            {/* Base Fare */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Base Minimum Fare ({form.currency})
              </label>
              <input
                type="number"
                min="0"
                value={form.baseFare}
                onChange={(e) => setForm({ ...form, baseFare: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl glass-card border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Base Included Distance */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Base Included KM
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.baseKmIncluded}
                onChange={(e) => setForm({ ...form, baseKmIncluded: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl glass-card border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Rate Per KM */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Rate per Additional KM
              </label>
              <input
                type="number"
                min="0"
                value={form.ratePerKm}
                onChange={(e) => setForm({ ...form, ratePerKm: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl glass-card border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Wait Rate Per Min */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Wait Charge ({form.currency}/Min)
              </label>
              <input
                type="number"
                min="0"
                value={form.waitRatePerMin}
                onChange={(e) => setForm({ ...form, waitRatePerMin: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl glass-card border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Night Surcharge % */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Night Multiplier
              </label>
              <input
                type="number"
                step="0.05"
                min="1.0"
                value={form.nightMultiplier}
                onChange={(e) => setForm({ ...form, nightMultiplier: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl glass-card border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Sri Lankan City Presets
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, baseFare: 120, ratePerKm: 100, waitRatePerMin: 6 })}
                className="flex-1 py-1.5 px-3 rounded-xl glass-card border border-white/10 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
              >
                Colombo Meter
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, baseFare: 150, ratePerKm: 120, waitRatePerMin: 8 })}
                className="flex-1 py-1.5 px-3 rounded-xl glass-card border border-white/10 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
              >
                Kandy City
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, baseFare: 100, ratePerKm: 90, waitRatePerMin: 5 })}
                className="flex-1 py-1.5 px-3 rounded-xl glass-card border border-white/10 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
              >
                Galle Coastal
              </button>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 flex items-center justify-between space-x-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="py-2.5 px-4 rounded-xl glass-card text-slate-400 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl glass-card text-slate-300 hover:text-white text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Rates</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
