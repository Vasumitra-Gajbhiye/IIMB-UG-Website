import { presignBlogImage } from "@/lib/actions/blogs";
import { BLOG_IMAGE_MAX_BYTES, BLOG_IMAGE_MIME_TYPES } from "@/lib/blogs";

/** Check type/size client-side before asking the server to presign. */
export function checkBlogImage(file: { type: string; size: number }): string | null {
  if (!(BLOG_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Use a JPEG, PNG, WebP or GIF image.";
  }
  if (file.size > BLOG_IMAGE_MAX_BYTES) {
    return `Images must be under ${BLOG_IMAGE_MAX_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

/** Upload an image to R2 via a presigned PUT and return its public URL. */
export async function uploadBlogImage(file: Blob): Promise<string> {
  const problem = checkBlogImage(file);
  if (problem) throw new Error(problem);
  const presigned = await presignBlogImage({
    contentType: file.type,
    sizeBytes: file.size,
  });
  if (!presigned.ok) throw new Error(presigned.error);
  const res = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return presigned.publicUrl;
}
