import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandSize = "md" | "lg" | "xl";

type BrandLogoProps = {
  size: BrandSize;
  className?: string;
};

const SIZE_CLASSES = {
  md: { box: "size-9 rounded-md", icon: "size-5", text: "text-xl" },
  lg: { box: "size-10 rounded-lg", icon: "size-5", text: "text-2xl" },
  xl: { box: "size-12 rounded-lg", icon: "size-6", text: "text-3xl" },
} satisfies Record<BrandSize, { box: string; icon: string; text: string }>;

export const BrandLogo = ({ size, className }: BrandLogoProps) => {
  const classes = SIZE_CLASSES[size];
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("flex items-center justify-center bg-primary", classes.box)}>
        <Home className={cn("text-primary-foreground", classes.icon)} />
      </div>
      <span className={cn("font-heading text-foreground", classes.text)}>Home Design Studio</span>
    </Link>
  );
};
