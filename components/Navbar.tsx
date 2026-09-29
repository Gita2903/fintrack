"use client";

import React from "react";
import { Sparkles, Plus, Download, RefreshCw, Bot, Shield } from "lucide-react";

interface NavbarProps {
  onOpenAdvisor: () => void;
  onOpenManualAdd: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
}

export function Navbar({
  onOpenAdvisor,
  onOpenManualAdd,
  onResetData,
  onExportCSV,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                FinTrack AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Bot className="w-3 h-3" />
                Asisten Keuangan Pribadi
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Pencatatan Otomatis • Kontrol Anggaran • Wawasan Finansial
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenAdvisor}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 transition-all active:scale-95"
            title="Buka Analisis dan Konsultasi FinTrack AI"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>FinTrack AI</span>
          </button>

          <button
            onClick={onOpenManualAdd}
            className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Catat Manual</span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <button
            onClick={onExportCSV}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onResetData}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
            title="Reset Data Demo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
