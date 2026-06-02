import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
});
const notoUrdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-noto-urdu",
});

export const metadata: Metadata = {
  title: "VoiceCV — Speak. We Write. You Succeed.",
  description:
    "AI-powered trilingual CV generator. Turn a 5-minute voice recording into a professional CV — free, in English, Arabic, or Urdu.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${notoArabic.variable} ${notoUrdu.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <LanguageProvider>{children}</LanguageProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
