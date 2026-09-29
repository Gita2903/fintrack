"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Code,
  Loader2,
  ArrowRight,
  Info,
  X,
  CreditCard,
  Calendar,
  Tag,
  DollarSign,
  FileText,
} from "lucide-react";
import {
  Transaction,
  Budget,
  CATEGORIES_CONFIG,
  PAYMENT_METHODS,
  TransactionType,
} from "@/types/finance";
import { formatRupiah, formatIndonesianDate } from "@/lib/storage";
import { CategoryIcon } from "./CategoryIcon";

interface HeroQuickInputProps {
  onAddTransaction: (tx: Omit<Transaction, "id" | "created_at">) => void;
  budgets: Budget[];
  currentTransactions: Transaction[];
}

export function HeroQuickInput({
  onAddTransaction,
  budgets,
  currentTransactions,
}: HeroQuickInputProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Parsed result preview state
  const [parsedResult, setParsedResult] = useState<{
    transaction: {
      date: string;
      type: TransactionType;
      amount: number;
      category: string;
      payment_method: string;
      description: string;
    };
    additional_transactions?: Array<{
      date: string;
      type: TransactionType;
      amount: number;
      category: string;
      payment_method: string;
      description: string;
    }>;
    explanation?: string;
    rawJson?: any;
  } | null>(null);

  const [showJsonModal, setShowJsonModal] = useState(false);
  const [receiptScanning, setReceiptScanning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const EXAMPLE_CHIPS = [
    "Beli kopi susu 25rb sama nasi goreng 20rb pake GoPay",
    "Gaji masuk 8.500.000",
    "Beli bensin 50k",
    "Bayar token listrik PLN 150rb via BCA",
    "Makan siang padang 35rb tunai",
  ];

  // Submit text to Gemini Parse API
  const handleParseText = async (textToParse: string) => {
    const query = textToParse.trim();
    if (!query) return;

    setIsLoading(true);
    setRecordingError(null);

    try {
      const todayJakarta = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });

      const res = await fetch("/api/gemini/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: query,
          currentDate: todayJakarta,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal memproses dengan FinTrack AI.");
      }

      const data = await res.json();
      if (data && data.transaction) {
        setParsedResult({
          transaction: data.transaction,
          additional_transactions: data.additional_transactions,
          explanation: data.explanation,
          rawJson: data,
        });
      } else {
        throw new Error("Format respon tidak sesuai.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat memproses transaksi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recording handler using Web Speech Recognition (with graceful fallback)
  const toggleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      clearInterval(timerRef.current);
      return;
    }

    // Start recording
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecordingError(
        "Browser Anda belum mendukung Web Speech Recognition. Silakan ketik langsung teks transaksi."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID"; // Indonesian speech model
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingSeconds(0);
        setRecordingError(null);
        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleParseText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event);
        setRecordingError(
          event.error === "not-allowed"
            ? "Izin mikrofon ditolak. Izinkan mikrofon di browser."
            : "Suara tidak terdeteksi. Silakan coba lagi atau gunakan teks."
        );
        setIsRecording(false);
        clearInterval(timerRef.current);
      };

      recognition.onend = () => {
        setIsRecording(false);
        clearInterval(timerRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setRecordingError("Tidak dapat mengakses mikrofon: " + e.message);
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Receipt image upload handler
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap unggah file gambar (JPG, PNG, WEBP).");
      return;
    }

    setReceiptScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        try {
          const res = await fetch("/api/gemini/scan-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type,
              currentDate: new Date().toLocaleDateString("en-CA", {
                timeZone: "Asia/Jakarta",
              }),
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Gagal menganalisis struk.");
          }

          const data = await res.json();
          if (data && data.transaction) {
            setParsedResult({
              transaction: data.transaction,
              explanation: `Berhasil mendeteksi struk dari ${
                data.merchant || "Merchant"
              } senilai ${formatRupiah(data.transaction.amount)}.`,
              rawJson: data,
            });
          }
        } catch (err: any) {
          alert(err.message || "Gagal memproses struk belanja.");
        } finally {
          setReceiptScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert("Gagal membaca file: " + err.message);
      setReceiptScanning(false);
    }
  };

  // Confirm and save parsed transaction to ledger
  const handleConfirmSave = () => {
    if (!parsedResult) return;

    // Save primary transaction
    onAddTransaction(parsedResult.transaction);

    // If there are additional transactions detected (e.g. multi-activity prompt)
    if (
      parsedResult.additional_transactions &&
      parsedResult.additional_transactions.length > 0
    ) {
      parsedResult.additional_transactions.forEach((tx) => {
        onAddTransaction(tx);
      });
    }

    setParsedResult(null);
    setInputText("");
  };

  // Calculate budget impact warning for current previewed transaction
  const getBudgetWarning = () => {
    if (!parsedResult || parsedResult.transaction.type !== "expense") return null;

    const txCategory = parsedResult.transaction.category;
    const categoryBudget = budgets.find((b) => b.category === txCategory);

    if (!categoryBudget) return null;

    // Calculate current spending for this category in current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existingSpent = currentTransactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category === txCategory &&
          t.date.startsWith(currentMonth)
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const projectedTotal = existingSpent + parsedResult.transaction.amount;
    const projectedPercentage = Math.round(
      (projectedTotal / categoryBudget.monthly_limit) * 100
    );

    if (projectedPercentage >= 100) {
      return {
        level: "critical",
        message: `🚨 Overbudget! Pengeluaran ini membuat kategori "${txCategory}" mencapai ${projectedPercentage}% dari batas budget (${formatRupiah(
          projectedTotal
        )} / ${formatRupiah(categoryBudget.monthly_limit)})!`,
      };
    } else if (projectedPercentage >= 85) {
      return {
        level: "warning",
        message: `⚠️ Udah ${projectedPercentage}% dari budget ${txCategory} bulan ini nih! Tetap hemat ya! (${formatRupiah(
          projectedTotal
        )} / ${formatRupiah(categoryBudget.monthly_limit)})`,
      };
    }

    return {
      level: "safe",
      message: `✅ Budget "${txCategory}" aman (${projectedPercentage}% terpakai: ${formatRupiah(
        projectedTotal
      )} / ${formatRupiah(categoryBudget.monthly_limit)}).`,
    };
  };

  const budgetWarning = getBudgetWarning();

  return (
    <section className="relative overflow-hidden pt-6 pb-4">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4">
        {/* Title & Proactive Assistant Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pencatatan Keuangan Berbasis AI Generatif</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Catat Pengeluaran & Pemasukan{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Cukup Ketik, Bicara, atau Foto Struk
            </span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            FinTrack AI secara otomatis mengekstrak nominal, tanggal, kategori,
            metode bayar, serta memberikan peringatan anggaran secara proaktif.
          </p>
        </div>

        {/* AI Ingestion Command Box */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-3 sm:p-4 backdrop-blur-xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleParseText(inputText);
                }
              }}
              placeholder="Contoh: Beli kopi susu 25rb sama nasi goreng 20rb pake GoPay..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-3.5 pl-4 pr-32 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
              disabled={isLoading || receiptScanning}
            />

            <div className="absolute right-2 flex items-center gap-1 sm:gap-1.5">
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleVoiceRecording}
                disabled={isLoading || receiptScanning}
                className={`p-2.5 rounded-lg transition-all ${
                  isRecording
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500 animate-pulse"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
                title={
                  isRecording
                    ? `Merekam (${recordingSeconds}s)... Klik untuk berhenti`
                    : "Bicara untuk Mencatat (Voice Input)"
                }
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4 text-rose-400" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Receipt OCR Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || receiptScanning}
                className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
                title="Scan / Upload Foto Struk Belanja"
              >
                {receiptScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReceiptUpload}
              />

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => handleParseText(inputText)}
                disabled={!inputText.trim() || isLoading || receiptScanning}
                className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-semibold transition-all shadow-md active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Voice status banner */}
          {isRecording && (
            <div className="mt-2.5 flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Mendengarkan suara Anda ({recordingSeconds}s)... Ucapkan transaksi
                Anda dengan jelas.
              </span>
              <button
                onClick={toggleVoiceRecording}
                className="font-medium underline hover:text-white"
              >
                Selesai
              </button>
            </div>
          )}

          {/* Recording error alert */}
          {recordingError && (
            <div className="mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{recordingError}</span>
            </div>
          )}

          {/* Quick Example Indonesian Chips */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-400 scrollbar-none">
            <span className="shrink-0 text-slate-500 font-medium">Contoh:</span>
            {EXAMPLE_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(chip);
                  handleParseText(chip);
                }}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/50 text-slate-300 transition-all text-[11px]"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* AI PARSED CONFIRMATION CARD (Live Ingestion Feedback) */}
        {parsedResult && (
          <div className="mt-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border-2 border-emerald-500/40 p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    Hasil Ekstraksi FinTrack AI
                  </h3>
                  <p className="text-xs text-slate-400">
                    {parsedResult.explanation ||
                      "Data transaksi terdeteksi dan siap disimpan ke buku kas."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJsonModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  title="Lihat Format JSON Backend"
                >
                  <Code className="w-3.5 h-3.5 text-teal-400" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => setParsedResult(null)}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Structured Fields Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {/* Nominal */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nominal</span>
                </div>
                <div
                  className={`text-base sm:text-lg font-bold ${
                    parsedResult.transaction.type === "income"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {parsedResult.transaction.type === "income" ? "+" : "-"}
                  {formatRupiah(parsedResult.transaction.amount)}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">
                  {parsedResult.transaction.type === "income"
                    ? "Pemasukan"
                    : "Pengeluaran"}
                </div>
              </div>

              {/* Kategori */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kategori</span>
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  {parsedResult.transaction.category}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Otomatis terklasifikasi
                </div>
              </div>

              {/* Tanggal */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tanggal</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {formatIndonesianDate(parsedResult.transaction.date)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {parsedResult.transaction.date}
                </div>
              </div>

              {/* Metode Bayar */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  <span>Metode Bayar</span>
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  {parsedResult.transaction.payment_method}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Tersimpan di log
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2">
              <FileText className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-200">
                <span className="text-slate-400 font-medium">Catatan: </span>
                {parsedResult.transaction.description}
              </div>
            </div>

            {/* Additional transactions if any */}
            {parsedResult.additional_transactions &&
              parsedResult.additional_transactions.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">
                    + Terdeteksi {parsedResult.additional_transactions.length}{" "}
                    transaksi tambahan yang juga akan dicatat:
                  </span>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside text-slate-300">
                    {parsedResult.additional_transactions.map((t, i) => (
                      <li key={i}>
                        {t.description} — {formatRupiah(t.amount)} ({t.category})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Budget Impact Warning Alert (Core Capability #3) */}
            {budgetWarning && (
              <div
                className={`mt-3.5 p-3 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm ${
                  budgetWarning.level === "critical"
                    ? "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                    : budgetWarning.level === "warning"
                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                }`}
              >
                {budgetWarning.level === "critical" ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                ) : budgetWarning.level === "warning" ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{budgetWarning.message}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setParsedResult(null)}
                className="px-4 py-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan ke Catatan Keuangan</span>
              </button>
            </div>
          </div>
        )}

        {/* JSON Schema Modal for Developer/Prompt Requirement verification */}
        {showJsonModal && parsedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm">
                    Backend JSON Output (Sesuai Spesifikasi)
                  </h3>
                </div>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Data JSON terstruktur yang dihasilkan di balik layar untuk disimpan
                ke database sistem:
              </p>
              <pre className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono text-emerald-300 overflow-x-auto max-h-72">
                {JSON.stringify(
                  {
                    status: "success",
                    transaction: parsedResult.transaction,
                    ...(parsedResult.additional_transactions?.length
                      ? {
                          additional_transactions:
                            parsedResult.additional_transactions,
                        }
                      : {}),
                  },
                  null,
                  2
                )}
              </pre>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
