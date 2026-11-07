import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const metadata: Metadata = {
  title: "UCme — UC Lost & Found Portal",
  applicationName: "UCme",
  appleWebApp: { capable: true, title: "UCme", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#21437D", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={sans.variable}><body className="font-sans">{children}<PwaRegister /></body></html>;
}
