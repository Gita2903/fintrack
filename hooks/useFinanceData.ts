"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction, Budget } from "@/types/finance";
import { DEFAULT_BUDGETS } from "@/lib/storage";

// ─── Transactions ───────────────────────────────────────────

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Gagal memuat transaksi.");
      const data = await res.json();
      setTransactions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(
    async (txData: Omit<Transaction, "id" | "created_at">) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Gagal menyimpan transaksi.");
      }
      const newTx: Transaction = await res.json();
      setTransactions((prev) => [newTx, ...prev]);
      return newTx;
    },
    []
  );

  const updateTransaction = useCallback(
    async (id: string, txData: Omit<Transaction, "id" | "created_at">) => {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...txData }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Gagal mengupdate transaksi.");
      }
      const updated: Transaction = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Gagal menghapus transaksi.");
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

// ─── Budgets ────────────────────────────────────────────────

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/budgets");
      if (!res.ok) throw new Error("Gagal memuat budget.");
      const data = await res.json();
      setBudgets(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const saveBudgets = useCallback(async (newBudgets: Budget[]) => {
    setBudgets(newBudgets); // optimistic update
    const res = await fetch("/api/budgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBudgets),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Gagal menyimpan budget.");
    }
  }, []);

  return { budgets, loading, error, saveBudgets };
}
