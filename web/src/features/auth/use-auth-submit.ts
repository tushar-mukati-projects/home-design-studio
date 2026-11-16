import { useState } from "react";
import { authErrorMessage } from "@/lib/auth-error";

export const useAuthSubmit = (action: () => Promise<void>) => {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await action();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return { error, setError, submitting, submit };
};
