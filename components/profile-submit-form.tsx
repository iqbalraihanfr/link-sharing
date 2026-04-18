"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { ShieldIcon, SparkIcon } from "@/components/icons";
import { TurnstileWidget } from "@/components/turnstile-widget";

interface SubmissionResult {
  displayName: string;
  instagramInput: string;
  linkedinInput: string;
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

    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName,
        instagramInput,
        linkedinInput,
        website: honeypot,
        turnstileToken: captchaToken,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      editUrl?: string;
      error?: string;
    };

    if (!response.ok || !payload.editUrl) {
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
      editUrl: payload.editUrl,
    });
    setDisplayName("");
    setInstagramInput("");
    setLinkedinInput("");
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
    <section className="paper-panel sticky top-6 overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Drop A Card</p>
          <h2 className="panel-title">Submit once, then keep the edit link.</h2>
        </div>
        <span className="icon-badge">
          <SparkIcon className="h-5 w-5" />
        </span>
      </div>

      <p className="panel-copy">
        Nama wajib. Instagram atau LinkedIn minimal satu. Kamu boleh isi handle
        atau full URL, nanti server yang rapikan ke tautan aman.
      </p>

      <form className="form-stack mt-6" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nama</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Contoh: Iqbal Rei"
            maxLength={80}
            required
            disabled={!databaseReady || pending}
          />
        </label>

        <label className="field">
          <span>Instagram</span>
          <input
            value={instagramInput}
            onChange={(event) => setInstagramInput(event.target.value)}
            placeholder="@username atau instagram.com/username"
            maxLength={120}
            disabled={!databaseReady || pending}
          />
        </label>

        <label className="field">
          <span>LinkedIn</span>
          <input
            value={linkedinInput}
            onChange={(event) => setLinkedinInput(event.target.value)}
            placeholder="linkedin.com/in/slug atau slug"
            maxLength={140}
            disabled={!databaseReady || pending}
          />
        </label>

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
        ) : (
          <div className="notice-strip">
            <ShieldIcon className="h-4 w-4" />
            Captcha belum dikonfigurasi di environment lokal ini. Submit tetap bisa
            diuji, tapi production sebaiknya mengaktifkan Turnstile.
          </div>
        )}

        <button className="button-main mt-2" type="submit" disabled={!databaseReady || pending}>
          {pending ? "Submitting..." : "Done"}
        </button>

        {!databaseReady ? (
          <p className="text-sm text-[var(--color-muted)]">
            `DATABASE_URL` belum diatur, jadi form ini masih terkunci sampai Postgres
            dikonfigurasi.
          </p>
        ) : null}

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
            Card for {result.displayName} is live.
          </h3>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Link edit ini cuma ditampilkan di sini. Simpan atau copy sekarang.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="chip-link chip-link-active" href={result.editUrl}>
              Open edit link
            </Link>
            <button type="button" className="chip-link" onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
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
