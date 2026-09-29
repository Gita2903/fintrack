"use client";

import React from "react";
import {
  PieChart,
  BarChart3,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Percent,
} from "lucide-react";
import { Transaction, CATEGORIES_CONFIG } from "@/types/finance";
import { formatRupiah, formatShortRupiah } from "@/lib/storage";
import { CategoryIcon } from "./CategoryIcon";

interface VisualAnalyticsProps {
  transactions: Transaction[];
  activeMonthStr: string;
}

export function VisualAnalytics({
  transactions,
  activeMonthStr,
}: VisualAnalyticsProps) {
  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(activeMonthStr)
  );

  const expenses = monthTransactions.filter((t) => t.type === "expense");
  const incomes = monthTransactions.filter((t) => t.type === "income");

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);

  // Group expenses by category
  const expenseByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseByCategory)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      config: CATEGORIES_CONFIG.find((c) => c.name === cat),
    }))
    .sort((a, b) => b.amount - a.amount);

  // Group by payment method
  const byPaymentMethod = monthTransactions.reduce((acc, t) => {
    acc[t.payment_method] = (acc[t.payment_method] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedPaymentMethods = Object.entries(byPaymentMethod)
    .map(([method, amount]) => ({
      method,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Daily average calculation
  const now = new Date();
  const daysInCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const currentDay = Math.min(now.getDate(), daysInCurrentMonth);
  const avgDailyExpense =
    currentDay > 0 ? Math.round(totalExpense / currentDay) : 0;

  // Largest expense
  const maxExpense = expenses.reduce(
    (max, t) => (t.amount > (max?.amount || 0) ? t : max),
    null as Transaction | null
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-6">
      {/* Category Expense Breakdown */}
      <div className="lg:col-span-2 bg-slate-900/70 rounded-2xl border border-slate-800 p-4 sm:p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              Distribusi Pengeluaran per Kategori
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Total: {formatRupiah(totalExpense)}
          </span>
        </div>

        {sortedCategories.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Belum ada pengeluaran yang dicatat bulan ini.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {sortedCategories.slice(0, 6).map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: item.config?.color || "#10b981",
                      }}
                    />
                    <span className="font-medium text-slate-200">
                      {item.category}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      ({item.config?.group || "Lainnya"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {formatRupiah(item.amount)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.config?.color || "#10b981",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Financial Snapshot & Payment Methods */}
      <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-4 sm:p-5 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-white text-base">
              Sorotan Arus Kas
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {/* Average Daily */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">
                Rata-rata Pengeluaran Harian
              </span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {formatRupiah(avgDailyExpense)}
                <span className="text-xs font-normal text-slate-500"> / hari</span>
              </span>
            </div>

            {/* Biggest Expense */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">
                Pengeluaran Terbesar
              </span>
              <span className="text-base font-bold text-rose-400 mt-0.5 block truncate">
                {maxExpense ? formatRupiah(maxExpense.amount) : "Rp 0"}
              </span>
              <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                {maxExpense?.description || "-"}
              </span>
            </div>

            {/* Top Payment Methods */}
            <div className="pt-2">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                <span>Metode Pembayaran Paling Sering:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sortedPaymentMethods.map((pm) => (
                  <span
                    key={pm.method}
                    className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                  >
                    {pm.method}:{" "}
                    <strong className="text-emerald-400 font-mono">
                      {formatShortRupiah(pm.amount)}
                    </strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
