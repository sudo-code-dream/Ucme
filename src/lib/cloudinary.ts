import { createHash } from "crypto";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Signed server-side upload. Returns the HTTPS URL. Throws a user-safe Error message. */
export async function uploadImage(file: File): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error("Photo must be a JPG, PNG or WebP image");
  if (file.size > MAX_BYTES) throw new Error("Photo must be 5 MB or smaller");
  const cloud = process.env.CLOUDINARY_CLOUD_NAME, key = process.env.CLOUDINARY_API_KEY, secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new Error("Photo upload is not configured yet");

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = "ucme/reports";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");

  const body = new FormData();
  body.set("file", file); body.set("api_key", key); body.set("timestamp", timestamp); body.set("folder", folder); body.set("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body });
  if (!res.ok) throw new Error("Photo upload failed. Please try again");
  return (await res.json()).secure_url as string;
}

/** Best-effort removal of a photo we uploaded (used when an account is deleted). */
export async function deleteImage(url: string): Promise<void> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME, key = process.env.CLOUDINARY_API_KEY, secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret || !url.includes(`/${cloud}/`)) return; // only touch our own cloud
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  if (!m) return;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHash("sha1").update(`public_id=${m[1]}&timestamp=${timestamp}${secret}`).digest("hex");
  const body = new FormData();
  body.set("public_id", m[1]); body.set("api_key", key); body.set("timestamp", timestamp); body.set("signature", signature);
  await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: "POST", body });
}
