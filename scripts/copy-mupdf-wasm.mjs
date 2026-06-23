// Copies the mupdf engine into /public so the app can self-host it.
//
// The whole point of this toolkit is that PDFs never leave your machine, so we
// also never load the engine from a third-party CDN. The mupdf ESM glue and its
// wasm binary are served from our own /wasm/ path and imported at runtime,
// which also keeps the bundler from trying to inline mupdf's Node-only code.
//
// Runs automatically before `dev` and `build` (see package.json).

import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, "..");

const srcDir = join(projectRoot, "node_modules", "mupdf", "dist");
const destDir = join(projectRoot, "public", "wasm");

// mupdf.js imports "./mupdf-wasm.js", which fetches "mupdf-wasm.wasm" as a
// sibling — so all three must live together under /public/wasm.
const files = ["mupdf.js", "mupdf-wasm.js", "mupdf-wasm.wasm"];

await mkdir(destDir, { recursive: true });
for (const file of files) {
  await copyFile(join(srcDir, file), join(destDir, file));
}

console.log(`[copy-mupdf-wasm] copied ${files.join(", ")} -> ${destDir}`);
