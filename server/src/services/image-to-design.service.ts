import { generateObject, NoObjectGeneratedError } from "ai";
import { ZodError } from "zod";
import type { Response } from "express";
import { AI_MAX_RETRIES, AI_TIMEOUT_MS, languageModel } from "../lib/ai-client";
import { runEventStream } from "../lib/sse";
import { canvasSchema } from "../shared/canvas";
import { SKETCH_SYSTEM_PROMPT, SKETCH_USER_PROMPT } from "./image-to-design/prompt";
import { sketchSchema, toCanvas } from "./image-to-design/sketch";

const SKETCH_TEMPERATURE = 0.3;
const SKETCH_MAX_OUTPUT_TOKENS = 4096;
const INVALID_PLAN_MESSAGE = "Could not build a valid floor plan from this image";
const ANALYSIS_FAILED_MESSAGE = "Failed to analyze image. Please try again.";

export const analyzeImage = async (image: Buffer, mimeType: string, res: Response) => {
  const model = languageModel();

  await runEventStream(res, failMessage, async (stream) => {
    stream.send("status", { message: "Identifying walls, rooms, and furniture..." });

    const { object: sketch } = await generateObject({
      model,
      schema: sketchSchema,
      system: SKETCH_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SKETCH_USER_PROMPT },
            {
              type: "image",
              image,
              mediaType: mimeType,
              providerOptions: { openai: { imageDetail: "high" } },
            },
          ],
        },
      ],
      temperature: SKETCH_TEMPERATURE,
      maxOutputTokens: SKETCH_MAX_OUTPUT_TOKENS,
      maxRetries: AI_MAX_RETRIES,
      timeout: AI_TIMEOUT_MS,
      abortSignal: stream.signal,
      providerOptions: { openai: { strictJsonSchema: false } },
    });

    stream.send("status", { message: "Building your floor plan..." });
    const canvas = canvasSchema.parse(toCanvas(sketch));
    stream.send("status", {
      message: `Found ${canvas.walls.length} walls, ${canvas.rooms.length} rooms, ${canvas.furniture.length} furniture items`,
    });
    stream.send("result", { canvas });
  });
};

const failMessage = (error: unknown): string =>
  NoObjectGeneratedError.isInstance(error) || error instanceof ZodError
    ? INVALID_PLAN_MESSAGE
    : ANALYSIS_FAILED_MESSAGE;
