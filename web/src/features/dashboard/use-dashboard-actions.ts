import { useState } from "react";
import { useRouter } from "next/navigation";
import NProgress from "nprogress";
import { toast } from "sonner";
import { useCreateDesign, type CreateDesignPayload } from "@/hooks/designs/useCreateDesign";
import { useDeleteDesign } from "@/hooks/designs/useDeleteDesign";
import { useUpdateDesign } from "@/hooks/designs/useUpdateDesign";
import { getApiErrorMessage } from "@/lib/api-error";
import type { DesignListItem } from "@/types";
import { createDesignGate, type PlanQueryState } from "./lib/plan-gate";

type PlanQuery = PlanQueryState & { error: unknown };

type CreateCallbacks = {
  onCreated?: () => void;
  onFailed?: () => void;
};

const PLAN_CHECKING_MESSAGE = "Checking your plan, one moment.";

export const useDashboardActions = (planQuery: PlanQuery) => {
  const router = useRouter();
  const createDesign = useCreateDesign();
  const deleteDesign = useDeleteDesign();
  const updateDesign = useUpdateDesign();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openDesign = (id: string) => {
    NProgress.start();
    router.push(`/editor/${id}`);
  };

  const guardCreate = (): boolean => {
    const gate = createDesignGate(planQuery);
    if (gate === "limit") setUpgradeOpen(true);
    if (gate === "checking") toast.info(PLAN_CHECKING_MESSAGE);
    if (gate === "unavailable") toast.error(getApiErrorMessage(planQuery.error));
    return gate === "open";
  };

  const create = (payload: CreateDesignPayload, { onCreated, onFailed }: CreateCallbacks) =>
    createDesign.mutate(payload, {
      onSuccess: (design) => {
        toast.success(
          payload.templateId ? "Design created from template" : "Design created successfully",
        );
        onCreated?.();
        openDesign(design.id);
      },
      onError: onFailed,
    });

  const duplicate = (design: DesignListItem) => {
    if (createDesign.isPending || !guardCreate()) return;
    createDesign.mutate(
      {
        name: `${design.name} (Copy)`,
        description: design.description ?? undefined,
        duplicateOf: design.id,
      },
      { onSuccess: (copy) => toast.success(`Duplicated as "${copy.name}"`) },
    );
  };

  const remove = (design: DesignListItem, onDone: () => void) =>
    deleteDesign.mutate(design.id, {
      onSuccess: () => {
        toast.success(`"${design.name}" has been deleted`);
        onDone();
      },
    });

  const rename = (design: DesignListItem, name: string, onDone: () => void) =>
    updateDesign.mutate(
      { id: design.id, name },
      {
        onSuccess: () => {
          toast.success(`Renamed to "${name}"`);
          onDone();
        },
      },
    );

  return {
    openDesign,
    guardCreate,
    create,
    duplicate,
    remove,
    rename,
    upgradeOpen,
    setUpgradeOpen,
    creating: createDesign.isPending,
    deleting: deleteDesign.isPending,
    renaming: updateDesign.isPending,
  };
};
