"use client";

import * as React from "react";
import Cropper from "react-easy-crop";
import { Check, Crop as CropIcon, Expand, Loader2, Maximize2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { cropToBlob, type CropArea } from "@/lib/photos";

/* ------------------------------------------------------------------ */
/*  Locora — photo adjust editor                                       */
/*  Instagram-style: pinch/drag the photo, pick a ratio (or keep the   */
/*  full original), then it's cropped + compressed + uploaded.         */
/* ------------------------------------------------------------------ */

const RATIOS: { id: string; label: string; value: number | null; hint: string }[] = [
  { id: "original", label: "Original", value: null, hint: "Keeps the whole photo — nothing is cut" },
  { id: "square", label: "1:1", value: 1, hint: "Square — great for feed cards" },
  { id: "wide", label: "4:3", value: 4 / 3, hint: "Classic listing shot" },
  { id: "portrait", label: "3:4", value: 3 / 4, hint: "Portrait" },
  { id: "tall", label: "9:16", value: 9 / 16, hint: "Story-style tall" },
];

export function PhotoEditor({
  file,
  index,
  total,
  onDone,
  onCancel,
}: {
  file: File;
  index: number; // 0-based
  total: number;
  onDone: (blob: Blob | null) => void; // null → upload the original, uncropped
  onCancel: () => void;
}) {
  const [url] = React.useState(() => URL.createObjectURL(file));
  const [ratio, setRatio] = React.useState<number | null>(null); // default: keep full photo
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [area, setArea] = React.useState<CropArea | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (ratio === null || !area) {
        onDone(null); // original file as-is (compression still applies)
      } else {
        const blob = await cropToBlob(url, area);
        onDone(blob);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  };

  const active = RATIOS.find((r) => r.value === ratio) ?? RATIOS[0];

  return (
    <Modal open onClose={onCancel} className="max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold text-ink-900">Adjust photo</h2>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-ink-500">
          {index + 1} of {total}
        </span>
      </div>

      {/* crop stage */}
      <div className="relative mt-3 h-64 overflow-hidden rounded-2xl bg-ink-950 sm:h-72">
        <Cropper
          image={url}
          crop={crop}
          zoom={zoom}
          aspect={ratio ?? 4 / 3}
          cropShape="rect"
          showGrid
          restrictPosition={ratio !== null}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_a, pixels) => setArea(pixels)}
        />
        {ratio === null && (
          <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-ink-700 shadow-soft">
            <Maximize2 size={11} className="mr-1 inline" /> Full photo will be kept
          </span>
        )}
      </div>

      {/* zoom slider */}
      <div className="mt-3 flex items-center gap-3 px-1">
        <Expand size={13} className="shrink-0 text-ink-300" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1.5 w-full accent-brand-600"
          aria-label="Zoom"
        />
      </div>

      {/* ratio chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {RATIOS.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setRatio(r.value);
              setArea(null);
            }}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
              ratio === r.value
                ? "bg-brand-600 text-white shadow-soft"
                : "bg-stone-100 text-ink-600 hover:bg-stone-200"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11.5px] font-medium text-ink-400">{active.hint}</p>

      {error && (
        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onCancel}
          className="h-11 flex-1 rounded-xl bg-stone-100 text-[13px] font-bold text-ink-600 transition hover:bg-stone-200"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-brand-600 text-[13px] font-bold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {saving ? "Processing…" : index + 1 < total ? "Save & next photo" : "Save photo"}
        </button>
      </div>
      <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] font-medium text-ink-400">
        <CropIcon size={11} /> Pinch or drag to position · any size photo is always accepted
      </p>
    </Modal>
  );
}
