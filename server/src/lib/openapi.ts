import { zodToJsonSchema } from "zod-to-json-schema";
import { errorResponse } from "../schemas/response.schema";
import type { Express, RequestHandler } from "express";
import type { ZodSchema } from "zod";

type JsonSchema = Record<string, unknown>;

type RouteInfo = {
  method: string;
  path: string;
  schema?: ZodSchema;
  responseSchema?: ZodSchema;
  responseStatus?: number;
  eventStream?: string;
  requiresAuth: boolean;
  optionalAuth: boolean;
};

type RouteHandler = RequestHandler & {
  schema?: ZodSchema;
  responseSchema?: ZodSchema;
  responseStatus?: number;
  eventStream?: string;
  name?: string;
};

type RouterLayer = {
  regexp?: { source: string };
  handle?: { stack?: RouterLayer[] };
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: { handle?: RouteHandler }[];
  };
};

type AppWithRouter = Express & { _router?: { stack: RouterLayer[] } };

const DOC_ROUTES = new Set(["/api/docs", "/api/openapi.json"]);
const CREATED_STATUS = "201";
const OK_STATUS = "200";

export const buildOpenApiDocument = (app: Express, baseUrl: string) => {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of collectRoutes(app)) {
    if (DOC_ROUTES.has(route.path)) continue;
    const openApiPath = route.path.replace(/:([A-Za-z0-9_]+)/g, "{$1}").replace(/(.)\/$/, "$1");
    paths[openApiPath] ??= {};
    paths[openApiPath][route.method] = operationFor(route);
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Home Design Studio API",
      version: "1.0.0",
      description: "Generated from the live Express router and its Zod schemas.",
    },
    servers: [{ url: baseUrl }],
    components: {
      schemas: { Error: toJsonSchema(errorResponse) },
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

const toJsonSchema = (schema: ZodSchema): JsonSchema =>
  zodToJsonSchema(schema, { target: "openApi3" }) as JsonSchema;

const mountPath = (source: string): string =>
  source
    .replace(/^\^/, "")
    .replace(/\\\/\?\(\?=\\\/\|\$\)$/, "")
    .replace(/\$$/, "")
    .replace(/\\\//g, "/");

const walk = (layers: RouterLayer[], prefix: string, out: RouteInfo[]): void => {
  for (const layer of layers) {
    if (layer.route) {
      const handlers = layer.route.stack.map((s) => s.handle);
      out.push({
        method: Object.keys(layer.route.methods)[0],
        path: prefix + layer.route.path,
        schema: handlers.map((h) => h?.schema).find(Boolean),
        responseSchema: handlers.map((h) => h?.responseSchema).find(Boolean),
        responseStatus: handlers.map((h) => h?.responseStatus).find(Boolean),
        eventStream: handlers.map((h) => h?.eventStream).find(Boolean),
        requiresAuth: handlers.some((h) => h?.name === "requireAuth"),
        optionalAuth: handlers.some((h) => h?.name === "optionalAuth"),
      });
      continue;
    }

    if (layer.handle?.stack) {
      walk(layer.handle.stack, prefix + mountPath(layer.regexp?.source ?? ""), out);
    }
  }
};

const collectRoutes = (app: Express): RouteInfo[] => {
  const routes: RouteInfo[] = [];
  walk((app as AppWithRouter)._router?.stack ?? [], "", routes);
  return routes;
};

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

const successResponseFor = (route: RouteInfo) => {
  const status =
    route.responseStatus?.toString() ??
    (route.method === "post" && !route.eventStream ? CREATED_STATUS : OK_STATUS);
  const content = route.eventStream
    ? { "text/event-stream": { schema: { type: "string" } } }
    : route.responseSchema
      ? { "application/json": { schema: toJsonSchema(route.responseSchema) } }
      : undefined;

  return {
    [status]: {
      description: route.eventStream ?? "Success",
      ...(content ? { content } : {}),
    },
  };
};

const operationFor = (route: RouteInfo) => {
  const json = route.schema ? toJsonSchema(route.schema) : undefined;
  const body = partOf(json, "body");
  const parts = route.path.split("/").filter(Boolean);

  return {
    tags: [parts[1] ?? parts[0] ?? "root"],
    parameters: [
      ...parametersFrom(partOf(json, "params"), "path"),
      ...parametersFrom(partOf(json, "query"), "query"),
    ],
    responses: {
      ...successResponseFor(route),
      "400": errorRef("Invalid request"),
      ...(route.requiresAuth
        ? { "401": errorRef("Not signed in"), "403": errorRef("Not allowed") }
        : {}),
      "404": errorRef("Not found"),
    },
    ...(route.requiresAuth ? { security: [{ bearerAuth: [] }] } : {}),
    ...(route.optionalAuth ? { security: [{ bearerAuth: [] }, {}] } : {}),
    ...(body
      ? { requestBody: { required: true, content: { "application/json": { schema: body } } } }
      : {}),
  };
};
