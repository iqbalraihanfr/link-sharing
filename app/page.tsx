import { PdfUnlock } from "@/components/pdf-unlock";

const upcomingTools = [
  {
    icon: "🗜️",
    name: "Kompres PDF",
    desc: "Perkecil ukuran file tanpa kirim ke server.",
  },
  {
    icon: "🔗",
    name: "Gabung PDF",
    desc: "Satukan beberapa PDF jadi satu dokumen.",
  },
  {
    icon: "✂️",
    name: "Pisah / Ambil Halaman",
    desc: "Pecah PDF atau ambil halaman tertentu.",
  },
  {
    icon: "🖼️",
    name: "Gambar → PDF",
    desc: "Ubah JPG/PNG jadi satu PDF rapi.",
  },
  {
    icon: "📑",
    name: "PDF → Gambar",
    desc: "Render tiap halaman jadi PNG.",
  },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="hero-copy">
        <p className="eyebrow">PDF toolkit · 100% lokal</p>
        <h1 className="hero-title">Alat PDF yang jalan di perangkatmu</h1>
        <p className="hero-text">
          Buka password, kompres, gabung, dan ubah PDF tanpa mengunggah apa pun.
          Semua diproses di dalam browser memakai WebAssembly — datamu tidak
          pernah keluar dari komputer ini.
        </p>
        <p className="hero-helper">
          <strong>Privat by design.</strong> Tidak ada upload, tidak ada akun,
          tidak ada layanan pihak ketiga seperti iLovePDF.
        </p>
      </header>

      <PdfUnlock />

      <section>
        <div className="section-header">
          <div>
            <p className="eyebrow">Segera hadir</p>
            <h2 className="section-title">Alat lainnya</h2>
          </div>
        </div>
        <div className="tool-grid">
          {upcomingTools.map((tool) => (
            <article key={tool.name} className="tool-card tool-card-soon">
              <span className="icon-badge" aria-hidden>
                {tool.icon}
              </span>
              <h3 className="tool-card-name">{tool.name}</h3>
              <p className="tool-card-desc">{tool.desc}</p>
              <span className="tool-card-badge">Segera</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
