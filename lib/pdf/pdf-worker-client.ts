// Main-thread client for the PDF worker. Lazily spins up a single module
// worker, matches responses to requests by id, and rebuilds typed errors on
// this side so callers can `instanceof`-check them as if it were all local.

import {
  InvalidPdfError,
  WrongPasswordError,
  type PdfProtection,
} from "./unlock";

type WorkerResponse =
  | { id: number; ok: true; protection: PdfProtection }
  | { id: number; ok: true; bytes: ArrayBuffer }
  | { id: number; ok: false; error: { name: string; message: string } };

type Pending = {
  resolve: (value: WorkerResponse) => void;
  reject: (reason: Error) => void;
};

let worker: Worker | null = null;
let counter = 0;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./unlock.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      const entry = pending.get(data.id);
      if (!entry) return;
      pending.delete(data.id);

      if (data.ok) {
        entry.resolve(data);
        return;
      }

      const { name, message } = data.error;
      if (name === "WrongPasswordError") entry.reject(new WrongPasswordError());
      else if (name === "InvalidPdfError") entry.reject(new InvalidPdfError());
      else entry.reject(new Error(message || "Gagal memproses PDF."));
    });
  }

  return worker;
}

function request(
  message: Record<string, unknown>,
  transfer: Transferable[],
): Promise<WorkerResponse> {
  const id = ++counter;
  return new Promise<WorkerResponse>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, ...message }, transfer);
  });
}

export async function inspectPdf(bytes: Uint8Array): Promise<PdfProtection> {
  const buffer = bytes.slice().buffer as ArrayBuffer;
  const res = await request({ kind: "inspect", bytes: buffer }, [buffer]);
  if (!("protection" in res)) throw new Error("Respon worker tidak valid.");
  return res.protection;
}

export async function unlockPdf(
  bytes: Uint8Array,
  password: string,
): Promise<Uint8Array> {
  const buffer = bytes.slice().buffer as ArrayBuffer;
  const res = await request({ kind: "unlock", bytes: buffer, password }, [
    buffer,
  ]);
  if (!("bytes" in res)) throw new Error("Respon worker tidak valid.");
  return new Uint8Array(res.bytes);
}
