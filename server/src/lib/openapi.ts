import type { Express, RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

type JsonSchema = Record<string, unknown>;

interface RouteInfo {
  method: string;
  path: string;
  schema?: ZodSchema;
  responseSchema?: ZodSchema;
  eventStream?: string;
  requiresAuth: boolean;
}

// Express stores the mount prefix as a regex; recover "/designs" from it.
const mountPath = (source: string): string =>
  source
    .replace(/^\^/, "")
    .replace(/\\\/\?\(\?=\\\/\|\$\)$/, "")
    .replace(/\$$/, "")
    .replace(/\\\//g, "/");

const DOC_ROUTES = new Set(["/api/docs", "/api/openapi.json"]);

const toOpenApiPath = (path: string): string =>
  path.replace(/:([A-Za-z0-9_]+)/g, "{$1}").replace(/(.)\/$/, "$1");

const walk = (layers: RouterLayer[], prefix: string, out: RouteInfo[]): void => {
  for (const layer of layers) {
    if (layer.route) {
      const handlers = layer.route.stack.map((s) => s.handle);
      out.push({
        method: Object.keys(layer.route.methods)[0],
        path: prefix + layer.route.path,
        schema: handlers.map((h) => h?.schema).find(Boolean),
        responseSchema: handlers.map((h) => h?.responseSchema).find(Boolean),
        eventStream: handlers.map((h) => h?.eventStream).find(Boolean),
        requiresAuth: handlers.some((h) => h?.name === "requireAuth"),
      });
      continue;
    }

    // Routers nest: app -> /api -> /designs -> route
    if (layer.handle?.stack) {
      walk(layer.handle.stack, prefix + mountPath(layer.regexp?.source ?? ""), out);
    }
  }
};

const collectRoutes = (app: Express): RouteInfo[] => {
  const stack = (app as unknown as { _router?: { stack: RouterLayer[] } })._router?.stack ?? [];
  const routes: RouteInfo[] = [];
  walk(stack, "", routes);
  return routes;
};

interface RouterLayer {
  regexp?: { source: string };
  handle?: { stack?: RouterLayer[] };
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: {
      handle?: RequestHandler & {
        schema?: ZodSchema;
        responseSchema?: ZodSchema;
        eventStream?: string;
        name?: string;
      };
    }[];
  };
}

const partOf = (schema: JsonSchema | undefined, key: string): JsonSchema | undefined => {
  const props = schema?.properties as Record<string, JsonSchema> | undefined;
  return props?.[key];
};

const parametersFrom = (part: JsonSchema | undefined, location: "path" | "query") => {
  const props = (part?.properties ?? {}) as Record<string, JsonSchema>;
  const required = (part?.required ?? []) as string[];

  return Object.entries(props).map(([name, schema]) => ({
    name,
    in: location,
    required: location === "path" ? true : required.includes(name),
    schema,
  }));
};

const errorRef = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

export const buildOpenApiDocument = (app: Express, baseUrl: string) => {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of collectRoutes(app)) {
    if (DOC_ROUTES.has(route.path)) continue;

    const json = route.schema
      ? (zodToJsonSchema(route.schema, { target: "openApi3" }) as JsonSchema)
      : undefined;

    const body = partOf(json, "body");
    const openApiPath = toOpenApiPath(route.path);

    const operation: Record<string, unknown> = {
      tags: [route.path.split("/")[2] || route.path.split("/")[1] || "root"],
      parameters: [
        ...parametersFrom(partOf(json, "params"), "path"),
        ...parametersFrom(partOf(json, "query"), "query"),
      ],
      responses: {
        [route.method === "post" && !route.eventStream ? "201" : "200"]: {
          description: route.eventStream ?? "Success",
          ...(route.eventStream
            ? { content: { "text/event-stream": { schema: { type: "string" } } } }
            : {}),
          ...(route.responseSchema
            ? {
                content: {
                  "application/json": {
                    schema: zodToJsonSchema(route.responseSchema, {
                      target: "openApi3",
                    }) as JsonSchema,
                  },
                },
              }
            : {}),
        },
        "400": errorRef("Invalid request"),
        ...(route.requiresAuth
          ? { "401": errorRef("Not signed in"), "403": errorRef("Not allowed") }
          : {}),
        "404": errorRef("Not found"),
      },
      ...(route.requiresAuth ? { security: [{ bearerAuth: [] }] } : {}),
    };

    if (body) {
      operation.requestBody = {
        required: true,
        content: { "application/json": { schema: body } },
      };
    }

    paths[openApiPath] ??= {};
    paths[openApiPath][route.method] = operation;
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Home Design Studio API",
      version: "1.0.0",
      description:
        "Generated from the live Express router and its Zod schemas, so it cannot drift from the code.",
    },
    servers: [{ url: baseUrl }],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
          required: ["error"],
        },
      },
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "Firebase ID token" },
      },
    },
    paths,
  };
};

export const swaggerHtml = (specUrl: string) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Home Design Studio API</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css" />
  </head>
  <body>
    <div id="swagger"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js"></script>
    <script>
      window.onload = () => SwaggerUIBundle({ url: "${specUrl}", dom_id: "#swagger" });
    </script>
  </body>
</html>`;
