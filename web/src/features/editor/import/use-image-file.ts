"use client";

import { useCallback, useEffect, useState } from "react";
import { IMPORT_IMAGE_MAX_BYTES, IMPORT_IMAGE_TYPES } from "@/shared/canvas";

export const BYTES_PER_MB = 1024 * 1024;
export const IMPORT_IMAGE_ACCEPT = IMPORT_IMAGE_TYPES.join(",");
export const IMPORT_IMAGE_FORMATS = IMPORT_IMAGE_TYPES.map((type) =>
  type.replace("image/", "").toUpperCase(),
).join(", ");
export const IMPORT_IMAGE_MAX_MB = IMPORT_IMAGE_MAX_BYTES / BYTES_PER_MB;

const WRONG_TYPE_MESSAGE = `Please upload a ${IMPORT_IMAGE_FORMATS} image.`;
const TOO_LARGE_MESSAGE = `Image is too large. Maximum size is ${IMPORT_IMAGE_MAX_MB}MB.`;

export type ImageFile = ReturnType<typeof useImageFile>;

export const useImageFile = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const select = useCallback((next: File) => {
    if (!IMPORT_IMAGE_TYPES.some((type) => type === next.type)) return setError(WRONG_TYPE_MESSAGE);
    if (next.size > IMPORT_IMAGE_MAX_BYTES) return setError(TOO_LARGE_MESSAGE);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setError("");
  }, []);

  const clear = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setError("");
  }, []);

  return { file, previewUrl, error, select, clear };
};
