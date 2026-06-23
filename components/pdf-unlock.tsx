"use client";

import { useCallback, useRef, useState } from "react";

import {
  InvalidPdfError,
  WrongPasswordError,
  inspectPdf,
  unlockPdf,
  type PdfProtection,
} from "@/lib/pdf/unlock";

type Phase = "idle" | "inspecting" | "ready" | "working" | "done";

type Result = { url: string; name: string; size: number };

function outputName(name: string) {
  const base = name.replace(/\.pdf$/i, "");
  return `${base} - unlocked.pdf`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfUnlock() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [protection, setProtection] = useState<PdfProtection | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    if (result) URL.revokeObjectURL(result.url);
    setPhase("idle");
    setFileName("");
    setBytes(null);
    setProtection(null);
    setPassword("");
    setError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [result]);

  const handleFile = useCallback(
    async (file: File) => {
      if (result) URL.revokeObjectURL(result.url);
      setResult(null);
      setError("");
      setPassword("");
      setFileName(file.name);
      setPhase("inspecting");

      try {
        const buffer = new Uint8Array(await file.arrayBuffer());
        setBytes(buffer);
        const state = await inspectPdf(buffer);
        setProtection(state);
        setPhase("ready");
      } catch (err) {
        setProtection(null);
        setBytes(null);
        setPhase("idle");
        setError(
          err instanceof InvalidPdfError
            ? err.message
            : "Gagal membaca file. Pastikan ini berkas PDF.",
        );
      }
    },
    [result],
  );

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleUnlock = useCallback(async () => {
    if (!bytes) return;
    setError("");
    setPhase("working");

    try {
      const out = await unlockPdf(bytes, password);
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const name = outputName(fileName || "document.pdf");

      // Trigger the download immediately; the link stays available too.
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = name;
      anchor.click();

      setResult({ url, name, size: blob.size });
      setPhase("done");
    } catch (err) {
      setPhase("ready");
      if (err instanceof WrongPasswordError) {
        setError("Password salah. Coba lagi.");
      } else if (err instanceof InvalidPdfError) {
        setError(err.message);
      } else {
        setError("Gagal membuka PDF. Coba file lain.");
        console.error(err);
      }
    }
  }, [bytes, password, fileName]);

  const needsPassword = protection === "password-required";
  const canSubmit =
    phase === "ready" && (!needsPassword || password.length > 0);

  return (
    <div className="paper-panel tool-panel">
      <span className="icon-badge" aria-hidden>
        🔓
      </span>
      <h2 className="panel-title">Buka Password PDF</h2>
      <p className="panel-copy">
        Hapus password dan batasan dari PDF milikmu. Semua proses berjalan di
        dalam browser ini — file <strong>tidak pernah diunggah</strong> ke
        server mana pun.
      </p>

      {phase === "idle" || phase === "inspecting" ? (
        <label
          className={`dropzone${dragging ? " dropzone-active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="field-hidden"
            onChange={onInputChange}
            disabled={phase === "inspecting"}
          />
          <span className="dropzone-icon" aria-hidden>
            📄
          </span>
          <span className="dropzone-title">
            {phase === "inspecting"
              ? "Membaca file…"
              : "Tarik PDF ke sini atau klik untuk pilih"}
          </span>
          <span className="dropzone-hint">
            File diproses lokal di perangkatmu
          </span>
        </label>
      ) : (
        <div className="form-stack">
          <div className="file-row">
            <div className="file-row-main">
              <span className="file-row-name">{fileName}</span>
              <span className="file-row-status">
                {protection === "password-required" &&
                  "Terkunci — butuh password untuk dibuka"}
                {protection === "restricted" &&
                  "Terbuka, tapi ada batasan (print/copy/edit) yang bisa dihapus"}
                {protection === "open" &&
                  "Tidak terkunci — bisa di-resave bersih tanpa enkripsi"}
              </span>
            </div>
            <button type="button" className="chip-link" onClick={reset}>
              Ganti file
            </button>
          </div>

          {needsPassword && phase !== "done" && (
            <label className="field">
              <span>Password PDF</span>
              <input
                type="password"
                autoFocus
                value={password}
                placeholder="Masukkan password untuk membuka"
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canSubmit) void handleUnlock();
                }}
              />
            </label>
          )}

          {phase !== "done" && (
            <button
              type="button"
              className="button-main"
              disabled={!canSubmit}
              onClick={() => void handleUnlock()}
            >
              {phase === "working"
                ? "Memproses…"
                : needsPassword
                  ? "Buka & hapus password"
                  : "Hapus batasan & simpan bersih"}
            </button>
          )}

          {phase === "done" && result && (
            <div className="success-note tool-success">
              <p className="tool-success-title">PDF berhasil dibuka ✓</p>
              <p className="tool-success-copy">
                Unduhan dimulai otomatis. Kalau terlewat, klik di bawah.
              </p>
              <div className="tool-success-actions">
                <a className="button-main" href={result.url} download={result.name}>
                  Unduh {result.name} ({formatSize(result.size)})
                </a>
                <button type="button" className="chip-link" onClick={reset}>
                  Buka PDF lain
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="tool-error">{error}</p>}
    </div>
  );
}
