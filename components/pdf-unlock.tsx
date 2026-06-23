"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { inspectPdf, unlockPdf } from "@/lib/pdf/pdf-worker-client";
import {
  InvalidPdfError,
  WrongPasswordError,
  type PdfProtection,
} from "@/lib/pdf/unlock";
import { makeZip } from "@/lib/pdf/zip";

type Status = "inspecting" | "ready" | "working" | "done" | "error";

type Entry = {
  id: string;
  name: string;
  bytes: Uint8Array;
  protection: PdfProtection | null;
  status: Status;
  message?: string;
  password: string; // per-file override
  result?: { url: string; name: string; bytes: Uint8Array; size: number };
};

function outputName(name: string) {
  return `${name.replace(/\.pdf$/i, "")} - unlocked.pdf`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file: File) {
  return /\.pdf$/i.test(file.name) || file.type === "application/pdf";
}

function statusLabel(entry: Entry): string {
  switch (entry.status) {
    case "inspecting":
      return "Memeriksa…";
    case "working":
      return "Memproses…";
    case "done":
      return "Selesai ✓";
    case "error":
      return entry.message ?? "Gagal";
    case "ready":
      if (entry.protection === "password-required") return "Terkunci 🔒";
      if (entry.protection === "restricted") return "Ada batasan";
      return "Tanpa proteksi";
  }
}

