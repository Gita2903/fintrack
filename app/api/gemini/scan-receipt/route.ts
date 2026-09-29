import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

const MODEL_CHAIN = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"];
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
        if (!isRetryable(e)) throw e;
        await sleep(800 * (attempt + 1));
      }
    }
  }
  throw lastErr;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = "image/jpeg", currentDate } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Gambar struk tidak ditemukan." },
        { status: 400 }
      );
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

    const todayStr =
      currentDate ||
      new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });

    const promptText = `Anda adalah FinTrack AI. Analisis gambar struk/resi belanja ini dengan teliti.
Ekstrak data transaksi:
- Nama Merchant / Toko (contoh: Indomaret, Alfamart, Starbucks, Kopi Kenangan, SPBU Pertamina, Restoran, Apotek, dll.)
- Tanggal transaksi (format YYYY-MM-DD). Jika tidak terbaca, gunakan default "${todayStr}".
- Total nominal belanja dalam Rupiah (integer positif, contoh: 78500).
- Metode pembayaran jika ada (BCA, QRIS, GoPay, Tunai / Cash, Mandiri, Visa, dll.). Default "Tunai / Cash".
- Kategori yang paling sesuai:
  - "Makanan & Minuman"
  - "Belanja Bulanan"
  - "Transportasi"
  - "Makan Luar"
  - "Belanja/Shopping"
  - "Tagihan & Utilitas"
  - "Hobi"
  - "Lain-lain"
- Rincian item utama untuk deskripsi (contoh: "Alfamart: Susu UHT, Roti Tawar, Kopi Botol")

Kembalikan respon JSON.`;

    const response = await generateWithFallback({
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            merchant: { type: Type.STRING },
            transaction: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                type: { type: Type.STRING, description: "expense" },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING },
                payment_method: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: [
                "date",
                "type",
                "amount",
                "category",
                "payment_method",
                "description",
              ],
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  qty: { type: Type.NUMBER },
                },
                required: ["name", "price"],
              },
            },
            notes: { type: Type.STRING },
          },
          required: ["status", "transaction"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gagal membaca struk.");
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error scanning receipt:", err);
    const status = (error as { status?: number })?.status;
    return NextResponse.json(
      { error: "Gagal menganalisis struk belanja.", details: err?.message || "Unknown error" },
      { status: status === 503 || status === 429 ? status : 500 }
    );
  }
}
