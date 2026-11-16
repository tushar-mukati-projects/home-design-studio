import { describe, test, expect } from "bun:test";
import { MulterError } from "multer";
import { z } from "zod";
import { httpError } from "@/lib/http-error";
import { errorHandler } from "@/middleware/error";

const makeRes = () => {
  let statusCode = 0;
  let body: unknown = null;
  return {
    headersSent: false,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  };
};

const handle = (err: Error) => {
  const res = makeRes();
  errorHandler(err, {} as never, res as never, () => {});
  return res;
};

const zodError = () => {
  const result = z.object({ body: z.object({ email: z.string().email() }) }).safeParse({
    body: { email: "nope" },
  });
  if (result.success) throw new Error("expected a validation failure");
  return result.error;
};

describe("errorHandler", () => {
  test("a ZodError is a 400 with the field errors and the old message text", () => {
    const res = handle(zodError());
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      code: "VALIDATION_FAILED",
      error: "body.email: Invalid email",
      fields: { "body.email": ["Invalid email"] },
    });
  });

  test.each([
    ["entity.parse.failed", 400, "MALFORMED_BODY"],
    ["entity.too.large", 413, "BODY_TOO_LARGE"],
  ])("a body-parser %s error is %d %s", (type, status, code) => {
    const res = handle(Object.assign(new Error("x"), { type, status }));
    expect(res.statusCode).toBe(status);
    expect(res.body).toMatchObject({ code });
  });

  test("a coded error answers with its status, text, code and details", () => {
    const res = handle(httpError(403, "DESIGN_LIMIT_REACHED", { limit: 3 }));
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error: "Design limit reached",
      code: "DESIGN_LIMIT_REACHED",
      limit: 3,
    });
  });

  test("an upload rejection keeps multer's message", () => {
    const err = new MulterError("LIMIT_FILE_SIZE");
    const res = handle(err);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: err.message, code: "UPLOAD_REJECTED" });
  });

  test("anything else is a 500 that hides the message", () => {
    const res = handle(new Error("secret internals"));
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error", code: "INTERNAL" });
  });
});
