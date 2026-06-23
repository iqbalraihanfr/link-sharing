// Runs mupdf off the main thread so the UI stays responsive while decrypting,
// even for large files or whole batches. One persistent worker keeps the 10 MB
// wasm engine loaded once and processes requests sequentially.

import { inspectPdf, unlockPdf } from "./unlock";

type Incoming =
  | { id: number; kind: "inspect"; bytes: ArrayBuffer }
  | { id: number; kind: "unlock"; bytes: ArrayBuffer; password: string };

// Minimal worker-scope typing so we don't pull in the webworker lib (which
// conflicts with the dom lib used by the rest of the app).
type WorkerScope = {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<Incoming>) => void,
  ): void;
};

const ctx = self as unknown as WorkerScope;

ctx.addEventListener("message", async (event: MessageEvent<Incoming>) => {
  const msg = event.data;

  try {
    if (msg.kind === "inspect") {
      const protection = await inspectPdf(new Uint8Array(msg.bytes));
      ctx.postMessage({ id: msg.id, ok: true, protection });
    } else {
      const out = await unlockPdf(new Uint8Array(msg.bytes), msg.password);
      const buffer = out.buffer as ArrayBuffer;
      ctx.postMessage({ id: msg.id, ok: true, bytes: buffer }, [buffer]);
    }
  } catch (err) {
    const error = err as Error;
    ctx.postMessage({
      id: msg.id,
      ok: false,
      error: {
        name: error?.name ?? "Error",
        message: error?.message ?? String(err),
      },
    });
  }
});
