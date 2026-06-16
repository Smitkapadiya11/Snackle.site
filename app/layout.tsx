import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { SiteBackground } from "@/components/layout/SiteBackground";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Snackle — Your Inventory. Predicted.",
  description:
    "Inventory intelligence powered by Snackle 1.0. Upload your data, answer 12 questions, and know exactly what to stock, clear, and watch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="snackle min-h-full flex flex-col">
        <SiteBackground />
        <ToastProvider>
          <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
