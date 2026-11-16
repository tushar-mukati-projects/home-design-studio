import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

type AiAvatarProps = {
  size: AvatarSize;
  className?: string;
};

type SizeClasses = {
  box: string;
  icon: string;
};

const SIZE_CLASSES: Record<AvatarSize, SizeClasses> = {
  sm: { box: "size-7 rounded-lg", icon: "size-3.5" },
  md: { box: "size-8 rounded-xl", icon: "size-4" },
  lg: { box: "size-14 rounded-2xl", icon: "size-7" },
};

export const AiAvatar = ({ size, className }: AiAvatarProps) => (
  <div
    className={cn(
      "flex shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-lg",
      SIZE_CLASSES[size].box,
      className,
    )}
  >
    <Sparkles className={SIZE_CLASSES[size].icon} />
  </div>
);
