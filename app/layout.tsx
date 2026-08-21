import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

// Runs before paint to set the theme class from the saved choice / OS — no flash.
const NO_FLASH = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

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
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
          {/*
            Toasts must clear the navbar. It is `sticky top-0` and 65px tall
            (h-16 + border), while sonner defaults to 24px from the top — so a
            356px-wide toast landed on top of "My CVs / Jobs / Profile / Sign
            out" and, being z-index 999999999 with pointer-events:auto, ate
            every click on them. The 60-second idle warning made that a full
            minute of dead navigation. 76px puts the toast just below the bar.
          */}
          <Toaster
            richColors
            position="top-right"
            offset={{ top: 76, right: 16 }}
            mobileOffset={{ top: 72, right: 12 }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
