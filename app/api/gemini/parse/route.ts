import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { input, currentDate } = await req.json();

    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json(
        { error: "Teks transaksi tidak boleh kosong." },
        { status: 400 }
      );
    }

    const todayStr =
      currentDate ||
      new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      }); // Format: YYYY-MM-DD

    const prompt = `Anda adalah FinTrack AI, Asisten Keuangan Pribadi Indonesia.
Tugas Anda adalah mengekstrak transaksi keuangan dari teks berikut secara akurat.

Tanggal hari ini (default jika tidak disebutkan): "${todayStr}"
Teks input pengguna:
"${input}"

Aturan Ekstraksi:
1. Pahami bahasa Indonesia sehari-hari, gaul, dan singkatan:
   - "25rb", "25k" = 25000
   - "8.5jt", "8,5 juta", "8.500.000" = 8500000
   - "goceng" = 5000, "ceban" = 10000, "gocap" = 50000, "seceng" = 1000, "pekgo" = 150000
   - "kemarin" = tanggal hari ini minus 1 hari
   - "lusa" / "2 hari lalu" = sesuaikan tanggalnya
   - jika tidak disebut tanggal, gunakan "${todayStr}"

2. Kategori Wajib (Pilih salah satu yang paling cocok):
   Pemasukan:
   - "Gaji"
   - "Bonus"
   - "Freelance"
   - "Investasi"
   - "Lain-lain"
   Pengeluaran:
   - "Makanan & Minuman"
   - "Tagihan & Utilitas"
   - "Transportasi"
   - "Belanja Bulanan"
   - "Hiburan"
   - "Belanja/Shopping"
   - "Hobi"
   - "Makan Luar"
   - "Tabungan"
   - "Cicilan/Hutang"
   - "Asuransi"
   - "Sedekah/Donasi"
   - "Hadiah"
   - "Kondangan"

3. Metode Pembayaran:
   Deteksi jika ada penyebutan e-wallet atau bank (GoPay, OVO, Dana, ShopeePay, QRIS, BCA, Mandiri, BRI, BNI, CIMB Niaga, Jenius, Kartu Kredit, Tunai / Cash). Jika tidak disebutkan, gunakan "Tunai / Cash".

4. Tipe Transaksi: "expense" untuk pengeluaran, atau "income" untuk pemasukan.

5. Jika pengguna menyebutkan beberapa item belanja dalam satu aktivitas (seperti: "Beli kopi susu 25rb sama nasi goreng 20rb pake GoPay"), jumlahkan nominalnya (misal: 45000), buat deskripsi rincian seperti "Kopi susu (25k) & Nasi goreng (20k)".
Jika pengguna mencatat 2 aktivitas terpisah (misal: "Gaji masuk 8jt, trus bayar kos 1.5jt"), masukkan transaksi kedua ke dalam daftar "additional_transactions".

Kembalikan respon JSON persis sesuai schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            transaction: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "Format YYYY-MM-DD" },
                type: {
                  type: Type.STRING,
                  description: "expense atau income",
                },
                amount: {
                  type: Type.NUMBER,
                  description: "Nominal dalam Rupiah integer positif",
                },
                category: {
                  type: Type.STRING,
                  description: "Kategori standar yang ditentukan",
                },
                payment_method: {
                  type: Type.STRING,
                  description: "Metode pembayaran",
                },
                description: {
                  type: Type.STRING,
                  description: "Deskripsi/catatan transaksi",
                },
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
            additional_transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  type: { type: Type.STRING },
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
            },
            explanation: {
              type: Type.STRING,
              description: "Penjelasan ringkas ramah dalam bahasa Indonesia",
            },
          },
          required: ["status", "transaction", "explanation"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Tidak ada respon dari AI.");
    }

    const parsedData = JSON.parse(text);
    return NextResponse.json(parsedData);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in parse transaction API:", err);
    return NextResponse.json(
      {
        error: "Gagal memproses transaksi.",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
