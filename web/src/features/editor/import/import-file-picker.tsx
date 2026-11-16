"use client";

import { useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { AlertCircle, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import {
  BYTES_PER_MB,
  IMPORT_IMAGE_ACCEPT,
  IMPORT_IMAGE_FORMATS,
  IMPORT_IMAGE_MAX_MB,
  type ImageFile,
} from "./use-image-file";

type ImportFilePickerProps = {
  image: ImageFile;
};

export const ImportFilePicker = ({ image }: ImportFilePickerProps) => {
  const { file, previewUrl, error, select, clear: clearImage } = image;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) select(dropped);
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) select(picked);
  };

  const clear = () => {
    clearImage();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-background px-6 py-10 transition-colors hover:border-primary hover:bg-secondary"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drop an image here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Room photos, floor plan sketches, or blueprints
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {IMPORT_IMAGE_FORMATS} • Max {IMPORT_IMAGE_MAX_MB}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-border bg-background">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Selected image"
                className="mx-auto max-h-64 object-contain p-2"
              />
            )}
            <button
              type="button"
              onClick={clear}
              aria-label="Remove image"
              className="absolute top-2 right-2 rounded-lg bg-card/90 p-1.5 text-muted-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2">
            <ImageIcon className="size-4 text-muted-foreground" />
            <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              {(file.size / BYTES_PER_MB).toFixed(1)} MB
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMPORT_IMAGE_ACCEPT}
        onChange={handleInput}
        className="hidden"
      />
    </div>
  );
};
