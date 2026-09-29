"use client";

import React from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Transaction, Budget } from "@/types/finance";
import { formatRupiah, formatShortRupiah } from "@/lib/storage";

interface FinancialHealthCardsProps {
  transactions: Transaction[];
  budgets: Budget[];
  activeMonthStr: string; // e.g. "2026-09"
}

export function FinancialHealthCards({
  transactions,
  budgets,
  activeMonthStr,
}: FinancialHealthCardsProps) {
  // Filter for active month
  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(activeMonthStr)
  );

  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const totalBudgetUsedPercent =
    totalBudgetLimit > 0
      ? Math.round((totalExpense / totalBudgetLimit) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
      {/* Saldo Bersih / Cashflow */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-slate-400">
            Saldo Bersih (Bulan Ini)
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              netSavings >= 0
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              netSavings >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatRupiah(netSavings)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            {netSavings >= 0 ? (
              <span className="inline-flex items-center text-emerald-400 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                Surplus {savingsRate}%
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-400 font-medium">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                Defisit
              </span>
            )}
            <span>dari total pemasukan</span>
          </div>
        </div>
      </div>

      {/* Total Pemasukan */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-slate-400">
            Total Pemasukan
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {formatRupiah(totalIncome)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-teal-400 font-medium">
              {monthTransactions.filter((t) => t.type === "income").length} transaksi
            </span>
            <span>masuk bulan ini</span>
          </div>
        </div>
      </div>

      {/* Total Pengeluaran */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-slate-400">
            Total Pengeluaran
          </span>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {formatRupiah(totalExpense)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-rose-400 font-medium">
              {monthTransactions.filter((t) => t.type === "expense").length} transaksi
            </span>
            <span>pengeluaran</span>
          </div>
        </div>
      </div>

      {/* Kontrol Budget */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-slate-400">
            Realisasi Anggaran
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              totalBudgetUsedPercent >= 100
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : totalBudgetUsedPercent >= 85
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            }`}
          >
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-baseline gap-2">
            <span>{totalBudgetUsedPercent}%</span>
            <span className="text-xs font-normal text-slate-400">
              terpakai
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalBudgetUsedPercent >= 100
                  ? "bg-rose-500"
                  : totalBudgetUsedPercent >= 85
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(totalBudgetUsedPercent, 100)}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Limit: {formatShortRupiah(totalBudgetLimit)}</span>
            <span>Sisa: {formatShortRupiah(Math.max(0, totalBudgetLimit - totalExpense))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
