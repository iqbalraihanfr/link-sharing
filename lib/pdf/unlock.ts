// PDF password removal — runs entirely in the browser via mupdf/wasm.
//
// Two kinds of PDF protection exist:
//   - user password   : required just to open the file (`needsPassword()`).
//   - owner password   : opens fine but restricts print/copy/edit (permissions).
//
// Given the correct password (or none, for owner-only restrictions), we re-save
// the document with encryption stripped, producing a clean, unrestricted PDF.

import { loadMupdf } from "./mupdf-loader";

export type PdfProtection =
  | "password-required" // needs a password to open
  | "restricted" // opens, but has owner restrictions worth removing
  | "open"; // no password and no restrictions

export class WrongPasswordError extends Error {
  constructor() {
    super("Password salah.");
    this.name = "WrongPasswordError";
  }
}

export class InvalidPdfError extends Error {
  constructor() {
    super("File ini tidak terbaca sebagai PDF yang valid.");
    this.name = "InvalidPdfError";
  }
}

const PERMISSIONS = ["print", "copy", "edit", "annotate"] as const;

// Inspect a PDF to decide what the UI should ask for. Throws InvalidPdfError
// when the bytes are not a parseable PDF.
export async function inspectPdf(bytes: Uint8Array): Promise<PdfProtection> {
  const mupdf = await loadMupdf();

  let doc;
  try {
    doc = mupdf.Document.openDocument(bytes.slice(), "application/pdf");
  } catch {
    throw new InvalidPdfError();
  }

  try {
    if (doc.needsPassword()) {
      return "password-required";
    }

    const restricted = PERMISSIONS.some((perm) => !doc.hasPermission(perm));
    return restricted ? "restricted" : "open";
  } finally {
    doc.destroy();
  }
}

// Decrypt the PDF and return clean, unrestricted bytes.
// `password` may be empty for owner-only (permissions) protected files.
export async function unlockPdf(
  bytes: Uint8Array,
  password: string,
): Promise<Uint8Array> {
  const mupdf = await loadMupdf();

  let doc;
  try {
    doc = mupdf.Document.openDocument(bytes.slice(), "application/pdf");
  } catch {
    throw new InvalidPdfError();
  }

  try {
    if (doc.needsPassword()) {
      const authenticated = doc.authenticatePassword(password);
      if (!authenticated) {
        throw new WrongPasswordError();
      }
    }

    const pdf = doc.asPDF();
    if (!pdf) {
      throw new InvalidPdfError();
    }

    // `decrypt` strips encryption; garbage collect + compress to keep it tidy.
    const buffer = pdf.saveToBuffer("decrypt,garbage=3,compress");
    try {
      // Copy out of the wasm-managed buffer before it is freed.
      return buffer.asUint8Array().slice();
    } finally {
      buffer.destroy();
    }
  } finally {
    doc.destroy();
  }
}
