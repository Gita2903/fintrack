"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  CreditCard,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Transaction,
  TransactionType,
  CATEGORIES_CONFIG,
  PAYMENT_METHODS,
} from "@/types/finance";
import { formatRupiah, formatIndonesianDate } from "@/lib/storage";
import { CategoryIcon } from "./CategoryIcon";

interface TransactionLedgerProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onExportCSV: () => void;
}

export function TransactionLedger({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
  onExportCSV,
}: TransactionLedgerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "month" | "week" | "today"
  >("all");
  const [selectedType, setSelectedType] = useState<"all" | TransactionType>(
    "all"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const currentMonthStr = today.toISOString().slice(0, 7);

    // Calculate 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    return transactions
      .filter((tx) => {
        // Period filter
        if (selectedPeriod === "today" && tx.date !== todayStr) return false;
        if (selectedPeriod === "month" && !tx.date.startsWith(currentMonthStr))
          return false;
        if (selectedPeriod === "week" && tx.date < sevenDaysAgoStr) return false;

        // Type filter
        if (selectedType !== "all" && tx.type !== selectedType) return false;

        // Category filter
        if (selectedCategory !== "all" && tx.category !== selectedCategory)
          return false;

        // Payment method filter
        if (
          selectedPaymentMethod !== "all" &&
          tx.payment_method !== selectedPaymentMethod
        )
          return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = tx.description.toLowerCase().includes(q);
          const matchCat = tx.category.toLowerCase().includes(q);
          const matchPay = tx.payment_method.toLowerCase().includes(q);
          const matchAmount = tx.amount.toString().includes(q);
          if (!matchDesc && !matchCat && !matchPay && !matchAmount) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    selectedPeriod,
    selectedType,
    selectedCategory,
    selectedPaymentMethod,
    searchQuery,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Subtotals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-4 sm:p-6 backdrop-blur-sm my-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white">
              Rekap & Riwayat Transaksi
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tabel rekapitulasi rapi dengan filter periode harian, mingguan, atau
            bulanan.
          </p>
        </div>

        {/* Quick Period Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          {[
            { id: "all", label: "Semua" },
            { id: "month", label: "Bulan Ini" },
            { id: "week", label: "7 Hari Terakhir" },
            { id: "today", label: "Hari Ini" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedPeriod(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedPeriod === tab.id
                  ? "bg-slate-800 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-4">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari deskripsi, nominal, merchant..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value as any);
            setCurrentPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">Semua Tipe Transaksi</option>
          <option value="expense">Hanya Pengeluaran (-)</option>
          <option value="income">Hanya Pemasukan (+)</option>
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">Semua Kategori</option>
          {CATEGORIES_CONFIG.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.type === "income" ? "Masuk" : "Keluar"})
            </option>
          ))}
        </select>

        {/* Payment Method Filter */}
        <select
          value={selectedPaymentMethod}
          onChange={(e) => {
            setSelectedPaymentMethod(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="all">Semua Metode Pembayaran</option>
          {PAYMENT_METHODS.map((pm) => (
            <option key={pm} value={pm}>
              {pm}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            Ditemukan:{" "}
            <strong className="text-white">{filteredTransactions.length}</strong>{" "}
            transaksi
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Masuk:{" "}
            <strong className="text-emerald-400">{formatRupiah(totalIncome)}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Keluar:{" "}
            <strong className="text-rose-400">{formatRupiah(totalExpense)}</strong>
          </span>
        </div>

        <button
          onClick={onExportCSV}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5">Tanggal</th>
              <th className="py-3 px-3.5">Kategori</th>
              <th className="py-3 px-3.5">Deskripsi / Catatan</th>
              <th className="py-3 px-3.5">Metode Bayar</th>
              <th className="py-3 px-3.5 text-right">Nominal (Rp)</th>
              <th className="py-3 px-3.5 text-center w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Tidak ada transaksi yang cocok dengan filter atau kata kunci.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const catConfig = CATEGORIES_CONFIG.find(
                  (c) => c.name === tx.category
                );

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 px-3.5 text-slate-300 font-mono whitespace-nowrap">
                      {formatIndonesianDate(tx.date)}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          catConfig?.badgeBg ||
                          "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        <CategoryIcon
                          name={catConfig?.iconName || "Tag"}
                          className="w-3 h-3"
                        />
                        <span>{tx.category}</span>
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3.5 text-slate-200 max-w-xs truncate">
                      <span title={tx.description}>{tx.description}</span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50 text-[11px]">
                        {tx.payment_method}
                      </span>
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-3 px-3.5 text-right font-semibold whitespace-nowrap font-mono ${
                        tx.type === "income"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatRupiah(tx.amount)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="Ubah Transaksi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus transaksi "${tx.description}"?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
