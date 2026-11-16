import { applyToCollabDoc, currentCanvas } from "../collaboration/hocuspocus";
import { canvasFromRow } from "../collaboration/yjs-doc";
import { prisma } from "../lib/db";
import { designWhere, requireDesign } from "../lib/design-access";
import { httpError } from "../lib/http-error";
import { serializeDesign } from "../lib/serializers";

const VERSION_PAGE_SIZE = 100;
const DEFAULT_VERSION_NAME = "Auto-save";

export const createVersion = async (
  designId: string,
  userId: string,
  name: string | undefined,
  email?: string,
) => {
  const design = await requireDesign(
    designWhere(designId, userId, email, "readwrite"),
    { canvasData: true },
    "DESIGN_NOT_FOUND",
  );

  return prisma.designVersion.create({
    data: {
      designId,
      name: name ?? DEFAULT_VERSION_NAME,
      canvasData: currentCanvas(designId, design.canvasData),
      createdById: userId,
    },
  });
};

export const listVersions = async (designId: string, userId: string, email?: string) => {
  await requireDesign(
    designWhere(designId, userId, email, "readonly"),
    { id: true },
    "DESIGN_NOT_FOUND",
  );

  return prisma.designVersion.findMany({
    where: { designId },
    orderBy: { createdAt: "desc" },
    take: VERSION_PAGE_SIZE,
  });
};

export const restoreVersion = async (
  designId: string,
  versionId: string,
  userId: string,
  email?: string,
) => {
  await requireDesign(
    designWhere(designId, userId, email, "readwrite"),
    { id: true },
    "DESIGN_OR_VERSION_NOT_FOUND",
  );

  const version = await prisma.designVersion.findFirst({ where: { id: versionId, designId } });
  if (!version) throw httpError(404, "DESIGN_OR_VERSION_NOT_FOUND");

  await applyToCollabDoc(designId, { canvas: canvasFromRow(version.canvasData) });

  return serializeDesign(await prisma.design.findUniqueOrThrow({ where: { id: designId } }));
};

export const deleteVersion = async (designId: string, versionId: string, userId: string) => {
  const { count } = await prisma.designVersion.deleteMany({
    where: { id: versionId, designId, design: { userId } },
  });
  if (count === 0) throw httpError(404, "VERSION_NOT_FOUND");
};
