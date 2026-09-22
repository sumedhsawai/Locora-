"use client";

/* ------------------------------------------------------------------ */
/*  Locora — photo picker                                             */
/*  Real mode: upload photos from the device (compressed client-side  */
/*  and stored in Supabase Storage, `listing-photos` bucket).         */
/*  Mock/demo mode: pick from the app's demo photo library.           */
/* ------------------------------------------------------------------ */

import * as React from "react";
import { Camera, Check, ImagePlus, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { useToast } from "@/lib/store";
import { uploadListingPhoto, uploadPhotoBlob } from "@/lib/photos";
import { PhotoEditor } from "@/components/photo-editor";

/** Hidden native file input + trigger button. */
export function usePhotoLibrary(products: { images: string[] }[], services: { images: string[] }[]) {
  return React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.images.forEach((i) => set.add(i)));
    services.forEach((s) => s.images.forEach((i) => set.add(i)));
    return [...set];
  }, [products, services]);
}

function UploadButton({
  onFiles,
  busy,
  label = "Upload photos",
  className,
}: {
  onFiles: (files: File[]) => void;
  busy: boolean;
  label?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ""; // allow re-picking the same file
          if (files.length) onFiles(files);
        }}
      />
      <button type="button" onClick={() => ref.current?.click()} className={className} disabled={busy}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        {busy ? "Uploading…" : label}
      </button>
    </>
  );
}

/**
 * Upload pipeline for the create flows: picked photos go through the
 * adjust editor (ratio + zoom, "Original" keeps the full photo), then are
 * compressed and uploaded to Storage, appending public URLs progressively.
 */
export function usePhotoUpload(userId: string | null | undefined) {
  const { push } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [queue, setQueue] = React.useState<{
    files: File[];
    index: number;
    selected: string[];
    onChange: (next: string[]) => void;
    max: number;
    added: string[];
  } | null>(null);

  const upload = React.useCallback(
    (files: File[], selected: string[], onChange: (next: string[]) => void, max = 4) => {
      if (!userId) {
        push({ kind: "error", title: "Sign in to upload photos" });
        return;
      }
      const room = max - selected.length;
      if (room <= 0) {
        push({ kind: "info", title: "Photo limit reached", body: `You can attach up to ${max} photos.` });
        return;
      }
      const list = files.slice(0, room);
      if (list.length < files.length)
        push({ kind: "info", title: `Adding the first ${list.length}`, body: `Up to ${max} photos per listing.` });
      setQueue({ files: list, index: 0, selected, onChange, max, added: [] });
    },
    [userId, push]
  );

  const finishOne = React.useCallback(
    async (blob: Blob | null) => {
      if (!queue || !userId) return;
      const file = queue.files[queue.index];
      const { selected, onChange, added, index, files } = queue;

      setBusy(true);
      let url: string | null = null;
      try {
        url = blob ? await uploadPhotoBlob(userId, blob) : await uploadListingPhoto(userId, file);
      } catch (e) {
        push({
          kind: "error",
          title: "Photo upload failed",
          body: e instanceof Error ? e.message : "Please try again",
        });
      }
      const nextAdded = url ? [...added, url] : added;
      if (url) onChange([...selected, ...nextAdded]); // progressive thumbnails
      setBusy(false);

      if (index + 1 < files.length) {
        setQueue({ ...queue, index: index + 1, added: nextAdded });
      } else {
        setQueue(null); // queue complete
      }
    },
    [queue, userId, push]
  );

  const editorNode = queue ? (
    <PhotoEditor
      key={`${queue.index}-${queue.files[queue.index].name}-${queue.files[queue.index].size}`}
      file={queue.files[queue.index]}
      index={queue.index}
      total={queue.files.length}
      onDone={(blob) => void finishOne(blob)}
      onCancel={() => setQueue(null)}
    />
  ) : null;

  return { upload, busy: busy || !!queue, editorNode };
}

export function PhotoPicker({
  open,
  onClose,
  library,
  selected,
  onChange,
  max = 4,
  title = "Add photos",
  onUploadFiles,
  uploading,
}: {
  open: boolean;
  onClose: () => void;
  library: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  title?: string;
  onUploadFiles?: (files: File[]) => void;
  uploading?: boolean;
}) {
  const toggle = (img: string) => {
    if (selected.includes(img)) onChange(selected.filter((s) => s !== img));
    else if (selected.length < max) onChange([...selected, img]);
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      <h2 className="text-[17px] font-extrabold text-ink-900">{title}</h2>
      <p className="mt-1 text-[13px] text-ink-500">
        Pick up to {max} photos {selected.length > 0 && `(${selected.length}/${max} selected)`}
        {selected.length === 0 && "— or publish with a category placeholder"}
      </p>
      {onUploadFiles && (
        <UploadButton
          onFiles={onUploadFiles}
          busy={!!uploading}
          label="Upload from your device"
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[13px] font-bold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"
        />
      )}
      <div className="mt-4 grid max-h-[340px] grid-cols-3 gap-2.5 overflow-y-auto thin-scrollbar sm:grid-cols-4">
        {library.map((img) => {
          const on = selected.includes(img);
          const idx = selected.indexOf(img);
          return (
            <button
              key={img}
              onClick={() => toggle(img)}
              className={`group relative aspect-square overflow-hidden rounded-xl ring-2 transition ${
                on ? "ring-brand-600" : "ring-transparent hover:ring-stone-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
              <span
                className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold transition ${
                  on ? "bg-brand-600 text-white" : "bg-white/80 text-transparent opacity-0 group-hover:opacity-100"
                }`}
              >
                <Check size={11} strokeWidth={3} />
              </span>
              {on && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                  {idx + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white shadow-soft transition hover:bg-brand-700"
      >
        <ImagePlus size={16} /> Done
      </button>
    </Modal>
  );
}

export function PhotoStrip({
  images,
  onAdd,
  onRemove,
  placeholder = "📦",
  onUploadFiles,
  uploading,
}: {
  images: string[];
  onAdd: () => void;
  onRemove: (img: string) => void;
  placeholder?: string;
  onUploadFiles?: (files: File[]) => void;
  uploading?: boolean;
}) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
      {images.map((img) => (
        <div key={img} className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="h-20 w-24 rounded-xl bg-stone-50 object-contain ring-1 ring-stone-200" />
          <button
            onClick={() => onRemove(img)}
            aria-label="Remove photo"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-[10px] font-extrabold text-white shadow-soft transition hover:bg-rose-600"
          >
            ✕
          </button>
        </div>
      ))}
      {onUploadFiles && images.length < 4 && (
        <UploadButton
          onFiles={onUploadFiles}
          busy={!!uploading}
          label="Upload"
          className="flex h-20 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/60 text-brand-600 transition hover:border-brand-500 hover:bg-brand-50 disabled:opacity-60 [&>span]:hidden"
        />
      )}
      {images.length < 4 && (
        <button
          onClick={onAdd}
          className="flex h-20 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 text-stone-400 transition hover:border-brand-400 hover:text-brand-600"
        >
          <ImagePlus size={18} />
          <span className="text-[10.5px] font-bold">Add photo</span>
        </button>
      )}
    </div>
  );
}
