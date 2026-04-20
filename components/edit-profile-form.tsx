"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PublicProfile } from "@/lib/types";

export function EditProfileForm({ profile }: { profile: PublicProfile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [instagramInput, setInstagramInput] = useState(profile.instagramHandle ?? "");
  const [linkedinInput, setLinkedinInput] = useState(profile.linkedinSlug ?? "");
  const [githubInput, setGitHubInput] = useState(profile.githubUsername ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const response = await fetch(`/api/profiles/${profile.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName,
        instagramInput,
        linkedinInput,
        githubInput,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      setPending(false);
      setError(payload.error ?? "Perubahan belum bisa disimpan.");
      return;
    }

    setPending(false);
    setSuccess("Perubahan tersimpan dan masa aktif kartu diperbarui.");
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("Hapus kartu ini permanen dari directory?")) return;

    setPending(true);
    setError("");

    const response = await fetch(`/api/profiles/${profile.id}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      setPending(false);
      setError(payload.error ?? "Kartu belum bisa dihapus.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="form-stack paper-panel" onSubmit={handleSave}>
      <div>
        <p className="eyebrow">Edit Card</p>
        <h2 className="panel-title">Perbarui profil tanpa login.</h2>
        <p className="panel-copy">
          Edit session ini hidup sementara melalui cookie HttpOnly. Simpan perubahan
          sebelum menutup browser.
        </p>
      </div>

      <label className="field">
        <span>Nama</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={80}
          required
          disabled={pending}
        />
      </label>

      <label className="field">
        <span>Instagram</span>
        <input
          value={instagramInput}
          onChange={(event) => setInstagramInput(event.target.value)}
          placeholder="@username"
          maxLength={120}
          disabled={pending}
        />
      </label>

      <label className="field">
        <span>LinkedIn</span>
        <input
          value={linkedinInput}
          onChange={(event) => setLinkedinInput(event.target.value)}
          placeholder="linkedin slug"
          maxLength={140}
          disabled={pending}
        />
      </label>

      <label className="field">
        <span>GitHub</span>
        <input
          value={githubInput}
          onChange={(event) => setGitHubInput(event.target.value)}
          placeholder="github username"
          maxLength={80}
          disabled={pending}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button className="button-main" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </button>
        <button className="chip-link" type="button" onClick={handleDelete} disabled={pending}>
          Delete card
        </button>
      </div>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      {success ? <p className="text-sm text-[var(--color-success)]">{success}</p> : null}
    </form>
  );
}
