import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SSP — Blocos de cimento em Nampula",
    template: "%s · SSP",
  },
  description:
    "Encomende blocos de cimento e pavê online, com entrega em Nampula, Nacala, Monapo, Angoche e Ilha de Moçambique. Pagamento por M-Pesa ou e-Mola.",
  openGraph: {
    title: "SSP — Blocos de cimento em Nampula",
    description: "Blocos de cimento e pavê com entrega na província de Nampula. Pague por M-Pesa ou e-Mola.",
    locale: "pt_MZ",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#006c4f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-MZ"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-on-surface">{children}</body>
    </html>
  );
}