export function PdfUnlock() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sharedPassword, setSharedPassword] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const patch = useCallback((id: string, partial: Partial<Entry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...partial } : entry)),
    );
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const pdfs = files.filter(isPdf);
      if (pdfs.length === 0) return;

      const created: Entry[] = pdfs.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        bytes: new Uint8Array(),
        protection: null,
        status: "inspecting",
        password: "",
      }));
      setEntries((prev) => [...prev, ...created]);

      await Promise.all(
        pdfs.map(async (file, index) => {
          const { id } = created[index];
          try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const protection = await inspectPdf(bytes);
            patch(id, { bytes, protection, status: "ready" });
          } catch (err) {
            patch(id, {
              status: "error",
              message:
                err instanceof InvalidPdfError
                  ? err.message
                  : "Gagal membaca file.",
            });
          }
        }),
      );
    },
    [patch],
  );

  const processOne = useCallback(
    async (entry: Entry, password: string) => {
      patch(entry.id, { status: "working", message: undefined });
      try {
        const out = await unlockPdf(entry.bytes, password);
        const blob = new Blob([out as BlobPart], { type: "application/pdf" });
        patch(entry.id, {
          status: "done",
          result: {
            url: URL.createObjectURL(blob),
            name: outputName(entry.name),
            bytes: out,
            size: blob.size,
          },
        });
      } catch (err) {
        let message = "Gagal membuka PDF.";
        if (err instanceof WrongPasswordError) message = "Password salah.";
        else if (err instanceof InvalidPdfError) message = err.message;
        patch(entry.id, { status: "error", message });
      }
    },
    [patch],
  );

  const runAll = useCallback(async () => {
    setBusy(true);
    const targets = entries.filter(
      (entry) => entry.status === "ready" || entry.status === "error",
    );
    for (const entry of targets) {
      const password = entry.password || sharedPassword;
      if (entry.protection === "password-required" && !password) {
        patch(entry.id, { status: "error", message: "Masukkan password dulu." });
        continue;
      }
      await processOne(entry, password);
    }
    setBusy(false);
  }, [entries, sharedPassword, patch, processOne]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const target = prev.find((entry) => entry.id === id);
      if (target?.result) URL.revokeObjectURL(target.result.url);
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setEntries((prev) => {
      prev.forEach((entry) => {
        if (entry.result) URL.revokeObjectURL(entry.result.url);
      });
      return [];
    });
    setSharedPassword("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      if (files.length) void addFiles(files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [addFiles],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragging(false);
      const files = event.dataTransfer.files
        ? Array.from(event.dataTransfer.files)
        : [];
      if (files.length) void addFiles(files);
    },
    [addFiles],
  );

  const doneEntries = useMemo(
    () => entries.filter((entry) => entry.status === "done" && entry.result),
    [entries],
  );

  const downloadZip = useCallback(() => {
    const zip = makeZip(
      doneEntries.map((entry) => ({
        name: entry.result!.name,
        bytes: entry.result!.bytes,
      })),
    );
    const blob = new Blob([zip as BlobPart], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "unlocked-pdfs.zip";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, [doneEntries]);

  const lockedCount = entries.filter(
    (entry) => entry.protection === "password-required",
  ).length;
  const pending = entries.some(
    (entry) => entry.status === "ready" || entry.status === "error",
  );
  const hasEntries = entries.length > 0;

  return (
    <div className="paper-panel tool-panel">
      <span className="icon-badge" aria-hidden>
        🔓
      </span>
      <h2 className="panel-title">Buka Password PDF</h2>
      <p className="panel-copy">
        Hapus password dan batasan dari satu atau banyak PDF sekaligus. Semua
        proses berjalan di dalam browser ini — file{" "}
        <strong>tidak pernah diunggah</strong> ke server mana pun.
      </p>

      <label
        className={`dropzone${dragging ? " dropzone-active" : ""}${
          hasEntries ? " dropzone-compact" : ""
        }`}
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
          multiple
          className="field-hidden"
          onChange={onInputChange}
        />
        <span className="dropzone-icon" aria-hidden>
          📄
        </span>
        <span className="dropzone-title">
          {hasEntries
            ? "Tambah PDF lain"
            : "Tarik PDF ke sini atau klik untuk pilih"}
        </span>
        <span className="dropzone-hint">
          Bisa pilih banyak file · diproses lokal di perangkatmu
        </span>
      </label>

      {hasEntries && (
        <div className="form-stack">
          <label className="field">
            <span>
              Password {lockedCount > 0 ? `(untuk ${lockedCount} file terkunci)` : "(opsional)"}
            </span>
            <input
              type="password"
              value={sharedPassword}
              placeholder="Dipakai untuk semua file yang terkunci"
              onChange={(event) => setSharedPassword(event.target.value)}
            />
          </label>

          <ul className="file-list">
            {entries.map((entry) => (
              <li key={entry.id} className={`file-item file-item-${entry.status}`}>
                <div className="file-item-info">
                  <span className="file-row-name">{entry.name}</span>
                  <span className={`file-badge file-badge-${entry.status}`}>
                    {statusLabel(entry)}
                  </span>
                </div>

                <div className="file-item-actions">
                  {entry.status === "done" && entry.result && (
                    <a
                      className="chip-link"
                      href={entry.result.url}
                      download={entry.result.name}
                    >
                      Unduh ({formatSize(entry.result.size)})
                    </a>
                  )}
                  {entry.status === "error" &&
                    entry.protection === "password-required" && (
                      <input
                        type="password"
                        className="file-pw-input"
                        placeholder="Password file ini"
                        value={entry.password}
                        onChange={(event) =>
                          patch(entry.id, { password: event.target.value })
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && entry.password) {
                            void processOne(entry, entry.password);
                          }
                        }}
                      />
                    )}
                  {entry.status === "error" && (
                    <button
                      type="button"
                      className="chip-link"
                      onClick={() =>
                        void processOne(
                          entry,
                          entry.password || sharedPassword,
                        )
                      }
                    >
                      Coba lagi
                    </button>
                  )}
                  <button
                    type="button"
                    className="file-remove"
                    aria-label={`Hapus ${entry.name}`}
                    onClick={() => removeEntry(entry.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="batch-actions">
            <button
              type="button"
              className="button-main"
              disabled={busy || !pending}
              onClick={() => void runAll()}
            >
              {busy
                ? "Memproses…"
                : entries.length > 1
                  ? `Buka semua (${entries.length})`
                  : "Buka & hapus password"}
            </button>

            {doneEntries.length > 1 && (
              <button type="button" className="chip-link" onClick={downloadZip}>
                Unduh semua (ZIP)
              </button>
            )}

            <button type="button" className="chip-link" onClick={clearAll}>
              Bersihkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
