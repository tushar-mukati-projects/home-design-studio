import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Editor", href: "/dashboard" },
];

export const LandingFooter = () => (
  <footer className="relative border-t border-border bg-card px-4 py-16 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <BrandLogo size="md" className="inline-flex" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The modern floor plan editor for homeowners, interior designers, and architects. Design
            in 2D, experience in 3D.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-widest text-foreground uppercase">Product</p>
          <ul className="mt-4 space-y-3">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Home Design Studio. All rights reserved.</p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-2xs font-medium">
            Built with Next.js, Three.js &amp; AI
          </span>
          <span className="text-muted-foreground">
            Built with precision <span className="text-foreground">&bull;</span> Designed with care
          </span>
        </div>
      </div>
    </div>
  </footer>
);
