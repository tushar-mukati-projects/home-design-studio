import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import { AuthProvider } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Home Design Studio", template: "%s · Home Design Studio" },
  description:
    "Design beautiful floor plans, arrange furniture, and visualize your dream home in 2D and 3D.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" className={cn(dmSans.variable, inter.variable)}>
    <body className="min-h-screen bg-background antialiased">
      <Providers>
        <AuthProvider>{children}</AuthProvider>
      </Providers>
    </body>
  </html>
);

export default RootLayout;
