"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Plus,
  Edit2,
  X,
  TrendingUp,
  Percent,
} from "lucide-react";
import {
  Budget,
  Transaction,
  CATEGORIES_CONFIG,
} from "@/types/finance";
import { formatRupiah, formatShortRupiah } from "@/lib/storage";
import { CategoryIcon } from "./CategoryIcon";

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  activeMonthStr: string;
  onUpdateBudgets: (newBudgets: Budget[]) => void;
}

export function BudgetManager({
  budgets,
  transactions,
  activeMonthStr,
  onUpdateBudgets,
}: BudgetManagerProps) {
  const [editingBudget, setEditingBudget] = useState<{
    category: string;
    monthly_limit: number;
    isNew?: boolean;
  } | null>(null);

  // Calculate spent per category for active month
  const monthlyExpenses = transactions.filter(
    (t) => t.type === "expense" && t.date.startsWith(activeMonthStr)
  );

  const spentByCategory = monthlyExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Compute status for each budget
  const budgetStatuses = budgets.map((b) => {
    const spent = spentByCategory[b.category] || 0;
    const percent = b.monthly_limit > 0 ? Math.round((spent / b.monthly_limit) * 100) : 0;
    const remaining = Math.max(0, b.monthly_limit - spent);
    const overspent = Math.max(0, spent - b.monthly_limit);

    let status: "safe" | "warning" | "critical" = "safe";
    let alertMessage = "";

    if (percent >= 100) {
      status = "critical";
      alertMessage = `🚨 Overbudget! Pengeluaran telah melebihi batas sebesar ${formatRupiah(
        overspent
      )}`;
    } else if (percent >= 85) {
      status = "warning";
      alertMessage = `⚠️ Udah ${percent}% dari budget ${b.category.toLowerCase()} bulan ini nih! Tetap hemat ya!`;
    }

    const config = CATEGORIES_CONFIG.find((c) => c.name === b.category);

    return {
      ...b,
      spent,
      percent,
      remaining,
      overspent,
      status,
      alertMessage,
      config,
    };
  });

  // Extract active warnings (>= 85%)
  const activeAlerts = budgetStatuses.filter((b) => b.percent >= 85);

  // Available categories for new budgets
  const existingCategories = budgets.map((b) => b.category);
  const availableExpenseCategories = CATEGORIES_CONFIG.filter(
    (c) => c.type === "expense" && !existingCategories.includes(c.name)
  );

  const handleSaveBudgetModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    if (editingBudget.monthly_limit <= 0) {
      alert("Batas anggaran harus lebih dari 0.");
      return;
    }

    if (editingBudget.isNew) {
      onUpdateBudgets([
        ...budgets,
        {
          category: editingBudget.category,
          monthly_limit: editingBudget.monthly_limit,
        },
      ]);
    } else {
      const updated = budgets.map((b) =>
        b.category === editingBudget.category
          ? { ...b, monthly_limit: editingBudget.monthly_limit }
          : b
      );
      onUpdateBudgets(updated);
    }

    setEditingBudget(null);
  };

  const handleDeleteBudget = (catName: string) => {
    if (confirm(`Hapus batas anggaran untuk "${catName}"?`)) {
      onUpdateBudgets(budgets.filter((b) => b.category !== catName));
    }
  };

  return (
    <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-4 sm:p-6 backdrop-blur-sm my-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Manajemen Anggaran & Peringatan Pintar
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Lacak limit bulanan per kategori dan dapatkan warning proaktif saat
            mendekati atau melewati 85%.
          </p>
        </div>

        {availableExpenseCategories.length > 0 && (
          <button
            onClick={() =>
              setEditingBudget({
                category: availableExpenseCategories[0].name,
                monthly_limit: 500000,
                isNew: true,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Target Budget</span>
          </button>
        )}
      </div>

      {/* Proactive Active Alerts Section (Core Capability #3) */}
      {activeAlerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {activeAlerts.map((alert) => (
            <div
              key={alert.category}
              className={`p-3.5 rounded-xl border flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm ${
                alert.status === "critical"
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-200"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-200"
              }`}
            >
              <div className="flex items-start sm:items-center gap-2.5">
                {alert.status === "critical" ? (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                )}
                <div>
                  <span className="font-semibold">{alert.alertMessage}</span>
                  <div className="text-xs text-slate-300/80 mt-0.5">
                    Terpakai: {formatRupiah(alert.spent)} dari limit{" "}
                    {formatRupiah(alert.monthly_limit)} ({alert.percent}%)
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  setEditingBudget({
                    category: alert.category,
                    monthly_limit: alert.monthly_limit,
                  })
                }
                className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-white font-medium"
              >
                Ubah Limit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
        {budgetStatuses.map((item) => (
          <div
            key={item.category}
            className={`p-4 rounded-xl border transition-all ${
              item.status === "critical"
                ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50"
                : item.status === "warning"
                ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            {/* Category title & icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: `${item.config?.color || "#10b981"}20`,
                    color: item.config?.color || "#10b981",
                  }}
                >
                  <CategoryIcon
                    name={item.config?.iconName || "Tag"}
                    className="w-4 h-4"
                  />
                </div>
                <span className="text-sm font-semibold text-white truncate max-w-[130px]">
                  {item.category}
                </span>
              </div>
              <button
                onClick={() =>
                  setEditingBudget({
                    category: item.category,
                    monthly_limit: item.monthly_limit,
                  })
                }
                className="p-1 text-slate-400 hover:text-slate-200"
                title="Edit Limit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Spent vs Limit */}
            <div className="mt-3 flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Terpakai</span>
              <span className="font-semibold text-white">
                {formatRupiah(item.spent)}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs mt-0.5">
              <span className="text-slate-500">Batas Anggaran</span>
              <span className="text-slate-400">
                {formatRupiah(item.monthly_limit)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  item.percent >= 100
                    ? "bg-rose-500"
                    : item.percent >= 85
                    ? "bg-amber-500"
                    : item.percent >= 70
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(item.percent, 100)}%` }}
              />
            </div>

            {/* Bottom percentage & remaining */}
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span
                className={`font-semibold ${
                  item.percent >= 100
                    ? "text-rose-400"
                    : item.percent >= 85
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {item.percent}%
              </span>
              <span className="text-slate-500">
                {item.percent >= 100
                  ? `Lebih ${formatShortRupiah(item.overspent)}`
                  : `Sisa ${formatShortRupiah(item.remaining)}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-white text-sm">
                {editingBudget.isNew ? "Atur Anggaran Baru" : `Ubah Anggaran: ${editingBudget.category}`}
              </h3>
              <button
                onClick={() => setEditingBudget(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudgetModal} className="mt-4 space-y-4">
              {editingBudget.isNew && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Pilih Kategori
                  </label>
                  <select
                    value={editingBudget.category}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {availableExpenseCategories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.group})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Batas Anggaran Bulanan (Rp)
                </label>
                <input
                  type="number"
                  min="10000"
                  step="50000"
                  value={editingBudget.monthly_limit}
                  onChange={(e) =>
                    setEditingBudget({
                      ...editingBudget,
                      monthly_limit: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="2500000"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Format: {formatRupiah(editingBudget.monthly_limit || 0)}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {!editingBudget.isNew ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteBudget(editingBudget.category)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Hapus Anggaran
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBudget(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
