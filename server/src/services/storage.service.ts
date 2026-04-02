import { supabase } from "../lib/supabase";

const BUCKET = "design-assets";

export const uploadFile = async (
  buffer: Buffer,
  path: string,
  contentType: string,
): Promise<string> => {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (path: string): Promise<void> => {
  await supabase.storage.from(BUCKET).remove([path]);
};

export const getFileUrl = (path: string): string => {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
