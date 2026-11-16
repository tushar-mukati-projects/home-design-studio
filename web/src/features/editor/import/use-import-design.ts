"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError, readSseEvents } from "@/lib/sse";
import type { Canvas } from "@/shared/canvas";
import { useEditorStore } from "@/stores/editor-store";
import { openSseStream } from "../open-sse-stream";
import { importEventSchema } from "./import-events";

type ImportPhase = "upload" | "confirm" | "analyzing" | "success" | "error";

const IMPORT_PATH = "/ai/image-to-design";
const IMAGE_FIELD = "image";
const PREPARING_MESSAGE = "Preparing image...";
const READ_FAILED_MESSAGE = "We couldn't read this image. Try another photo or plan.";
const NO_RESULT_MESSAGE = "Design AI didn't return a plan. Try another image.";
const OFFLINE_MESSAGE = "We can't connect right now. Check your connection and try again.";

export const useImportDesign = () => {
  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const setCanvas = useEditorStore((s) => s.setCanvas);

  const analyze = useCallback(
    async (file: File) => {
      setPhase("analyzing");
      setStatusMessage(PREPARING_MESSAGE);
      setErrorMessage("");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const formData = new FormData();
        formData.append(IMAGE_FIELD, file);
        const body = await openSseStream(IMPORT_PATH, formData, controller.signal);
        let imported = false;
        for await (const event of readSseEvents(body, importEventSchema)) {
          if (event.type === "status") setStatusMessage(event.message);
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "result") {
            setCanvas(event.canvas);
            setSummary(describeCanvas(event.canvas));
            imported = true;
          }
        }
        if (!imported) throw new Error(NO_RESULT_MESSAGE);
        setPhase("success");
      } catch (err) {
        if (isAbortError(err)) return;
        setPhase("error");
        setErrorMessage(failureMessage(err));
      } finally {
        abortRef.current = null;
      }
    },
    [setCanvas],
  );

  const confirm = useCallback(() => setPhase("confirm"), []);
  const cancel = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPhase("upload");
    setStatusMessage("");
    setErrorMessage("");
    setSummary("");
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { phase, statusMessage, errorMessage, summary, analyze, confirm, cancel, reset };
};

const failureMessage = (err: unknown): string => {
  if (err instanceof TypeError) return OFFLINE_MESSAGE;
  return err instanceof Error && err.message ? err.message : READ_FAILED_MESSAGE;
};

const describeCanvas = (canvas: Canvas): string =>
  `${canvas.walls.length} walls, ${canvas.rooms.length} rooms, ${canvas.openings.length} openings, ${canvas.furniture.length} furniture items`;
