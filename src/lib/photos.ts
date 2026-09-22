"use client";

/* ------------------------------------------------------------------ */
/*  Locora — Phase C: real listing photos                              */
/*  Client-side compression + upload to the `listing-photos` bucket.   */
/*  Uploads go to `<userId>/<uuid>.jpg` (RLS: own folder only),        */
/*  reads are public.                                                  */
/* ------------------------------------------------------------------ */

import { supabase } from "@/lib/supabase/client";

const MAX_DIM = 1600;
const QUALITY = 0.82;

/** Load a File into a canvas-resized JPEG blob (EXIF-rotation aware). */
export async function compressImage(file: File, maxDim = MAX_DIM, quality = QUALITY): Promise<Blob> {
  const blob = file;

  let width = 0;
  let height = 0;
  let source: CanvasImageSource;

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    width = bitmap.width;
    height = bitmap.height;
    source = bitmap;
  } else {
    // very old browsers: <img> fallback
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Could not read that image"));
        el.src = url;
      });
      width = img.naturalWidth;
      height = img.naturalHeight;
      source = img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image");
  ctx.drawImage(source, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error("Could not compress that image"))),
      "image/jpeg",
      quality
    );
  });
}

/** Upload an already-processed JPEG blob (shared by upload + crop flows). */
export async function uploadPhotoBlob(userId: string, blob: Blob): Promise<string> {
  const sb = supabase();
  if (!sb) throw new Error("Photo uploads need the online version of Locora");

  const path = `${userId}/${(crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^a-z0-9-]/gi, "")}.jpg`;

  const { error } = await sb.storage
    .from("listing-photos")
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("row-level") || m.includes("policy") || m.includes("permission"))
      throw new Error("Upload not allowed — try signing in again");
    if (m.includes("size") || m.includes("exceeded") || m.includes("too large"))
      throw new Error("That image is too large after processing — try another");
    if (m.includes("duplicate") || m.includes("exists"))
      throw new Error("Upload hiccup — please try again");
    throw new Error("Upload failed — please try again");
  }

  const { data } = sb.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

export type CropArea = { x: number; y: number; width: number; height: number };

/** Crop a region from an image URL and return a compressed JPEG blob. */
export async function cropToBlob(url: string, area: CropArea, maxDim = MAX_DIM, quality = QUALITY): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not read that image"));
    el.src = url;
  });

  const scale = Math.min(1, maxDim / Math.max(area.width, area.height));
  const w = Math.max(1, Math.round(area.width * scale));
  const h = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error("Could not crop that image"))),
      "image/jpeg",
      quality
    );
  });
}

/** Compress + upload one photo, returning its public URL. */
export async function uploadListingPhoto(userId: string, file: File): Promise<string> {
  const sb = supabase();
  if (!sb) throw new Error("Photo uploads need the online version of Locora");

  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 25 * 1024 * 1024) throw new Error("That image is too large (max 25 MB)");

  const blob = await compressImage(file);
  return uploadPhotoBlob(userId, blob);
}
