"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

type AuthFieldProps = {
  id: string;
  label: string;
  type: "text" | "email";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: "name" | "email";
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
};

type AuthErrorProps = {
  message: string;
};

const LABEL_CLASS = "block text-sm font-medium text-foreground";

export const AuthField = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: AuthFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={id} className={LABEL_CLASS}>
      {label}
    </label>
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      autoComplete={autoComplete}
      className="h-10 bg-secondary"
    />
  </div>
);

export const PasswordField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="h-10 bg-secondary pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
};

export const AuthError = ({ message }: AuthErrorProps) =>
  message ? (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm text-destructive"
    >
      {message}
    </motion.p>
  ) : null;
