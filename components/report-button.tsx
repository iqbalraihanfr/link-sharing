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

  const label =
    state === "loading" ? "Reporting..." : state === "done" ? "Reported" : "Report";

  return (
    <>
      <button
        type="button"
        className={`report-icon-button ${state === "done" ? "report-icon-done" : ""}`}
        onClick={handleReport}
        disabled={state !== "idle"}
        title={label}
        aria-label={label}
      >
        <FlagIcon className="report-icon-svg" />
      </button>
      {error ? (
        <p className="report-error-tooltip" aria-live="polite">
          {error}
        </p>
      ) : null}
    </>
  );
}
