// Lazily loads the mupdf WebAssembly engine in the browser.
//
// Everything here runs client-side only. We load mupdf from the copy we
// self-host under /public/wasm rather than bundling it, so:
//   1. the engine and its wasm are fetched from this origin, never a CDN, and
//   2. the bundler never tries to inline mupdf's Node-only code paths.
//
// `import(specifier)` with a non-literal string is left as a native runtime
// dynamic import by the bundler, which is exactly what we want here.

type MupdfModule = typeof import("mupdf");

let mupdfPromise: Promise<MupdfModule> | null = null;

export function loadMupdf(): Promise<MupdfModule> {
  // `self` exists in both the main thread and Web Workers, but not in Node.
  if (typeof self === "undefined") {
    throw new Error("mupdf can only be loaded in the browser.");
  }

  if (!mupdfPromise) {
    // mupdf-wasm.js reads this global before instantiating. locateFile tells
    // Emscripten to grab the binary from our self-hosted /wasm/ path.
    (globalThis as Record<string, unknown>)["$libmupdf_wasm_Module"] = {
      locateFile: (path: string) => `/wasm/${path}`,
    };

    // The ignore comments keep the bundler from resolving this at build time,
    // leaving it as a native runtime import of our self-hosted copy. TS can't
    // resolve the absolute runtime URL, which is expected.
    mupdfPromise =
      // @ts-expect-error -- resolved at runtime from /public/wasm, not bundled.
      import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "/wasm/mupdf.js");
  }

  return mupdfPromise;
}
