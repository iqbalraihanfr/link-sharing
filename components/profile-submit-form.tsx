"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { TurnstileWidget } from "@/components/turnstile-widget";

interface SubmissionResult {
  displayName: string;
  instagramInput: string;
  linkedinInput: string;
  githubInput: string;
  editUrl: string;
}

export function ProfileSubmitForm({
  databaseReady,
  turnstileSiteKey,
}: {
  databaseReady: boolean;
  turnstileSiteKey: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [instagramInput, setInstagramInput] = useState("");
  const [linkedinInput, setLinkedinInput] = useState("");
  const [githubInput, setGitHubInput] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setCopied(false);

    if (!databaseReady) {
      setPending(false);
      setError("Submit belum tersedia. Coba lagi beberapa saat lagi.");
      return;
    }

    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName,
        instagramInput,
        linkedinInput,
        githubInput,
        website: honeypot,
        turnstileToken: captchaToken,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      profileId?: string;
      editUrl?: string;
      error?: string;
    };

    if (!response.ok || !payload.editUrl || !payload.profileId) {
      setPending(false);
      setError(payload.error ?? "Submit belum berhasil. Coba lagi.");
      setCaptchaResetSignal((value) => value + 1);
      return;
    }

    setPending(false);
    setResult({
      displayName,
      instagramInput,
      linkedinInput,
      githubInput,
      editUrl: payload.editUrl,
    });

    try {
      const stored = localStorage.getItem("link_sharing_owned");
      const map = stored ? JSON.parse(stored) : {};
      map[payload.profileId] = payload.editUrl;
      localStorage.setItem("link_sharing_owned", JSON.stringify(map));
    } catch {}

    setDisplayName("");
    setInstagramInput("");
    setLinkedinInput("");
    setGitHubInput("");
    setHoneypot("");
    setCaptchaToken("");
    setCaptchaResetSignal((value) => value + 1);

    startTransition(() => {
      router.refresh();
    });
  }

  async function copyLink() {
    if (!result) return;

    await navigator.clipboard.writeText(result.editUrl);
    setCopied(true);
  }

  return (
    <section className="paper-panel hero-submit overflow-hidden">
      <div>
        <p className="eyebrow">Submit Card</p>
        <h2 className="panel-title">Masukkan link atau username kamu.</h2>
      </div>

      <p className="panel-copy">
        Nama wajib. Isi Instagram atau LinkedIn minimal satu. Handle atau full URL
        boleh, nanti sistem rapikan jadi link yang bisa langsung diklik.
      </p>

      <form className="form-stack mt-6" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nama</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Contoh: bandung bondowoso"
            maxLength={80}
            required
            disabled={pending}
          />
        </label>

        <div className="submit-grid">
          <label className="field">
            <span>Instagram</span>
            <input
              value={instagramInput}
              onChange={(event) => setInstagramInput(event.target.value)}
              placeholder="@username atau instagram.com/username"
              maxLength={120}
              disabled={pending}
            />
          </label>

          <label className="field">
            <span>LinkedIn</span>
            <input
              value={linkedinInput}
              onChange={(event) => setLinkedinInput(event.target.value)}
              placeholder="linkedin.com/in/slug atau slug"
              maxLength={140}
              disabled={pending}
            />
          </label>

          <label className="field">
            <span>GitHub</span>
            <input
              value={githubInput}
              onChange={(event) => setGitHubInput(event.target.value)}
              placeholder="github.com/username atau username"
              maxLength={80}
              disabled={pending}
            />
          </label>
        </div>

        <label className="field field-hidden" aria-hidden="true">
          <span>Website</span>
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </label>

        {turnstileSiteKey ? (
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            onTokenChange={setCaptchaToken}
            resetSignal={captchaResetSignal}
          />
        ) : null}

        <button className="button-main mt-2" type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan kartu"}
        </button>

        {error ? (
          <p className="text-sm text-[var(--color-danger)]" aria-live="polite">
            {error}
          </p>
        ) : null}
      </form>

      {result ? (
        <div className="success-note mt-6" aria-live="polite">
          <p className="eyebrow">Saved</p>
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">
            Card untuk {result.displayName} sudah aktif.
          </h3>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Edit link ini cuma muncul sekali di sini. Simpan sekarang.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="chip-link chip-link-active" href={result.editUrl}>
              Buka edit link
            </Link>
            <button type="button" className="chip-link" onClick={copyLink}>
              {copied ? "Tersalin" : "Copy link"}
            </button>
          </div>
          <p className="mt-3 break-all font-mono text-xs text-[var(--color-muted)]">
            {result.editUrl}
          </p>
        </div>
      ) : null}
    </section>
  );
}
