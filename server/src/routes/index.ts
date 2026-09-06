import { Router } from "express";
import { meRouter } from "./me.routes";
import { designRouter } from "./design.routes";
import { furnitureRouter } from "./furniture.routes";
import { aiRouter } from "./ai.routes";
import { templateRouter } from "./template.routes";
import { stripeRouter } from "./stripe.routes";

const router = Router();

router.use("/me", meRouter);
router.use("/designs", designRouter);
router.use("/furniture", furnitureRouter);
router.use("/ai", aiRouter);
router.use("/templates", templateRouter);
router.use("/billing", stripeRouter);

export { router };
