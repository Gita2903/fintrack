import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

const MODEL_CHAIN = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRetryable = (e: unknown) => {
  const s = (e as { status?: number })?.status;
  return s === 503 || s === 429 || s === 500;
};

async function generateWithFallback(
  params: Omit<Parameters<typeof ai.models.generateContent>[0], "model">
) {
  let lastErr: unknown;
  for (const model of MODEL_CHAIN) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({ ...params, model });
      } catch (e) {
        lastErr = e;
        if (!isRetryable(e)) throw e; // 400/401/403 jangan diulang
        await sleep(600 * (attempt + 1));
      }
    }
  }
  throw lastErr;
}

export async function POST(req: NextRequest) {
  try {
    const {
      summary,
      transactionsSample,
      budgets,
      userQuestion,
      chatHistory = [],
    } = await req.json();

    const systemInstruction = `Anda adalah FinTrack AI, Asisten Keuangan Pribadi yang cerdas, teliti, proaktif, dan solutif.
Kepribadian Anda:
- Ramah, empatik, praktis, dan suportif layaknya financial planner profesional yang paham gaya hidup dan kultur keuangan Indonesia (misal: jajan boba/kopi kekinian, biaya admin transfer, promo e-wallet, belanja online tanggal kembar, dana darurat, sedekah).
- Menggunakan bahasa Indonesia yang luwes, santun, dan mudah dipahami (tidak kaku seperti textbook perbankan).
- Selalu memberikan analisis berdasarkan data riil yang diberikan (pemasukan, pengeluaran, perbandingan terhadap budget, pola kategori terbesar).
- Selalu menyertakan 3 rekomendasi penghematan konkret yang realistis.`;

    const dataContext = `
DATA KEUANGAN PENGGUNA SAAT INI:
- Total Pemasukan: Rp ${(summary?.totalIncome || 0).toLocaleString("id-ID")}
- Total Pengeluaran: Rp ${(summary?.totalExpense || 0).toLocaleString("id-ID")}
- Saldo Bersih: Rp ${(summary?.netSavings || 0).toLocaleString("id-ID")}
- Rasio Tabungan: ${summary?.savingsRate || 0}%
- Status Anggaran (Overbudget Alerts): ${summary?.overbudgetCategories && summary.overbudgetCategories.length > 0
        ? summary.overbudgetCategories.join(", ")
        : "Tidak ada overbudget"
      }
- Kategori Pengeluaran Terbesar: ${JSON.stringify(summary?.topCategories || [])}
- Target Anggaran Kategori: ${JSON.stringify(budgets || [])}
- Contoh Transaksi Terkini: ${JSON.stringify(transactionsSample || [])}
`;

    // If it's a specific question or conversation
    if (userQuestion) {
      const chatPrompt = `${dataContext}
Pertanyaan/Konsultasi Pengguna:
"${userQuestion}"

Jawab pertanyaan pengguna dengan teliti, solutif, dan ramah. Gunakan data keuangan di atas untuk memberikan pertimbangan yang akurat (apakah keuangan pengguna saat ini sehat, aman untuk belanja tersebut, atau perlu penyesuaian). Berikan langkah konkret.`;

      const response = await generateWithFallback({
        contents: chatPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return NextResponse.json({
        reply: response.text,
      });
    }

    // Default: Full Structured Financial Health & Insights Report
    const prompt = `${dataContext}
Tolong buatkan analisis menyeluruh atas kondisi keuangan pengguna:
1. Status Kesehatan Keuangan (Sehat, Waspada, atau Kritis) dengan skor 0-100 dan alasan singkat.
2. Analisis Pola Pengeluaran: Identifikasi pos pengeluaran terbesar dan deteksi kemungkinan "kebocoran halus" (misal: jajan harian, biaya langganan, makan luar berlebih).
3. Evaluasi Anggaran & Warning: Berikan ulasan apakah pengguna disiplin budget atau mendekati batas limit.
4. 3 Saran Penghematan Realistis & Aksi Nyata: Rekomendasi yang langsung bisa dipraktekkan pengguna minggu ini dengan estimasi potensi penghematan dalam Rupiah.
5. Rekap Ringkasan Singkat (1 kalimat penyemangat proaktif).`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthStatus: {
              type: Type.STRING,
              description: "SEHAT | WASPADA | PERLU PERHATIAN | KRITIS",
            },
            score: {
              type: Type.NUMBER,
              description: "Skor kesehatan finansial 0 - 100",
            },
            statusHeadline: {
              type: Type.STRING,
              description: "Judul kondisi keuangan dalam 1 kalimat",
            },
            spendingPatternSummary: {
              type: Type.STRING,
              description: "Ulasan pola pengeluaran terbesar",
            },
            leakageDetection: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ["item", "impact", "recommendation"],
              },
            },
            budgetEvaluation: {
              type: Type.STRING,
              description: "Evaluasi terhadap target budget yang ditetapkan",
            },
            savingsRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  action: { type: Type.STRING },
                  potentialSavingRp: { type: Type.NUMBER },
                },
                required: ["title", "action", "potentialSavingRp"],
              },
            },
            motivationalQuote: {
              type: Type.STRING,
              description: "Pesan hangat dan motivasi dari FinTrack AI",
            },
          },
          required: [
            "healthStatus",
            "score",
            "statusHeadline",
            "spendingPatternSummary",
            "leakageDetection",
            "budgetEvaluation",
            "savingsRecommendations",
            "motivationalQuote",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error generating advisor report:", err);
    const status = (error as { status?: number })?.status;
    return NextResponse.json(
      { error: "Gagal membuat analisis finansial.", details: err?.message || "Unknown error" },
      { status: status === 503 || status === 429 ? status : 500 }
    );
  }
}
