import { supabase } from "@/integrations/supabase/client";

const BUCKET_LOGOS = "logos";
const BUCKET_REPAIRS = "repair-photos";

/**
 * Determine the correct bucket from the storage path.
 */
function bucketFor(path: string): string {
  if (path.startsWith("repairs/") || path.startsWith("signatures/")) return BUCKET_REPAIRS;
  return BUCKET_LOGOS;
}

/**
 * Upload a file and return only the storage path (not a public URL).
 */
export async function uploadFile(
  path: string,
  file: Blob,
  options?: { contentType?: string; upsert?: boolean }
): Promise<string> {
  const bucket = bucketFor(path);
  const { error } = await supabase.storage.from(bucket).upload(path, file, options);
  if (error) throw error;
  return path;
}

/**
 * Resolve a stored path (or legacy public URL) to a signed URL.
 * Falls back to the raw value if signing fails.
 */
export async function getSignedFileUrl(
  pathOrUrl: string,
  expiresIn = 3600
): Promise<string> {
  // Legacy: full public URL → extract the storage path
  if (pathOrUrl.startsWith("http")) {
    const match = pathOrUrl.match(/\/storage\/v1\/object\/public\/logos\/(.+)$/);
    if (match) {
      pathOrUrl = decodeURIComponent(match[1]);
    } else {
      return pathOrUrl; // external URL, return as-is
    }
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(pathOrUrl, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    // Fallback: try public URL (will work while bucket is still public)
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(pathOrUrl);
    return pub.publicUrl;
  }

  return data.signedUrl;
}

/**
 * Resolve an array of stored paths/URLs to signed URLs.
 */
export async function getSignedFileUrls(
  pathsOrUrls: string[],
  expiresIn = 3600
): Promise<string[]> {
  return Promise.all(pathsOrUrls.map((p) => getSignedFileUrl(p, expiresIn)));
}
