import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinTrack AI - Asisten Keuangan Pribadi',
  description:
    'Asisten Keuangan Pribadi cerdas untuk pencatatan transaksi otomatis via teks, suara & struk, pengkategorian cerdas, manajemen anggaran & peringatan, serta analisis finansial solutif.',
  openGraph: {
    title: 'FinTrack AI - Asisten Keuangan Pribadi',
    description:
      'Asisten Keuangan Pribadi cerdas untuk pencatatan transaksi otomatis via teks, suara & struk, pengkategorian cerdas, manajemen anggaran & peringatan, serta analisis finansial solutif.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinTrack AI - Asisten Keuangan Pribadi',
    description:
      'Asisten Keuangan Pribadi cerdas untuk pencatatan transaksi otomatis via teks, suara & struk, pengkategorian cerdas, manajemen anggaran & peringatan, serta analisis finansial solutif.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
