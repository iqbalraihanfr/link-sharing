"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      setPending(false);
      setError(payload.error ?? "Password admin salah.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form className="form-stack paper-panel max-w-lg" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Admin Access</p>
        <h1 className="panel-title">Moderation console</h1>
        <p className="panel-copy">
          Login ini hanya untuk moderasi status, report, dan merge duplikasi.
        </p>
      </div>

      <label className="field">
        <span>Password admin</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </label>

      <button className="button-main" type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Enter admin"}
      </button>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
    </form>
  );
}
