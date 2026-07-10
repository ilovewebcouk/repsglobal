import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/accreditation-methodology")({
  head: () => ({
    meta: [
      { title: "How REPS accredits courses — Methodology" },
      {
        name: "description",
        content:
          "The rubric, deterministic checks, and human oversight REPS applies to every accredited course. Published so providers, learners, and gyms know exactly how a decision was reached.",
      },
      { property: "og:title", content: "How REPS accredits courses — Methodology" },
      {
        property: "og:description",
        content:
          "The rubric, deterministic checks, and human oversight REPS applies to every accredited course.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MethodologyPage,
});

function MethodologyPage() {
  return (
    <div className="min-h-screen bg-reps-bg text-white">
      <div className="mx-auto max-w-3xl px-6 py-24 lg:py-28">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-reps-orange">
          Methodology
        </div>
        <h1 className="font-display text-[36px] font-bold leading-tight lg:text-[52px]">
          How REPS accredits courses
        </h1>
        <p className="mt-6 text-[16px] leading-relaxed text-white/80">
          Every course accredited by REPS goes through the same three-stage process: a structured
          submission from the provider, an AI first-pass draft against a published rubric, and a
          decision by a human REPS reviewer. Nothing is published without a reviewer's sign-off.
        </p>

        <Section title="1 · The rubric we apply for level">
          <p>We choose a course's REPS level (1–7) using an ordered checklist:</p>
          <ol className="mt-3 space-y-1.5 pl-5 [list-style:decimal]">
            <li>Prerequisites required to enrol.</li>
            <li>Depth of the learning outcomes (Bloom's verbs: remember → apply → analyse → evaluate → create).</li>
            <li>Total qualification time — the whole learner-time envelope, not just contact hours.</li>
            <li>Tutor credential floor — the qualifications and experience of the person teaching.</li>
          </ol>
          <p className="mt-3">
            The highest level for which every checkpoint is clearly satisfied wins. If a course
            declares "advanced" but has no prerequisites, we do not round the level up.
          </p>
        </Section>

        <Section title="2 · Deterministic checks">
          <p>
            Alongside the AI, we run a set of cheap deterministic checks that don't rely on
            language models. They catch logical inconsistencies the AI can miss:
          </p>
          <ul className="mt-3 space-y-1 pl-5 [list-style:disc] text-white/80">
            <li>Level 4+ claimed with no prerequisites.</li>
            <li>Guided learning hours greater than total qualification time.</li>
            <li>Self-paced online delivery with practical-observation assessment (unless clarified).</li>
            <li>Tutor credentials too thin to establish a credential floor.</li>
          </ul>
        </Section>

        <Section title="3 · Human oversight">
          <p>
            A REPS reviewer reviews every course draft, edits the specification, and issues the
            decision (approved, changes requested, or rejected). Approvals produce a REPS
            qualification number and a downloadable{" "}
            <span className="text-white">Course Assessment Report</span> — the same document
            shared with the provider and available to gyms, insurers, and learners on request.
          </p>
        </Section>

        <Section title="4 · The assessment report">
          <p>Every decision produces an immutable, provider-downloadable PDF containing:</p>
          <ul className="mt-3 space-y-1 pl-5 [list-style:disc] text-white/80">
            <li>The full published specification.</li>
            <li>The level chosen, with the rubric checkpoints that supported it.</li>
            <li>The AI's rationale and confidence band.</li>
            <li>Reviewer notes, AI red flags, and deterministic findings.</li>
            <li>The provider's trust context at the time of decision.</li>
            <li>A full audit trail with timestamps.</li>
          </ul>
          <p className="mt-3">
            Once issued, the report is frozen. Redrafts or fresh decisions produce a new
            document; the original is never overwritten.
          </p>
        </Section>

        <Section title="5 · Challenging a decision">
          <p>
            Providers can request changes and resubmit, or reply to their assessment report with
            evidence. All reviewer decisions are auditable and, on appeal, are re-reviewed by a
            different admin.
          </p>
        </Section>

        <p className="mt-16 text-[12px] text-white/50">
          Methodology last updated: {new Date().toISOString().slice(0, 10)}. This page will be
          versioned when we change the rubric or the deterministic checks.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-[22px] font-bold text-white">{title}</h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-white/75">{children}</div>
    </section>
  );
}
