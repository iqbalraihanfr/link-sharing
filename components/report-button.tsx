"use client";

import { useState } from "react";

import { FlagIcon } from "@/components/icons";

export function ReportButton({ profileId }: { profileId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function handleReport() {
    setState("loading");
    setError("");

    const response = await fetch(`/api/profiles/${profileId}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      setState("idle");
      setError(payload.error ?? "Tidak bisa mengirim report sekarang.");
      return;
    }

    setState("done");
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className="report-button"
        onClick={handleReport}
        disabled={state !== "idle"}
      >
        <FlagIcon className="h-4 w-4" />
        {state === "loading" ? "Reporting..." : state === "done" ? "Reported" : "Report"}
      </button>
      {error ? (
        <p className="text-right text-xs text-[var(--color-danger)]" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
