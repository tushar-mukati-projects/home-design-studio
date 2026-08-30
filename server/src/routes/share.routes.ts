import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate, responds } from "../middleware/validate";
import { asyncHandler } from "../middleware/async-handler";
import {
  accessResponse,
  memberResponse,
  linkResponse,
  sharedDesignResponse,
  sharedWithMeResponse,
  successResponse,
} from "../schemas/response.schema";
import {
  addMemberSchema,
  removeMemberSchema,
  listAccessSchema,
  createLinkSchema,
  revokeLinkSchema,
  getByCodeSchema,
} from "../schemas/share.schema";
import * as shareController from "../controllers/share.controller";

const router = Router();

router.get(
  "/shared-with-me",
  requireAuth,
  responds(sharedWithMeResponse),
  asyncHandler(shareController.sharedWithMe),
);
router.get(
  "/by-code/:code",
  validate(getByCodeSchema),
  responds(sharedDesignResponse),
  asyncHandler(shareController.getByCode),
);

router.get(
  "/:id/access",
  requireAuth,
  validate(listAccessSchema),
  responds(accessResponse),
  asyncHandler(shareController.listAccess),
);

router.post(
  "/:id/members",
  requireAuth,
  validate(addMemberSchema),
  responds(memberResponse),
  asyncHandler(shareController.addMember),
);
router.delete(
  "/:id/members/:memberId",
  requireAuth,
  validate(removeMemberSchema),
  responds(successResponse),
  asyncHandler(shareController.removeMember),
);

router.post(
  "/:id/links",
  requireAuth,
  validate(createLinkSchema),
  responds(linkResponse),
  asyncHandler(shareController.createLink),
);
router.delete(
  "/:id/links/:linkId",
  requireAuth,
  validate(revokeLinkSchema),
  responds(successResponse),
  asyncHandler(shareController.revokeLink),
);

export { router as shareRouter };
