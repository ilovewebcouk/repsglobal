/**
 * /verify — manual lookup landing page for REPS certificates.
 *
 * Learners / employers land here from the URL printed under the QR on
 * every certificate. They can either scan the QR (which resolves to
 * /verify/$token) or paste a token / certificate URL to jump straight to
 * the verification result.
 */

import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

export const Route = createFileRoute("/verify/")({
  head: () => ({
    meta: [
      { title: "Verify a REPS certificate" },
      {
        name: "description",
        content: "Look up a certificate of achievement issued by a REPS-approved training provider.",
      },
    ],
  }),
  component: VerifyLookup,
});

function VerifyLookup() {
  const [input, setInput] = React.useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;
    // Accept either a full URL or just the token/certificate number
    let token = raw;
    try {
      const url = new URL(raw);
      const parts = url.pathname.split("/").filter(Boolean);
      token = parts[parts.length - 1] || raw;
    } catch {
      /* not a URL */
    }
    navigate({ to: "/verify/$token", params: { token } });
  };

  return (
    <main className="min-h-screen bg-reps-ink px-4 py-16 text-white">
      <div className="mx-auto max-w-xl">
        <a href="/" className="mb-8 inline-block font-display text-2xl font-bold text-reps-orange">
          REPS
        </a>
        <h1 className="font-display text-3xl font-bold text-white">Verify a REPS certificate</h1>
        <p className="mt-2 text-[14px] text-white/70">
          Every REPS-issued certificate carries a QR code. Scan the QR, or paste the verification
          link / token printed on the certificate below.
        </p>
        <form onSubmit={submit} className="mt-6 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste verify link or token"
            className="flex-1 rounded-[10px] border border-reps-border bg-reps-panel px-3 py-2 text-[14px] text-white placeholder-white/40 outline-none focus:border-reps-orange"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-[10px] bg-reps-orange px-4 py-2 text-[14px] font-semibold text-white hover:brightness-105"
          >
            <Search className="h-4 w-4" /> Verify
          </button>
        </form>
        <p className="mt-10 text-[12px] text-white/45">
          REPS keeps a public register of every certificate issued through our approved training
          providers. Records here are the source of truth.
        </p>
      </div>
    </main>
  );
}
