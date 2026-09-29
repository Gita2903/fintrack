"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import {
  Transaction,
  TransactionType,
  CATEGORIES_CONFIG,
  PAYMENT_METHODS,
} from "@/types/finance";
import { formatRupiah } from "@/lib/storage";

interface ManualTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id" | "created_at">, editId?: string) => void;
  editingTransaction?: Transaction | null;
}

export function ManualTransactionModal({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
}: ManualTransactionModalProps) {
  const [type, setType] = useState<TransactionType>(
    editingTransaction ? editingTransaction.type : "expense"
  );
  const [amount, setAmount] = useState<string>(
    editingTransaction ? editingTransaction.amount.toString() : ""
  );
  const [category, setCategory] = useState<string>(
    editingTransaction ? editingTransaction.category : "Makanan & Minuman"
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    editingTransaction ? editingTransaction.payment_method : "GoPay"
  );
  const [date, setDate] = useState<string>(
    editingTransaction
      ? editingTransaction.date
      : new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  );
  const [description, setDescription] = useState<string>(
    editingTransaction ? editingTransaction.description : ""
  );

  const filteredCategories = CATEGORIES_CONFIG.filter((c) => c.type === type);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const firstCat = CATEGORIES_CONFIG.find((c) => c.type === newType);
    if (firstCat) {
      setCategory(firstCat.name);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert("Harap masukkan nominal yang valid.");
      return;
    }

    if (!description.trim()) {
      alert("Harap masukkan deskripsi atau catatan transaksi.");
      return;
    }

    onSave(
      {
        date,
        type,
        amount: numAmount,
        category,
        payment_method: paymentMethod,
        description: description.trim(),
      },
      editingTransaction?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-white text-base">
            {editingTransaction ? "Ubah Transaksi" : "Tambah Transaksi Manual"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${type === "expense"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Pengeluaran (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${type === "income"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Pemasukan (+)
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono">
                Rp
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            {amount && (
              <p className="text-[11px] text-slate-500 mt-1">
                Terbaca: {formatRupiah(Number(amount) || 0)}
              </p>
            )}
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {filteredCategories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.group})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Deskripsi / Catatan Transaksi
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Makan siang warteg + es teh..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all active:scale-95"
            >
              {editingTransaction ? "Simpan Perubahan" : "Tambahkan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
