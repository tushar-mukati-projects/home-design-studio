import type { Metadata } from "next";
import { SharedDesignView } from "@/features/shared/shared-design-view";

export const metadata: Metadata = {
  title: "Shared design",
};

type SharedDesignPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SharedDesignPage = async ({ params, searchParams }: SharedDesignPageProps) => {
  const [{ id }, { code }] = await Promise.all([params, searchParams]);
  return <SharedDesignView id={id} code={typeof code === "string" ? code : ""} />;
};

export default SharedDesignPage;
