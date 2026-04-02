import type { Metadata } from "next";
import { DM_Serif_Display, Figtree } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Home Design Studio",
  description:
    "Design beautiful floor plans, arrange furniture, and visualize your dream home in 2D and 3D.",
  icons: {
    icon: "/favicon.ico",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      lang="en"
      className={`dark ${dmSerifDisplay.variable} ${figtree.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased">
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
