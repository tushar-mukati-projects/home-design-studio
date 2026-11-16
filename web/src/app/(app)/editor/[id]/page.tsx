import type { Metadata } from "next";
import { EditorLoader } from "@/components/layout/editor-loader";

export const metadata: Metadata = {
  title: "Editor",
};

type EditorPageProps = {
  params: Promise<{ id: string }>;
};

const EditorPage = async ({ params }: EditorPageProps) => {
  const { id } = await params;
  return <EditorLoader key={id} designId={id} />;
};

export default EditorPage;
