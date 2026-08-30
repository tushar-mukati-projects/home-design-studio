import { createServer } from "http";
import express from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import cors from "cors";
import { config, disabledFeatures } from "./lib/config";
import { logger } from "./lib/logger";
import { router as routes } from "./routes";
import { seedDefaultFurniture } from "./services/furniture.service";
import { seedTemplates } from "./services/template.service";
import { startCollab } from "./collaboration/hocuspocus";
import { buildOpenApiDocument, swaggerHtml } from "./lib/openapi";
import { responds } from "./middleware/validate";
import { healthResponse } from "./schemas/response.schema";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
// Must precede express.json: Stripe signs the raw bytes.
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]("request", {
      method: req.method,
      path: req.originalUrl.split("?")[0],
      status: res.statusCode,
      ms: Date.now() - startedAt,
    });
  });
  next();
});

app.get("/health", responds(healthResponse), (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", routes);

app.get("/api/openapi.json", (req, res) => {
  res.json(buildOpenApiDocument(app, `${req.protocol}://${req.get("host")}`));
});

app.get("/api/docs", (_req, res) => {
  res.type("html").send(swaggerHtml("/api/openapi.json"));
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (res.headersSent) {
    logger.error("Error after response started", { error: err.message });
    res.end();
    return;
  }
  if (err instanceof MulterError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
    });
    return;
  }
  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

const server = createServer(app);
const collabWss = startCollab();

server.on("upgrade", (req, socket, head) => {
  if ((req.url ?? "").startsWith("/collaboration")) {
    collabWss.handleUpgrade(req, socket, head, (ws) => {
      collabWss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

const start = async () => {
  try {
    await seedDefaultFurniture();
    logger.info("Default furniture seeded");
  } catch (err) {
    logger.error("Failed to seed furniture", { error: err });
  }

  try {
    await seedTemplates();
    logger.info("Design templates seeded");
  } catch (err) {
    logger.error("Failed to seed templates", { error: err });
  }

  const off = disabledFeatures();
  if (off.length > 0) {
    logger.warn(`Disabled (missing configuration): ${off.join(", ")}`);
  }

  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info("WebSocket available at /collaboration");
  });
};

start();

export { app };
