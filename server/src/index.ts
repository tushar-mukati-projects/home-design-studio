import { createServer } from "http";
import cors from "cors";
import express from "express";
import { startCollab } from "./collaboration/hocuspocus";
import { config, disabledFeatures } from "./lib/config";
import { errorMessage } from "./lib/http-error";
import { logger } from "./lib/logger";
import { buildOpenApiDocument, swaggerHtml } from "./lib/openapi";
import { errorHandler } from "./middleware/error";
import { requestLog } from "./middleware/request-log";
import { responds } from "./middleware/validate";
import { router as routes } from "./routes";
import { healthResponse } from "./schemas/response.schema";
import { seedFurniture } from "./services/furniture.service";
import { seedTemplates } from "./services/template.service";

const JSON_BODY_LIMIT = "10mb";
const WEBHOOK_PATH = "/api/billing/webhook";
const COLLAB_PATH = "/collaboration";
const OPENAPI_PATH = "/api/openapi.json";
const TRUSTED_PROXY_HOPS = 1;

const app = express();

app.set("trust proxy", TRUSTED_PROXY_HOPS);

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(WEBHOOK_PATH, express.raw({ type: "application/json" }));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(requestLog);

app.get("/health", responds(healthResponse), (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", routes);

app.get(OPENAPI_PATH, (req, res) => {
  res.json(buildOpenApiDocument(app, `${req.protocol}://${req.get("host")}`));
});

app.get("/api/docs", (_req, res) => {
  res.type("html").send(swaggerHtml(OPENAPI_PATH));
});

app.use(errorHandler);

const server = createServer(app);
const collabWss = startCollab();

server.on("upgrade", (req, socket, head) => {
  if ((req.url ?? "").startsWith(COLLAB_PATH)) {
    collabWss.handleUpgrade(req, socket, head, (ws) => {
      collabWss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

const start = async () => {
  await seedFurniture();
  logger.info("Default furniture seeded");
  await seedTemplates();
  logger.info("Design templates seeded");

  const off = disabledFeatures();
  if (off.length > 0) {
    logger.warn(`Disabled (missing configuration): ${off.join(", ")}`);
  }

  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info(`WebSocket available at ${COLLAB_PATH}`);
  });
};

start().catch((error: unknown) => {
  logger.error("Server failed to start", { error: errorMessage(error) });
  process.exit(1);
});
