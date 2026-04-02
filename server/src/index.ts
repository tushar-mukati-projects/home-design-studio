import { createServer } from "http";
import express from "express";
import cors from "cors";
import { config } from "./config";
import { logger } from "./logger";
import { router as routes } from "./routes";
import { seedDefaultFurniture } from "./services/furniture.service";
import { seedTemplates } from "./services/template.service";
import { startCollab } from "./collaboration/hocuspocus";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", routes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info("WebSocket available at /collaboration");
  });
};

start();

export { app };
