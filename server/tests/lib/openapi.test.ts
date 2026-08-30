import { describe, test, expect } from "bun:test";
import express from "express";
import { z } from "zod";
import { validate, responds } from "@/middleware/validate";
import { buildOpenApiDocument, swaggerHtml } from "@/lib/openapi";

const requireAuth = (_q: unknown, _s: unknown, next: () => void) => next();

const buildApp = () => {
  const app = express();
  const designs = express.Router();

  designs.get(
    "/",
    requireAuth,
    validate(z.object({ query: z.object({ search: z.string().optional() }) })),
    (_q, _s) => {},
  );
  designs.post(
    "/",
    requireAuth,
    validate(
      z.object({ body: z.object({ name: z.string().min(1), width: z.number().optional() }) }),
    ),
    (_q, _s) => {},
  );
  designs.get(
    "/:id",
    validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
    responds(z.object({ id: z.string().uuid(), name: z.string() })),
    (_q, _s) => {},
  );

  const api = express.Router();
  api.use("/designs", designs);
  app.use("/api", api);

  // Express only builds the router lazily.
  app.get("/health", (_q, _s) => {});
  return app;
};

const doc = () => buildOpenApiDocument(buildApp(), "http://localhost:4000");

describe("buildOpenApiDocument", () => {
  test("finds routes nested two routers deep", () => {
    const paths = Object.keys(doc().paths);
    expect(paths).toContain("/api/designs");
    expect(paths).toContain("/api/designs/{id}");
  });

  test("converts express params to OpenAPI syntax", () => {
    expect(Object.keys(doc().paths)).not.toContain("/api/designs/:id");
  });

  test("derives the request body from the zod body schema", () => {
    const post = doc().paths["/api/designs"].post as {
      requestBody: { content: { "application/json": { schema: { properties: object } } } };
    };
    const schema = post.requestBody.content["application/json"].schema;
    expect(Object.keys(schema.properties)).toEqual(["name", "width"]);
  });

  test("derives query parameters", () => {
    const get = doc().paths["/api/designs"].get as { parameters: { name: string; in: string }[] };
    expect(get.parameters).toContainEqual(expect.objectContaining({ name: "search", in: "query" }));
  });

  test("path parameters are always required", () => {
    const get = doc().paths["/api/designs/{id}"].get as {
      parameters: { name: string; in: string; required: boolean }[];
    };
    expect(get.parameters[0]).toMatchObject({ name: "id", in: "path", required: true });
  });

  test("marks routes behind requireAuth as secured", () => {
    const paths = doc().paths;
    expect((paths["/api/designs"].post as { security?: unknown }).security).toBeDefined();
    expect((paths["/api/designs/{id}"].get as { security?: unknown }).security).toBeUndefined();
  });

  test("declares the bearer scheme", () => {
    expect(doc().components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
  });

  test("is a valid OpenAPI 3 envelope", () => {
    const d = doc();
    expect(d.openapi).toBe("3.0.3");
    expect(d.info.title.length).toBeGreaterThan(0);
    expect(d.servers[0].url).toBe("http://localhost:4000");
  });

  test("serialises to JSON", () => {
    expect(() => JSON.stringify(doc())).not.toThrow();
  });
});

describe("response schemas", () => {
  test("a declared response becomes the 200 content schema", () => {
    const get = doc().paths["/api/designs/{id}"].get as {
      responses: Record<string, { content?: Record<string, { schema: { properties: object } }> }>;
    };
    const schema = get.responses["200"].content!["application/json"].schema;
    expect(Object.keys(schema.properties)).toEqual(["id", "name"]);
  });

  test("a POST documents 201 rather than 200", () => {
    const post = doc().paths["/api/designs"].post as { responses: Record<string, unknown> };
    expect(Object.keys(post.responses)).toContain("201");
  });

  test("every operation documents its error responses against a shared Error schema", () => {
    const d = doc();
    for (const methods of Object.values(d.paths)) {
      for (const op of Object.values(methods) as { responses: Record<string, unknown> }[]) {
        expect(op.responses["400"]).toBeDefined();
        expect(op.responses["404"]).toBeDefined();
      }
    }
    expect(d.components.schemas.Error).toBeDefined();
  });

  test("secured routes also document 401 and 403", () => {
    const post = doc().paths["/api/designs"].post as { responses: Record<string, unknown> };
    expect(post.responses["401"]).toBeDefined();
    expect(post.responses["403"]).toBeDefined();
  });
});

describe("swaggerHtml", () => {
  test("points the viewer at the given spec url", () => {
    const html = swaggerHtml("/api/openapi.json");
    expect(html).toContain("/api/openapi.json");
    expect(html).toContain("SwaggerUIBundle");
  });
});
