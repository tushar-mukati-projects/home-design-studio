import { Router } from "express";
import { designRouter } from "./design.routes";
import { furnitureRouter } from "./furniture.routes";
import { roomRouter } from "./room.routes";
import { aiRouter } from "./ai.routes";
import { shareRouter } from "./share.routes";
import { versionRouter } from "./version.routes";
import { templateRouter } from "./template.routes";
import { stripeRouter } from "./stripe.routes";

const router = Router();

router.use("/designs", designRouter);
router.use("/furniture", furnitureRouter);
router.use("/rooms", roomRouter);
router.use("/ai", aiRouter);
router.use("/sharing", shareRouter);
router.use("/versions", versionRouter);
router.use("/templates", templateRouter);
router.use("/billing", stripeRouter);

export { router };
