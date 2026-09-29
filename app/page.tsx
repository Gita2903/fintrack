"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroQuickInput } from "@/components/HeroQuickInput";
import { FinancialHealthCards } from "@/components/FinancialHealthCards";
import { BudgetManager } from "@/components/BudgetManager";
import { VisualAnalytics } from "@/components/VisualAnalytics";
import { TransactionLedger } from "@/components/TransactionLedger";
import { AiAdvisorModal } from "@/components/AiAdvisorModal";
import { ManualTransactionModal } from "@/components/ManualTransactionModal";
import { Transaction, Budget } from "@/types/finance";
import {
  loadStoredTransactions,
  saveStoredTransactions,
  loadStoredBudgets,
  saveStoredBudgets,
  INITIAL_TRANSACTIONS,
  DEFAULT_BUDGETS,
} from "@/lib/storage";
import { Sparkles, Calendar, ChevronDown } from "lucide-react";

export default function FinTrackApp() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadStoredTransactions()
  );
  const [budgets, setBudgets] = useState<Budget[]>(() => loadStoredBudgets());

  // Active month filter (e.g. "2026-09")
  const [activeMonthStr, setActiveMonthStr] = useState<string>("2026-09");

  // Modals state
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Save changes to localStorage and state
  const updateTransactions = (newTxList: Transaction[]) => {
    setTransactions(newTxList);
    saveStoredTransactions(newTxList);
  };

  const updateBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    saveStoredBudgets(newBudgets);
  };

  // Add new transaction (from AI ingestion or manual)
  const handleAddTransaction = (
    txData: Omit<Transaction, "id" | "created_at">
  ) => {
    const newTx: Transaction = {
      ...txData,
      id: "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };

    const updated = [newTx, ...transactions];
    updateTransactions(updated);

    // If transaction date belongs to another month, switch to it so user sees it immediately
    const txMonth = txData.date.slice(0, 7);
    if (txMonth !== activeMonthStr) {
      setActiveMonthStr(txMonth);
    }
  };

  // Edit existing transaction
  const handleSaveManual = (
    txData: Omit<Transaction, "id" | "created_at">,
    editId?: string
  ) => {
    if (editId) {
      const updated = transactions.map((t) =>
        t.id === editId
          ? {
              ...t,
              ...txData,
            }
          : t
      );
      updateTransactions(updated);
    } else {
      handleAddTransaction(txData);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    updateTransactions(updated);
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (
      confirm(
        "Kembalikan buku kas ke data contoh awal FinTrack AI? Data transaksi yang belum diekspor akan digantikan."
      )
    ) {
      updateTransactions(INITIAL_TRANSACTIONS);
      updateBudgets(DEFAULT_BUDGETS);
      setActiveMonthStr("2026-09");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("Belum ada data transaksi untuk diekspor.");
      return;
    }

    const headers = [
      "Tanggal",
      "Tipe",
      "Nominal (Rp)",
      "Kategori",
      "Metode Pembayaran",
      "Deskripsi / Catatan",
    ];

    const rows = transactions.map((t) => [
      `"${t.date}"`,
      `"${t.type === "income" ? "Pemasukan" : "Pengeluaran"}"`,
      t.amount,
      `"${t.category}"`,
      `"${t.payment_method}"`,
      `"${t.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `FinTrack_AI_Transactions_${activeMonthStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get list of distinct months present in transactions
  const availableMonths = Array.from(
    new Set(transactions.map((t) => t.date.slice(0, 7)))
  ).sort((a, b) => b.localeCompare(a));

  if (!availableMonths.includes(activeMonthStr)) {
    availableMonths.unshift(activeMonthStr);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
        onOpenManualAdd={() => {
          setEditingTransaction(null);
          setIsManualModalOpen(true);
        }}
        onResetData={handleResetData}
        onExportCSV={handleExportCSV}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        {/* Active Month Selector Banner */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Kondisi Finansial Aktif</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Pilih Periode Bulan:</span>
            <div className="relative inline-block">
              <select
                value={activeMonthStr}
                onChange={(e) => setActiveMonthStr(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-7 appearance-none cursor-pointer"
              >
                {availableMonths.map((m) => {
                  const [year, month] = m.split("-");
                  const dateObj = new Date(Number(year), Number(month) - 1, 1);
                  const label = dateObj.toLocaleDateString("id-ID", {
                    month: "long",
                    year: "numeric",
                  });
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Hero & Quick AI Ingestion Command Bar */}
        <HeroQuickInput
          onAddTransaction={handleAddTransaction}
          budgets={budgets}
          currentTransactions={transactions}
        />

        {/* Financial KPI Cards */}
        <FinancialHealthCards
          transactions={transactions}
          budgets={budgets}
          activeMonthStr={activeMonthStr}
        />

        {/* Budget Management & Friendly Alerts (Core Capability #3) */}
        <BudgetManager
          budgets={budgets}
          transactions={transactions}
          activeMonthStr={activeMonthStr}
          onUpdateBudgets={updateBudgets}
        />

        {/* Visual Analytics & Cashflow (Core Capability #4) */}
        <VisualAnalytics
          transactions={transactions}
          activeMonthStr={activeMonthStr}
        />

        {/* Transaction Ledger Table (Core Capability #4) */}
        <TransactionLedger
          transactions={transactions}
          onDeleteTransaction={handleDeleteTransaction}
          onEditTransaction={(tx) => {
            setEditingTransaction(tx);
            setIsManualModalOpen(true);
          }}
          onExportCSV={handleExportCSV}
        />
      </main>

      {/* Floating FinTrack AI Advisor CTA Button */}
      <button
        onClick={() => setIsAdvisorOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 group"
      >
        <Sparkles className="w-4 h-4 animate-spin group-hover:rotate-180 transition-transform" />
        <span>Konsultasi FinTrack AI</span>
      </button>

      {/* AI Advisor Modal */}
      <AiAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        transactions={transactions}
        budgets={budgets}
        activeMonthStr={activeMonthStr}
      />

      {/* Manual Add / Edit Modal */}
      <ManualTransactionModal
        key={editingTransaction ? editingTransaction.id : "new-tx"}
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveManual}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}
