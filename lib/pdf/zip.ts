import { zipSync } from "fflate";

// Bundle several PDFs into one .zip, entirely in memory. PDFs are already
// compressed, so we store (level 0) — fast and no quality loss. fflate is pure
// JS and bundled locally, so this stays offline-friendly like everything else.
export function makeZip(files: { name: string; bytes: Uint8Array }[]): Uint8Array {
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
  const used = new Set<string>();

  for (const file of files) {
    let name = file.name;
    if (used.has(name)) {
      const dot = name.lastIndexOf(".");
      const stem = dot === -1 ? name : name.slice(0, dot);
      const ext = dot === -1 ? "" : name.slice(dot);
      let n = 2;
      while (used.has(`${stem} (${n})${ext}`)) n += 1;
      name = `${stem} (${n})${ext}`;
    }
    used.add(name);
    entries[name] = [file.bytes, { level: 0 }];
  }

  return zipSync(entries, { level: 0 });
}
