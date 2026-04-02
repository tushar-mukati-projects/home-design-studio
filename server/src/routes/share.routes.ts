import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import * as shareController from "../controllers/share.controller";

const router = Router();

router.get("/shared-with-me", requireAuth, shareController.sharedWithMe);
router.get("/by-token/:token", optionalAuth, shareController.getByToken);
router.get("/:id/shares", requireAuth, shareController.list);
router.post("/:id/share", requireAuth, shareController.share);
router.post("/:id/share-link", requireAuth, shareController.toggleLink);
router.delete("/:id/shares/:shareId", requireAuth, shareController.revoke);

export const shareRouter = router;
