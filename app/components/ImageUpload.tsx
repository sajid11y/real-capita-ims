"use client";

import { ChangeEvent, DragEvent, ClipboardEvent, useId, useRef, useState } from "react";
import { FileText, ImagePlus, Loader2, Trash2, Upload, Eye } from "lucide-react";

type ImageUploadProps = {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  maxSizeMB?: number;
  allowPdf?: boolean;
  compact?: boolean;
};

/** Opens an image or PDF stored as a data URL in a new browser tab. */
export function openAttachment(dataUrl: string) {
  try {
    const [head, body] = dataUrl.split(",");
    const mime = head.match(/:(.*?);/)?.[1] ?? "application/octet-stream";
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(url, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    /* ignore a broken attachment */
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("read")));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

/** Resizes and compresses an image so browser storage does not fill up. */
function compressImage(file: File, maxDim = 1000, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("read"));
    };
    img.src = url;
  });
}

export default function ImageUpload({
  value = "",
  onChange,
  label = "Image",
  helperText = "PNG, JPG or WEBP · max 5 MB",
  disabled = false,
  maxSizeMB = 5,
  allowPdf = false,
  compact = false,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const isPdf = value.startsWith("data:application/pdf");

  async function processFile(file: File | undefined | null) {
    if (!file || disabled) return;

    const pdf = file.type === "application/pdf";
    if (pdf && !allowPdf) {
      setError("PDF files are not accepted here.");
      return;
    }
    if (!pdf && !file.type.startsWith("image/")) {
      setError(allowPdf ? "Select an image or a PDF file." : "Select an image file.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be smaller than ${maxSizeMB} MB.`);
      return;
    }
    if (pdf && file.size > 1.5 * 1024 * 1024) {
      setError("PDF must be 1.5 MB or smaller in this browser demo.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      onChange(pdf ? await readAsDataUrl(file) : await compressImage(file));
    } catch {
      setError("Could not read this file. Please try another one.");
    } finally {
      setBusy(false);
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void processFile(file);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    void processFile(event.dataTransfer.files?.[0]);
  }

  function handlePaste(event: ClipboardEvent<HTMLElement>) {
    const item = Array.from(event.clipboardData.items).find((i) => i.kind === "file");
    if (item) {
      event.preventDefault();
      void processFile(item.getAsFile());
    }
  }

  const dropProps = {
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      if (!disabled) setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: handleDrop,
  };

  const thumb = compact ? "h-14 w-14" : "h-20 w-20";

  return (
    <div className="space-y-2" onPaste={handlePaste}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {value ? (
        <div
          {...dropProps}
          className={`flex items-center gap-3 rounded-2xl border bg-slate-50 p-3 transition ${
            dragging ? "border-blue-400 bg-blue-50" : "border-slate-200"
          }`}
        >
          {isPdf ? (
            <div className={`flex ${thumb} shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-600`}>
              <FileText size={compact ? 22 : 30} />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Attached preview"
              className={`${thumb} shrink-0 rounded-xl border border-slate-200 bg-white object-cover`}
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">{isPdf ? "PDF attached" : "Image attached"}</p>
            <p className="text-xs text-slate-500">~{Math.round((value.length * 3) / 4 / 1024)} KB</p>
            <div className="mt-1.5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openAttachment(value)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <Eye size={13} /> View
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Upload size={13} /> Replace
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange("");
              setError("");
            }}
            className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
            aria-label="Remove file"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          {...dropProps}
          tabIndex={0}
          className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4 outline-none transition focus:ring-2 focus:ring-blue-100 ${
            dragging ? "scale-[1.01] border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
          } ${disabled || busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            {busy ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-700">
              {busy ? "Processing..." : dragging ? "Drop it here" : allowPdf ? "Upload image or PDF" : "Upload image"}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              {compact ? helperText : `${helperText} · drag & drop or paste (Ctrl+V)`}
            </span>
          </span>
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={allowPdf ? "image/png,image/jpeg,image/webp,application/pdf" : "image/png,image/jpeg,image/webp"}
        onChange={handleInput}
        disabled={disabled || busy}
        className="sr-only"
      />

      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}