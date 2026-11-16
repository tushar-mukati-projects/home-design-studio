import { Loader2 } from "lucide-react";
import { BrandLogo } from "./brand-logo";

type FullScreenLoaderProps = {
  label: string;
};

export const FullScreenLoader = ({ label }: FullScreenLoaderProps) => (
  <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background">
    <BrandLogo size="xl" />
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin text-primary" />
      {label}
    </div>
  </div>
);
