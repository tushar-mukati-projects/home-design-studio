import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

type QueryErrorProps = {
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
  className?: string;
};

export const QueryError = ({ error, onRetry, retrying, className }: QueryErrorProps) => (
  <div
    className={cn(
      "flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-8 text-center",
      className,
    )}
  >
    <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
    <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
      <RefreshCw className={cn(retrying && "animate-spin")} />
      {retrying ? "Retrying…" : "Retry"}
    </Button>
  </div>
);
