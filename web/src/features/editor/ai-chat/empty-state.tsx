import { AiAvatar } from "./ai-avatar";

type EmptyStateProps = {
  onSuggestion: (text: string) => void;
};

const SUGGESTIONS = [
  "Add a living room with sofa and TV",
  "Create a bedroom with a double bed",
  "Add a kitchen with island",
  "Build a 2-room apartment layout",
];

export const EmptyState = ({ onSuggestion }: EmptyStateProps) => (
  <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
    <AiAvatar size="lg" />
    <div>
      <p className="text-sm font-semibold text-foreground">Design AI</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Tell me what to build and I&apos;ll add walls, rooms, and furniture directly onto your plan.
      </p>
    </div>
    <div className="flex w-full flex-col gap-1.5">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSuggestion(s)}
          className="w-full rounded-xl border border-border px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-secondary"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);
