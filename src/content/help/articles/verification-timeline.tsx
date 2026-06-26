import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "typical-verification-times",
  category: "verification",
  title: "How long does verification take?",
  summary: "Most checks pass in minutes. Manual reviews are completed within one working day.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Trust Team",
  tags: ["timeline", "sla", "waiting"],
  related: ["verification/how-verification-works", "verification/why-was-i-rejected"],
  Body: () => (
    <>
      <p>
        Verification is split into three independent checks. Each one has its own timeline — you
        don't have to wait for one to finish before starting the next.
      </p>
      <h2 id="typical-timings">Typical timings</h2>
      <ul>
        <li>
          <strong>Identity</strong> — usually under 5 minutes. Manual reviews up to 1 working
          day.
        </li>
        <li>
          <strong>Qualifications</strong> — same business day for recognised awarding bodies. Up
          to 2 working days for overseas qualifications.
        </li>
        <li>
          <strong>Insurance</strong> — same business day. Often within an hour during UK working
          hours.
        </li>
      </ul>
      <h2 id="why-it-might-take-longer">Why a check might take longer</h2>
      <ul>
        <li>Document image is blurry, cropped or poorly lit</li>
        <li>Name on the document doesn't match the name on your profile</li>
        <li>Qualification is from an awarding body we haven't seen before</li>
        <li>Insurance schedule doesn't list the services you're claiming</li>
      </ul>
      <p>
        If any of those apply, we'll email you with what we need rather than silently rejecting.
      </p>
    </>
  ),
};
