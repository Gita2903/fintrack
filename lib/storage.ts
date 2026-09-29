import { Transaction, Budget } from "@/types/finance";

export const DEFAULT_BUDGETS: Budget[] = [
  { category: "Makanan & Minuman", monthly_limit: 2500000 },
  { category: "Tagihan & Utilitas", monthly_limit: 800000 },
  { category: "Transportasi", monthly_limit: 600000 },
  { category: "Belanja Bulanan", monthly_limit: 1500000 },
  { category: "Belanja/Shopping", monthly_limit: 800000 },
  { category: "Hiburan", monthly_limit: 500000 },
  { category: "Makan Luar", monthly_limit: 900000 },
  { category: "Sedekah/Donasi", monthly_limit: 500000 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-demo-1",
    date: "2026-09-25",
    type: "income",
    amount: 9500000,
    category: "Gaji",
    payment_method: "BCA",
    description: "Gaji Pokok & Tunjangan September 2026",
    created_at: "2026-09-25T08:00:00.000Z",
  },
  {
    id: "tx-demo-2",
    date: "2026-09-25",
    type: "income",
    amount: 1500000,
    category: "Freelance",
    payment_method: "GoPay",
    description: "Pembayaran project UI/UX landing page",
    created_at: "2026-09-25T14:30:00.000Z",
  },
  {
    id: "tx-demo-3",
    date: "2026-09-26",
    type: "expense",
    amount: 1250000,
    category: "Belanja Bulanan",
    payment_method: "BCA",
    description: "Belanja bulanan Superindo (beras, minyak, daging, sabun)",
    created_at: "2026-09-26T10:15:00.000Z",
  },
  {
    id: "tx-demo-4",
    date: "2026-09-26",
    type: "expense",
    amount: 450000,
    category: "Tagihan & Utilitas",
    payment_method: "BCA",
    description: "Token Listrik PLN & Tagihan PDAM",
    created_at: "2026-09-26T11:00:00.000Z",
  },
  {
    id: "tx-demo-5",
    date: "2026-09-26",
    type: "expense",
    amount: 320000,
    category: "Tagihan & Utilitas",
    payment_method: "GoPay",
    description: "Wifi Indihome bulanan",
    created_at: "2026-09-26T11:30:00.000Z",
  },
  {
    id: "tx-demo-6",
    date: "2026-09-27",
    type: "expense",
    amount: 100000,
    category: "Transportasi",
    payment_method: "ShopeePay",
    description: "Isi bensin Pertamax SPBU Pertamina",
    created_at: "2026-09-27T08:45:00.000Z",
  },
  {
    id: "tx-demo-7",
    date: "2026-09-27",
    type: "expense",
    amount: 45000,
    category: "Makanan & Minuman",
    payment_method: "GoPay",
    description: "Kopi susu (25k) & Nasi goreng (20k)",
    created_at: "2026-09-27T12:30:00.000Z",
  },
  {
    id: "tx-demo-8",
    date: "2026-09-27",
    type: "expense",
    amount: 2150000,
    category: "Makanan & Minuman",
    payment_method: "GoPay",
    description: "Akumulasi belanja makan & minum harian (catering + jajan)",
    created_at: "2026-09-27T19:00:00.000Z",
  },
  {
    id: "tx-demo-9",
    date: "2026-09-28",
    type: "expense",
    amount: 350000,
    category: "Hiburan",
    payment_method: "Dana",
    description: "Tiket bioskop XXI premiere & popcorn",
    created_at: "2026-09-28T15:20:00.000Z",
  },
  {
    id: "tx-demo-10",
    date: "2026-09-28",
    type: "expense",
    amount: 50000,
    category: "Transportasi",
    payment_method: "GoPay",
    description: "Beli bensin 50k",
    created_at: "2026-09-28T17:10:00.000Z",
  },
  {
    id: "tx-demo-11",
    date: "2026-09-28",
    type: "expense",
    amount: 200000,
    category: "Sedekah/Donasi",
    payment_method: "QRIS",
    description: "Sedekah Jumat berkah & panti asuhan",
    created_at: "2026-09-28T11:45:00.000Z",
  },
  {
    id: "tx-demo-12",
    date: "2026-09-28",
    type: "expense",
    amount: 2000000,
    category: "Tabungan",
    payment_method: "BCA",
    description: "Top-up Reksadana Pasar Uang & SBN Bibit",
    created_at: "2026-09-28T09:00:00.000Z",
  },
];

const STORAGE_KEY_TX = "fintrack_ai_transactions_v1";
const STORAGE_KEY_BUDGETS = "fintrack_ai_budgets_v1";

export function loadStoredTransactions(): Transaction[] {
  if (typeof window === "undefined") return INITIAL_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TX);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
  } catch (e) {
    console.error("Failed to save transactions to localStorage", e);
  }
}

export function loadStoredBudgets(): Budget[] {
  if (typeof window === "undefined") return DEFAULT_BUDGETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUDGETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
      return DEFAULT_BUDGETS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BUDGETS;
  }
}

export function saveStoredBudgets(budgets: Budget[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
  } catch (e) {
    console.error("Failed to save budgets to localStorage", e);
  }
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${amount}`;
}

export function formatIndonesianDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}
