import { Router } from "express";
import * as designController from "../controllers/design.controller";
import * as shareController from "../controllers/share.controller";
import * as versionController from "../controllers/version.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { requirePlanFeature } from "../middleware/plan-gate";
import { rateLimit } from "../middleware/rate-limit";
import { validate, responds } from "../middleware/validate";
import {
  createDesignSchema,
  getDesignSchema,
  listDesignsSchema,
  updateDesignSchema,
  deleteDesignSchema,
} from "../schemas/design.schema";
import {
  accessResponse,
  designListResponse,
  designResponse,
  designWithPermissionResponse,
  linkResponse,
  memberResponse,
  successResponse,
  versionListResponse,
  versionResponse,
} from "../schemas/response.schema";
import {
  addMemberSchema,
  removeMemberSchema,
  listAccessSchema,
  createLinkSchema,
  revokeLinkSchema,
} from "../schemas/share.schema";
import {
  createVersionSchema,
  listVersionsSchema,
  restoreVersionSchema,
  deleteVersionSchema,
} from "../schemas/version.schema";

const MEMBER_INVITE_RATE_WINDOW_MS = 60 * 60_000;
const MEMBER_INVITE_RATE_MAX_PER_WINDOW = 20;

const router = Router();

const memberInviteLimit = rateLimit({
  windowMs: MEMBER_INVITE_RATE_WINDOW_MS,
  max: MEMBER_INVITE_RATE_MAX_PER_WINDOW,
  name: "member-invite",
});

router.get(
  "/",
  requireAuth,
  validate(listDesignsSchema),
  responds(designListResponse),
  asyncHandler(designController.list),
);
router.post(
  "/",
  requireAuth,
  validate(createDesignSchema),
  responds(designResponse),
  asyncHandler(designController.create),
);

router.get(
  "/:id",
  optionalAuth,
  validate(getDesignSchema),
  responds(designWithPermissionResponse),
  asyncHandler(designController.get),
);
router.patch(
  "/:id",
  requireAuth,
  validate(updateDesignSchema),
  responds(designResponse),
  asyncHandler(designController.update),
);
router.delete(
  "/:id",
  requireAuth,
  validate(deleteDesignSchema),
  responds(successResponse),
  asyncHandler(designController.remove),
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
  memberInviteLimit,
  asyncHandler(requirePlanFeature("canShare", "SHARE_PRO_REQUIRED")),
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
  asyncHandler(requirePlanFeature("canShare", "SHARE_PRO_REQUIRED")),
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

router.get(
  "/:id/versions",
  requireAuth,
  validate(listVersionsSchema),
  responds(versionListResponse),
  asyncHandler(versionController.list),
);
router.post(
  "/:id/versions",
  requireAuth,
  validate(createVersionSchema),
  responds(versionResponse),
  asyncHandler(versionController.create),
);
router.post(
  "/:id/versions/:versionId/restore",
  requireAuth,
  validate(restoreVersionSchema),
  responds(designResponse, 200),
  asyncHandler(versionController.restore),
);
router.delete(
  "/:id/versions/:versionId",
  requireAuth,
  validate(deleteVersionSchema),
  responds(successResponse),
  asyncHandler(versionController.remove),
);

export { router as designRouter };
