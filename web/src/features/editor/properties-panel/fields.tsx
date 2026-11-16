"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { M_PER_MM, metres } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Vec2 } from "@/shared/canvas";

const POINT_STEP_M = 0.01;
const METRES_DIGITS = 2;

type SectionProps = {
  title: string;
  children: ReactNode;
};

type FieldLabelProps = {
  children: ReactNode;
};

type RowProps = {
  label: string;
  value: string;
};

type MetresInputProps = {
  id: string;
  mm: number;
  step?: number;
  onCommit: (mm: number) => void;
};

type MetresFieldProps = MetresInputProps & {
  label: string;
};

type PointInputsProps = {
  id: string;
  point: Vec2;
  onChange: (point: Vec2) => void;
};

type ToggleProps<T extends string> = {
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
};

type DeleteButtonProps = {
  label: string;
  onClick: () => void;
};

const toMm = (raw: string): number | null => {
  const m = parseFloat(raw);
  return Number.isNaN(m) ? null : Math.round(m / M_PER_MM);
};

export const Section = ({ title, children }: SectionProps) => (
  <div className="flex h-full flex-col">
    <div className="border-b border-border px-4 py-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="flex-1 space-y-5 overflow-y-auto p-4">{children}</div>
  </div>
);

export const FieldLabel = ({ children }: FieldLabelProps) => (
  <label className="mb-2 block text-xs font-medium text-muted-foreground">{children}</label>
);

export const Row = ({ label, value }: RowProps) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="font-mono text-xs text-foreground">{value}</span>
  </div>
);

const MetresInput = ({ id, mm, step = POINT_STEP_M, onCommit }: MetresInputProps) => {
  const commit = (raw: string) => {
    const value = toMm(raw);
    if (value === null || value === mm) return;
    onCommit(value);
  };
  return (
    <Input
      type="number"
      step={step}
      defaultValue={metres(mm, METRES_DIGITS)}
      key={`${id}-${mm}`}
      className="h-8 text-xs"
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit(e.currentTarget.value);
      }}
    />
  );
};

export const MetresField = ({ label, ...input }: MetresFieldProps) => (
  <div>
    <label className="mb-1 block text-2xs text-muted-foreground">{label}</label>
    <MetresInput {...input} />
  </div>
);

export const PointInputs = ({ id, point, onChange }: PointInputsProps) => (
  <div className="grid grid-cols-2 gap-2">
    <MetresField
      id={`${id}-x`}
      label="X (m)"
      mm={point[0]}
      onCommit={(x) => onChange([x, point[1]])}
    />
    <MetresField
      id={`${id}-y`}
      label="Y (m)"
      mm={point[1]}
      onCommit={(y) => onChange([point[0], y])}
    />
  </div>
);

export const Toggle = <T extends string>({ value, options, onChange }: ToggleProps<T>) => (
  <div className="flex gap-2">
    {options.map(([option, label]) => (
      <button
        key={option}
        className={cn(
          "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
          value === option
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onChange(option)}
      >
        {label}
      </button>
    ))}
  </div>
);

export const DeleteButton = ({ label, onClick }: DeleteButtonProps) => (
  <Button variant="destructive" size="sm" className="w-full gap-2" onClick={onClick}>
    <Trash2 className="h-3.5 w-3.5" />
    {label}
  </Button>
);
