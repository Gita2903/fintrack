"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Bot,
  X,
  TrendingDown,
  Lightbulb,
  Send,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Heart,
} from "lucide-react";
import {
  Transaction,
  Budget,
  FinancialHealthReport,
} from "@/types/finance";
import { formatRupiah } from "@/lib/storage";

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  budgets: Budget[];
  activeMonthStr: string;
}

export function AiAdvisorModal({
  isOpen,
  onClose,
  transactions,
  budgets,
  activeMonthStr,
}: AiAdvisorModalProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "chat">("analysis");
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [report, setReport] = useState<FinancialHealthReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  // Chat tab state
  const [messages, setMessages] = useState<
    Array<{ sender: "user" | "ai"; text: string; time: string }>
  >([
    {
      sender: "ai",
      text: "Halo! Saya FinTrack AI, Asisten Keuangan Pribadimu. Ada yang ingin kamu diskusikan tentang pos pengeluaran, tips hemat, atau rencana belanja kamu?",
      time: "Sekarang",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Prepare current financial summary payload
  const prepareSummary = useCallback(() => {
    const monthTx = transactions.filter((t) =>
      t.date.startsWith(activeMonthStr)
    );
    const totalIncome = monthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = monthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const netSavings = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // Spending by category
    const catMap = monthTx
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({ category: cat, amount }));

    // Overbudget categories
    const overbudgetCategories = budgets
      .filter((b) => (catMap[b.category] || 0) >= b.monthly_limit * 0.85)
      .map(
        (b) =>
          `${b.category} (${Math.round(
            ((catMap[b.category] || 0) / b.monthly_limit) * 100
          )}%)`
      );

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      topCategories,
      overbudgetCategories,
    };
  }, [transactions, budgets, activeMonthStr]);

  // Run comprehensive analysis
  const fetchAnalysis = useCallback(async () => {
    setIsLoadingAnalysis(true);
    try {
      const summary = prepareSummary();
      const sampleTx = transactions.slice(-15);

      const res = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          transactionsSample: sampleTx,
          budgets,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil analisis FinTrack AI.");
      }

      const data = await res.json();
      setReport(data);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Gagal memproses analisis.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [prepareSummary, transactions, budgets]);

  // Run analysis automatically when opened first time if no report
  useEffect(() => {
    if (isOpen && !report) {
      fetchAnalysis();
    }
  }, [isOpen, report, fetchAnalysis]);

  // Send interactive chat question
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = chatInput.trim();
    if (!query || isChatLoading) return;

    const userMsg = {
      sender: "user" as const,
      text: query,
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const summary = prepareSummary();
      const sampleTx = transactions.slice(-15);

      const res = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          transactionsSample: sampleTx,
          budgets,
          userQuestion: query,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal mengirim pertanyaan ke AI.");
      }

      const data = await res.json();
      const aiMsg = {
        sender: "ai" as const,
        text: data.reply || "Maaf, FinTrack AI tidak dapat merespon saat ini.",
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Maaf, terjadi kendala koneksi ke FinTrack AI: " + err.message,
          time: "Barusan",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full h-[90vh] max-h-[750px] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  FinTrack AI Financial Advisor
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  Proaktif & Solutif
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diagnosis Kesehatan Finansial & Konsultasi Cerdas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalysis}
              disabled={isLoadingAnalysis}
              className="p-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Perbarui Analisis Data Terkini"
            >
              {isLoadingAnalysis ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs px-4">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === "analysis"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
          >
            Diagnosis Finansial & Tips Hemat
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "chat"
              ? "border-teal-500 text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tanya FinTrack AI</span>
          </button>
        </div>

        {/* Tab 1: Analysis Content */}
        {activeTab === "analysis" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {isLoadingAnalysis ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                <p className="text-sm font-medium text-white">
                  FinTrack AI sedang menganalisis buku kas Anda...
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Mendeteksi pola pengeluaran terbesar, mengevaluasi budget, dan
                  mencari celah kebocoran halus (latte factor).
                </p>
              </div>
            ) : report ? (
              <>
                {/* Health Status Banner */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${report.healthStatus === "SEHAT"
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                    : report.healthStatus === "WASPADA" ||
                      report.healthStatus === "PERLU PERHATIAN"
                      ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                      : "bg-rose-950/30 border-rose-500/40 text-rose-200"
                    }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-current">
                        Kondisi: {report.healthStatus}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                      {report.statusHeadline}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {report.budgetEvaluation}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-3 self-end sm:self-center bg-slate-950/70 px-4 py-2.5 rounded-xl border border-slate-800">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">
                        Skor Finansial
                      </div>
                      <div className="text-2xl font-black text-white">
                        {report.score}
                        <span className="text-xs text-slate-500 font-normal">
                          /100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spending Pattern Summary */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold mb-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span>Pola Pengeluaran Terbesar</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {report.spendingPatternSummary}
                  </p>
                </div>

                {/* Leakage Detection (Kebocoran Halus / Latte Factor) */}
                {report.leakageDetection && report.leakageDetection.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-white mb-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Deteksi Kebocoran Halus (Latte Factor)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {report.leakageDetection.map((leak, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
                        >
                          <div className="font-semibold text-amber-300">
                            {leak.item}
                          </div>
                          <div className="text-slate-400 mt-1">
                            {leak.impact}
                          </div>
                          <div className="text-slate-300 font-medium mt-1.5 pt-1.5 border-t border-slate-800/60 text-[11px]">
                            💡 <span className="text-emerald-400">Saran:</span>{" "}
                            {leak.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 Savings Recommendations with Potential Rp */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-2.5">
                    <Lightbulb className="w-4 h-4 text-emerald-400" />
                    <span>3 Rekomendasi Penghematan Realistis</span>
                  </div>
                  <div className="space-y-2.5">
                    {report.savingsRecommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">
                              {idx + 1}
                            </span>
                            <span>{rec.title}</span>
                          </div>
                          <p className="text-slate-300 pl-7">{rec.action}</p>
                        </div>
                        {rec.potentialSavingRp > 0 && (
                          <div className="shrink-0 text-right">
                            <span className="text-[10px] text-slate-500 block">
                              Potensi Hemat
                            </span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              +{formatRupiah(rec.potentialSavingRp)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Motivational Closing */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/20 text-xs flex items-center gap-3">
                  <Heart className="w-4 h-4 text-pink-400 shrink-0" />
                  <p className="text-slate-300 italic">
                    &ldquo;{report.motivationalQuote}&rdquo;
                  </p>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Tidak ada data analisis. Klik tombol perbarui untuk memulai.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Interactive Chat Content */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"
                    }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-md"
                      }`}
                  >
                    {m.sender === "ai" && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-1">
                        <Bot className="w-3.5 h-3.5" />
                        <span>FinTrack AI</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line">{m.text}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {m.time}
                  </span>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 w-fit">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>FinTrack AI sedang mengetik...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendChat}
              className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanyakan apa saja tentang keuanganmu (misal: 'Amankah beli HP 4jt sekarang?')..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-semibold transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
