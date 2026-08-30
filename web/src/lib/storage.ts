import { supabase } from "./supabase";

const BUCKET = "design-assets";

export async function uploadDesignThumbnail(designId: string, blob: Blob): Promise<string> {
  const path = `thumbnails/${designId}.png`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadExport(
  designId: string,
  blob: Blob,
  filename: string,
): Promise<string> {
  const path = `exports/${designId}/${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteDesignFiles(designId: string): Promise<void> {
  const { error: thumbError } = await supabase.storage
    .from(BUCKET)
    .remove([`thumbnails/${designId}.png`]);
  if (thumbError) throw thumbError;

  const { data, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(`exports/${designId}`);
  if (listError) throw listError;

  if (data?.length) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove(data.map((f) => `exports/${designId}/${f.name}`));
    if (removeError) throw removeError;
  }
}
