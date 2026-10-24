"use client";

import { ChangeEvent, useId, useState } from "react";
import { FileText, ImagePlus, Trash2, Upload } from "lucide-react";

type ImageUploadProps = {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  maxSizeMB?: number;
  allowPdf?: boolean;
};

/** Opens an image or PDF stored as a data URL in a new tab. */
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
    /* ignore broken attachment */
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("read"));
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
      const c = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!c) {
        reject(new Error("canvas"));
        return;
      }
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, w, h);
      c.drawImage(img, 0, 0, w, h);
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
  label = "Image / document photo",
  helperText = "PNG, JPG or WEBP · max 5 MB",
  disabled = false,
  maxSizeMB = 5,
  allowPdf = false,
}: ImageUploadProps) {
  const inputId = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isPdf = value.startsWith("data:application/pdf");

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const pdf = file.type === "application/pdf";
    if (pdf && !allowPdf) {
      setError("PDF files are not accepted here.");
      return;
    }
    if (!pdf && !file.type.startsWith("image/")) {
      setError(allowPdf ? "Select an image or PDF file." : "Select an image file.");
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
  };

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {isPdf ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-600">
              <FileText size={30} />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Uploaded preview"
              className="h-20 w-20 rounded-xl border border-slate-200 bg-white object-cover"
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">{isPdf ? "PDF attached" : "Image attached"}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openAttachment(value)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                View
              </button>
              {!disabled && (
                <label
                  htmlFor={inputId}
                  className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Upload size={14} />
                  Replace
                </label>
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
            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
            aria-label="Remove file"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-blue-400 hover:bg-blue-50/50 ${
            disabled || busy ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <ImagePlus size={20} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-700">
              {busy ? "Processing..." : allowPdf ? "Upload image or PDF" : "Upload image"}
            </span>
            <span className="mt-1 block text-xs text-slate-500">{helperText}</span>
          </span>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept={allowPdf ? "image/png,image/jpeg,image/webp,application/pdf" : "image/png,image/jpeg,image/webp"}
        onChange={handleFile}
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