"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroQuickInput } from "@/components/HeroQuickInput";
import { FinancialHealthCards } from "@/components/FinancialHealthCards";
import { BudgetManager } from "@/components/BudgetManager";
import { VisualAnalytics } from "@/components/VisualAnalytics";
import { TransactionLedger } from "@/components/TransactionLedger";
import { AiAdvisorModal } from "@/components/AiAdvisorModal";
import { ManualTransactionModal } from "@/components/ManualTransactionModal";
import { Transaction } from "@/types/finance";
import { useTransactions, useBudgets } from "@/hooks/useFinanceData";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Calendar, ChevronDown, Loader2 } from "lucide-react";

export default function FinTrackApp() {
  const supabase = createClient();

  const {
    transactions,
    loading: txLoading,
    addTransaction: apiAddTransaction,
    updateTransaction: apiUpdateTransaction,
    deleteTransaction: apiDeleteTransaction,
  } = useTransactions();

  const { budgets, loading: budgetsLoading, saveBudgets } = useBudgets();

  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Active month filter (default: current month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [activeMonthStr, setActiveMonthStr] = useState<string>(currentMonth);

  // Modals state
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Get logged-in user info
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Add new transaction
  const handleAddTransaction = async (
    txData: Omit<Transaction, "id" | "created_at">
  ) => {
    try {
      await apiAddTransaction(txData);
      const txMonth = txData.date.slice(0, 7);
      if (txMonth !== activeMonthStr) {
        setActiveMonthStr(txMonth);
      }
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan transaksi.");
    }
  };

  // Edit/save transaction
  const handleSaveManual = async (
    txData: Omit<Transaction, "id" | "created_at">,
    editId?: string
  ) => {
    try {
      if (editId) {
        await apiUpdateTransaction(editId, txData);
      } else {
        await handleAddTransaction(txData);
      }
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan transaksi.");
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      await apiDeleteTransaction(id);
    } catch (e: any) {
      alert(e.message || "Gagal menghapus transaksi.");
    }
  };

  // Update budgets
  const updateBudgets = async (newBudgets: typeof budgets) => {
    try {
      await saveBudgets(newBudgets);
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan budget.");
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

  const isLoading = txLoading || budgetsLoading;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
        onOpenManualAdd={() => {
          setEditingTransaction(null);
          setIsManualModalOpen(true);
        }}
        onExportCSV={handleExportCSV}
        onSignOut={handleSignOut}
        userEmail={userEmail}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        {/* Loading skeleton */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-sm text-slate-400">Memuat data keuanganmu...</p>
          </div>
        ) : (
          <>
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

            {/* Budget Management */}
            <BudgetManager
              budgets={budgets}
              transactions={transactions}
              activeMonthStr={activeMonthStr}
              onUpdateBudgets={updateBudgets}
            />

            {/* Visual Analytics */}
            <VisualAnalytics
              transactions={transactions}
              activeMonthStr={activeMonthStr}
            />

            {/* Transaction Ledger */}
            <TransactionLedger
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsManualModalOpen(true);
              }}
              onExportCSV={handleExportCSV}
            />
          </>
        )}
      </main>

      {/* Floating FinTrack AI Advisor CTA */}
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
