export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number;
  category: string;
  payment_method: string;
  description: string;
  created_at: string;
}

export interface Budget {
  category: string;
  monthly_limit: number;
}

export interface CategoryMeta {
  name: string;
  group: "Pemasukan" | "Kebutuhan Pokok" | "Gaya Hidup" | "Finansial" | "Sosial";
  type: TransactionType;
  color: string;
  badgeBg: string;
  iconName: string;
}

export const CATEGORIES_CONFIG: CategoryMeta[] = [
  // Pemasukan
  {
    name: "Gaji",
    group: "Pemasukan",
    type: "income",
    color: "#10b981",
    badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    iconName: "Briefcase",
  },
  {
    name: "Bonus",
    group: "Pemasukan",
    type: "income",
    color: "#059669",
    badgeBg: "bg-emerald-600/15 text-emerald-300 border-emerald-600/30",
    iconName: "Gift",
  },
  {
    name: "Freelance",
    group: "Pemasukan",
    type: "income",
    color: "#14b8a6",
    badgeBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    iconName: "Laptop",
  },
  {
    name: "Investasi",
    group: "Pemasukan",
    type: "income",
    color: "#06b6d4",
    badgeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    iconName: "TrendingUp",
  },
  {
    name: "Lain-lain",
    group: "Pemasukan",
    type: "income",
    color: "#64748b",
    badgeBg: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    iconName: "PlusCircle",
  },

  // Pengeluaran - Kebutuhan Pokok
  {
    name: "Makanan & Minuman",
    group: "Kebutuhan Pokok",
    type: "expense",
    color: "#f59e0b",
    badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    iconName: "Utensils",
  },
  {
    name: "Tagihan & Utilitas",
    group: "Kebutuhan Pokok",
    type: "expense",
    color: "#ef4444",
    badgeBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    iconName: "Receipt",
  },
  {
    name: "Transportasi",
    group: "Kebutuhan Pokok",
    type: "expense",
    color: "#3b82f6",
    badgeBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    iconName: "Car",
  },
  {
    name: "Belanja Bulanan",
    group: "Kebutuhan Pokok",
    type: "expense",
    color: "#8b5cf6",
    badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    iconName: "ShoppingCart",
  },

  // Pengeluaran - Gaya Hidup
  {
    name: "Hiburan",
    group: "Gaya Hidup",
    type: "expense",
    color: "#ec4899",
    badgeBg: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    iconName: "Film",
  },
  {
    name: "Belanja/Shopping",
    group: "Gaya Hidup",
    type: "expense",
    color: "#d946ef",
    badgeBg: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
    iconName: "ShoppingBag",
  },
  {
    name: "Hobi",
    group: "Gaya Hidup",
    type: "expense",
    color: "#a855f7",
    badgeBg: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    iconName: "Gamepad2",
  },
  {
    name: "Makan Luar",
    group: "Gaya Hidup",
    type: "expense",
    color: "#f97316",
    badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    iconName: "Coffee",
  },

  // Pengeluaran - Finansial
  {
    name: "Tabungan",
    group: "Finansial",
    type: "expense",
    color: "#10b981",
    badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    iconName: "PiggyBank",
  },
  {
    name: "Cicilan/Hutang",
    group: "Finansial",
    type: "expense",
    color: "#e11d48",
    badgeBg: "bg-red-500/15 text-red-400 border-red-500/30",
    iconName: "CreditCard",
  },
  {
    name: "Asuransi",
    group: "Finansial",
    type: "expense",
    color: "#0284c7",
    badgeBg: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    iconName: "ShieldCheck",
  },

  // Pengeluaran - Sosial
  {
    name: "Sedekah/Donasi",
    group: "Sosial",
    type: "expense",
    color: "#14b8a6",
    badgeBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    iconName: "HeartHandshake",
  },
  {
    name: "Hadiah",
    group: "Sosial",
    type: "expense",
    color: "#f43f5e",
    badgeBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    iconName: "Package",
  },
  {
    name: "Kondangan",
    group: "Sosial",
    type: "expense",
    color: "#eab308",
    badgeBg: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    iconName: "Sparkles",
  },
];

export const PAYMENT_METHODS = [
  "GoPay",
  "OVO",
  "Dana",
  "ShopeePay",
  "QRIS",
  "BCA",
  "Mandiri",
  "BRI",
  "BNI",
  "Jenius",
  "Tunai / Cash",
  "Kartu Kredit",
  "Transfer Bank Lain",
];

export interface FinancialHealthReport {
  healthStatus: "SEHAT" | "WASPADA" | "PERLU PERHATIAN" | "KRITIS";
  score: number;
  statusHeadline: string;
  spendingPatternSummary: string;
  leakageDetection: Array<{
    item: string;
    impact: string;
    recommendation: string;
  }>;
  budgetEvaluation: string;
  savingsRecommendations: Array<{
    title: string;
    action: string;
    potentialSavingRp: number;
  }>;
  motivationalQuote: string;
}
