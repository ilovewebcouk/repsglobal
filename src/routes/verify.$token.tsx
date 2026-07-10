/**
 * Public certificate verification — /verify/$token
 *
 * Anyone (no auth) can scan the QR on a REPS certificate and land here.
 * Server fn `verifyCertificateByToken` reads the row via the publishable-
 * key Supabase client + narrow anon SELECT policy, returning only safe
 * fields.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ShieldAlert } from "lucide-react";

import { verifyCertificateByToken } from "@/lib/certificates/certificates.functions";

export const Route = createFileRoute("/verify/$token")({
  loader: async ({ params }) => {
    return await verifyCertificateByToken({ data: { token: params.token } });
  },
  head: () => ({
    meta: [
      { title: "Verify a REPS certificate" },
      {
        name: "description",
        content: "Confirm that a REPS-issued certificate of achievement is genuine and on the register.",
      },
    ],
  }),
  errorComponent: () => (
    <VerifyLayout>
      <VerifyInvalid />
    </VerifyLayout>
  ),
  notFoundComponent: () => (
    <VerifyLayout>
      <VerifyInvalid />
    </VerifyLayout>
  ),
  component: VerifyPage,
});

function VerifyPage() {
  const result = Route.useLoaderData();
  return (
    <VerifyLayout>
      {result.valid ? <VerifyValid result={result} /> : <VerifyInvalid />}
    </VerifyLayout>
  );
}

function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-reps-bg px-4 py-16 text-white">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="mb-8 inline-block font-display text-2xl font-bold text-reps-orange">
          REPS
        </Link>
        {children}
        <p className="mt-10 text-center text-[12px] text-white/45">
          REPS keeps a public register of certificates issued by our approved training providers.
          Every certificate carries a QR code that resolves to this page.
        </p>
      </div>
    </main>
  );
}

function VerifyValid({
  result,
}: {
  result: Extract<Awaited<ReturnType<typeof verifyCertificateByToken>>, { valid: true }>;
}) {
  const revoked = result.status === "revoked";
  return (
    <section
      className={`rounded-[22px] border p-8 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] ${
        revoked
          ? "border-red-400/30 bg-red-500/10"
          : "border-emerald-400/30 bg-emerald-500/10"
      }`}
    >
      <div className="flex items-center gap-3">
        {revoked ? (
          <ShieldAlert className="h-8 w-8 text-red-300" />
        ) : (
          <BadgeCheck className="h-8 w-8 text-emerald-300" />
        )}
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {revoked ? "This certificate has been revoked" : "Certificate verified"}
          </h1>
          <p className="text-[13px] text-white/70">
            {revoked
              ? "REPS revoked this certificate. It should no longer be accepted as proof of achievement."
              : "This certificate is on the REPS register."}
          </p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 text-[14px]">
        <Row label="Certificate No.">{result.certificate_number}</Row>
        <Row label="Awarded to">{result.learner_name}</Row>
        <Row label="Course">
          {result.course_level ? `Level ${result.course_level} — ` : ""}
          {result.course_title}
        </Row>
        {result.reps_course_number ? <Row label="REPS Course">{result.reps_course_number}</Row> : null}
        <Row label="Issued by">{result.provider_name}</Row>
        <Row label="Issued on">
          {new Date(result.issued_at).toLocaleDateString("en-GB", {
            day: "2-digit", month: "long", year: "numeric",
          })}
        </Row>
      </dl>
    </section>
  );
}

function VerifyInvalid() {
  return (
    <section className="rounded-[22px] border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-white/70" />
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Certificate not found
          </h1>
          <p className="text-[13px] text-white/60">
            This link doesn't match any certificate on the REPS register. Check the QR or certificate
            number carefully and try again.
          </p>
        </div>
      </div>
      <Link to="/verify" className="mt-6 inline-block text-[13px] text-reps-orange hover:underline">
        ← Look up a certificate manually
      </Link>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-baseline gap-4 border-t border-white/10 pt-3 first:border-0 first:pt-0">
      <dt className="text-[11.5px] uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="text-white">{children}</dd>
    </div>
  );
}
