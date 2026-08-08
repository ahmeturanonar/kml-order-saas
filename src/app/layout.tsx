import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ATO Elevation",
    template: "%s | ATO Elevation",
  },
  description: "KML dosyalarınızdan hassas yükseklik verileri alın.",
  applicationName: "ATO Elevation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 font-sans text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
