import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, type LegalSection } from "@/components/legal/LegalLayout";

/**
 * REPS Endorsement Terms — the binding rules a training provider must
 * accept every time they submit a regulated qualification or a course
 * for REPS endorsement. Versioned; every acceptance is stamped with the
 * version below so material changes force fresh acceptance on the next
 * submission.
 */
export const ENDORSEMENT_TERMS_VERSION = "v2";

const CANONICAL = "https://repsuk.org/legal/endorsement-terms";
const META_TITLE = "REPS Endorsement Terms — for training providers";
const META_DESC =
  "The binding terms training providers accept when requesting REPS endorsement of a qualification or course. Covers certificate use, trademark licence, sub-contracting ban, advertising, provider name, correct wording, learner records, suspension consequences and public-interest notices.";
const LAST_UPDATED = "14 July 2026";

export const Route = createFileRoute("/legal/endorsement-terms")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: EndorsementTermsPage,
});

const SECTIONS: LegalSection[] = [
  {
    id: "reps-issued-certificates-only",
    title: "REPS-issued certificates only",
    body: (
      <>
        <p>
          The only certificate that endorses a REPS-endorsed qualification
          or course is the certificate REPS issues. You must not print,
          issue, watermark or attach the REPS badge, logo, wordmark, the
          phrase "REPS-endorsed" (or any near-variant), a REPS verification
          URL, a REPS certificate number, a QR code that resembles ours, or
          any REPS-mimicking mark on any certificate you produce yourself.
        </p>
        <p>
          <strong>
            Placing the REPS logo, the REPS wordmark, or any reference to
            REPS on a certificate you (or any third party on your behalf)
            print, issue, email or publish is strictly prohibited and is a
            material breach of these terms.
          </strong>{" "}
          This applies to every certificate you produce outside the REPS
          platform — including internal completion certificates,
          attendance certificates, CPD certificates, third-party
          awarding-body certificates you print or co-brand, and any
          certificate template a supplier or print house produces on your
          instruction. If it isn't the certificate REPS issued through the
          portal, it must contain no REPS logo, no REPS wordmark, no
          "REPS-endorsed" language, and no other reference to REPS
          whatsoever.
        </p>
        <p>
          If a learner needs an endorsed credential, register them through
          REPS and let REPS produce it. Your own internal completion
          certificate is fine — just don't badge it "REPS" in any form.
        </p>
        <p>
          Breach of this clause results in immediate suspension of
          endorsement, withdrawal of the trademark licence in the "REPS
          trademark — Class 41" section below, a public notice on your REPS
          profile, and — where the breach is repeated or wilful — trademark
          enforcement action.
        </p>
      </>
    ),
  },
  {
    id: "no-unendorsed-advertising",
    title: "No unendorsed advertising",
    body: (
      <>
        <p>
          You must not describe, advertise, list, imply or market any
          qualification or course as "REPS-endorsed", "REPS-accredited",
          "REPS-approved", "REPS-recognised", "REPS partner" or any similar
          claim unless that specific qualification or course is currently
          endorsed by REPS and shown as endorsed on your public REPS
          profile.
        </p>
        <p>
          If a course is withdrawn, suspended, or still under review, remove
          it from all channels (website, social, PDFs, ads, email
          templates) within seven days.
        </p>
      </>
    ),
  },
  {
    id: "endorsement-statement-verbatim",
    title: "Endorsement statement, verbatim",
    body: (
      <>
        <p>
          Where a course requires the REPS endorsement statement to appear
          on a public page, you must display it exactly as REPS supplies it,
          on the URL you submitted, for as long as the endorsement is live.
        </p>
        <p>
          Rewording it, hiding it behind a click, blocking it from crawlers,
          or removing it while the course remains listed as endorsed is a
          breach. REPS re-checks this periodically.
        </p>
      </>
    ),
  },
  {
    id: "correct-wording",
    title: "Correct wording on every submission",
    body: (
      <>
        <p>
          You confirm that every field submitted for endorsement — title,
          level, credential type, awarding body (if any), Ofqual number (if
          any), delivery mode, total hours, assessment method, tutor
          credentials — uses the exact wording that matches the real
          product you deliver.
        </p>
        <p>
          Marketing puffery, invented levels, mismatched titles, or copying
          another provider's wording is a breach. If you're unsure, ask
          REPS before you submit.
        </p>
      </>
    ),
  },
  {
    id: "provider-name-locked",
    title: "Provider name is the endorsed entity — no sub-contracting",
    body: (
      <>
        <p>
          REPS endorses <strong>you, under the trading name on file at the
          time of endorsement</strong>, and nobody else. The endorsement is
          personal to your entity and is <strong>strictly
          non-transferable</strong>. You may not, under any circumstance:
        </p>
        <ul>
          <li>change your trading name and continue to advertise the
            endorsement under the new name;</li>
          <li>transfer, assign or novate the endorsement to another legal
            entity (parent, subsidiary, successor, franchise, acquirer);</li>
          <li>sell, lease, sublicense, sub-contract, "white-label",
            "reseller-badge" or otherwise let any third party — franchisee,
            partner, affiliate, associate tutor, sister company, contractor,
            reseller or any other person — deliver, assess, market or issue
            the endorsed course under your endorsement;</li>
          <li>sub-agree, promise, imply or hold out to any third party
            that they benefit from your REPS endorsement in any way.</li>
        </ul>
        <p>
          <strong>Zero tolerance.</strong> Sub-contracting or sub-agreeing
          your endorsement to another party is treated as a material
          breach. It results in <strong>immediate termination of your REPS
          membership without notice or refund</strong>, and the persons and
          entities involved will be <strong>publicly blacklisted on the
          REPS website</strong>. Any continued use of the REPS name, mark
          or endorsement claim by you or the third party after termination
          is trade-mark infringement and REPS will pursue it (see
          "REPS trademark — Class 41" below).
        </p>
        <p>
          Legitimate name changes (rebrand, incorporation, merger) require
          written REPS approval before use. A fresh review may be required
          and REPS reserves the right to re-verify identity and continuing
          fitness.
        </p>
      </>
    ),
  },
  {
    id: "learner-records",
    title: "Learner records are truthful",
    body: (
      <>
        <p>
          You will only register learners who have genuinely completed and
          passed the course you delivered. Bulk-issuing to non-attendees,
          back-dating a completion, or issuing to people you have not
          personally assessed is a breach and may be reported to Action
          Fraud and the awarding body concerned.
        </p>
        <p>
          You are responsible for keeping evidence of attendance and
          assessment for at least three years and providing it on request.
        </p>
      </>
    ),
  },
  {
    id: "reasonable-requests",
    title: "Reasonable requests and audits",
    body: (
      <>
        <p>
          You will respond to REPS audit or clarification requests within
          ten working days. That includes sample assessment evidence,
          learner attendance records, the current wording of any endorsed
          course page, and any material change to the delivery or
          assessment of an endorsed course.
        </p>
        <p>
          Silence, evasion or delay past this window is treated as a
          breach.
        </p>
      </>
    ),
  },
  {
    id: "ofqual-claims",
    title: "Ofqual claims and the Ofqual number field",
    body: (
      <>
        <p>
          The Ofqual number field is used exclusively for genuine
          Ofqual-regulated qualifications that you are currently approved
          to deliver. Populating it with an internal reference, an
          awarding-body ID that isn't an Ofqual number, or a qualification
          you don't hold current approval for is a breach.
        </p>
        <p>
          Certificates for non-Ofqual courses never display an Ofqual
          number. Do not claim, imply, or hint that they do.
        </p>
      </>
    ),
  },
  {
    id: "refunds-and-in-flight-batches",
    title: "Refunds and in-flight batches on suspension",
    body: (
      <>
        <p>
          If REPS suspends you while a certificate batch is still in
          flight (paid but not yet issued), REPS will refund the unissued
          portion. Certificates already issued are not refunded — learners
          keep the credential they legitimately earned.
        </p>
        <p>
          Opening a fraudulent Stripe chargeback or bank dispute on a
          batch REPS delivered in good faith is itself a breach.
        </p>
      </>
    ),
  },
  {
    id: "assessor-identity",
    title: "Assessor and tutor identity",
    body: (
      <>
        <p>
          The person named as lead tutor or assessor on your submission
          must actually deliver and assess the course. Ghost-signing —
          naming a credentialled person who has no real involvement in
          delivery — is a breach. Notify REPS in writing within 14 days
          of any change of lead tutor or assessor.
        </p>
      </>
    ),
  },
  {
    id: "learner-consent-and-data",
    title: "Learner consent and data",
    body: (
      <>
        <p>
          You warrant that you have the learner's consent to submit their
          full name and email to REPS for the purpose of issuing a
          certificate and hosting the public verification page linked from
          its QR code. You are the data controller for that learner
          relationship; REPS is a processor for issuance and a controller
          for the verification page.
        </p>
      </>
    ),
  },
  {
    id: "sanctions-and-fitness",
    title: "Sanctions, insolvency and continuing fitness",
    body: (
      <>
        <p>
          You warrant that at the point of submission you are not:
        </p>
        <ul>
          <li>subject to a live sanction, ban or striking-off by any UK
            regulator, awarding body, or professional register;</li>
          <li>subject to a winding-up petition, administration,
            liquidation or personal bankruptcy;</li>
          <li>a director or controlling person who is currently
            disqualified.</li>
        </ul>
        <p>
          If your status changes after endorsement, you must notify REPS in
          writing within 14 days. Continuing to trade as REPS-endorsed
          while any of these apply is a breach.
        </p>
      </>
    ),
  },
  {
    id: "no-impersonation",
    title: "No impersonation of REPS",
    body: (
      <>
        <p>
          You must not present yourself as REPS, "REPS Head Office", "REPS
          Certification Team" or any similar body. You must not forward
          learner or public correspondence as if it originates from REPS.
          You must not register or use domains, email addresses, social
          handles or trading names that could be reasonably mistaken for a
          REPS-operated account.
        </p>
      </>
    ),
  },
  {
    id: "ownership-and-licence",
    title: "REPS marks and limited licence",
    body: (
      <>
        <p>
          The REPS name, logo, wordmark, badge design, certificate design,
          verification page look-and-feel and the phrase
          "REPS-endorsed" are REPS property. Endorsement gives you a
          limited, non-transferable, revocable licence to reference "this
          [qualification/course] is endorsed by REPS" in your marketing.
        </p>
        <p>
          The licence ends automatically the moment the specific
          endorsement is withdrawn, suspended, or your account is
          suspended. Continued use after that point is trade-mark misuse.
        </p>
      </>
    ),
  },
  {
    id: "trademark-class-41",
    title: "REPS trademark — Class 41 (education & training)",
    body: (
      <>
        <p>
          <strong>REPS holds the registered "REPS" wordmark in Class 41</strong>{" "}
          (education, training, provision of training, arranging and
          conducting of courses, and related services). REPS decides who
          may use the "REPS" wordmark in connection with fitness
          education, training, courses, qualifications, CPD or any related
          service.
        </p>
        <p>
          <strong>Nobody</strong> may use the word "REPS" — on its own,
          as a prefix, suffix, hashtag, handle, badge, seal, watermark,
          course name, page title, marketing claim, meta title, ad copy,
          email signature, invoice or certificate — in association with
          fitness education, training or CPD, unless they have{" "}
          <strong>explicit written approval from REPS</strong>.
        </p>
        <p>
          As a training provider accepted onto the REPS register, you
          have that approval for the limited purpose of truthfully
          referring to your current REPS-endorsed qualifications and
          courses. <strong>That approval lasts only for as long as REPS
          chooses to leave it in place</strong>. REPS may revoke this
          approval at any time — automatically on suspension or
          termination, and otherwise on written notice — after which you
          must remove every use of the "REPS" wordmark from your
          website, socials, ads, PDFs, printed material, email templates
          and third-party listings within seven days.
        </p>
        <p>
          Any use of the "REPS" wordmark in connection with fitness
          education by any person or entity <strong>without a current
          REPS approval — including by anyone you have sub-contracted,
          resold to, franchised to or otherwise associated with — is
          trademark infringement</strong>, and REPS will enforce its
          Class 41 rights. You are responsible for the use of the "REPS"
          wordmark by anyone acting under your name, brand or supply
          chain.
        </p>
      </>
    ),
  },
  {
    id: "right-to-withdraw",
    title: "REPS's right to withdraw endorsement",
    body: (
      <>
        <p>
          REPS may withdraw endorsement of a specific course or
          qualification at any time. Ordinary administrative withdrawals
          take reasonable notice. Withdrawals for breach of these terms
          take effect immediately and without notice.
        </p>
      </>
    ),
  },
  {
    id: "public-register-is-truth",
    title: "The public register is the source of truth",
    body: (
      <>
        <p>
          If your public REPS profile says a qualification or course is
          not currently endorsed, then it is not currently endorsed — no
          matter what an older screenshot, cached page, or previously
          issued email says. Learners, employers and partners should be
          directed to your public REPS profile.
        </p>
      </>
    ),
  },
  {
    id: "suspension-consequences",
    title: "Suspension: permanent and publicly recorded",
    body: (
      <>
        <p>
          A material breach of these terms results in <strong>permanent
          suspension from the REPS platform</strong>. On suspension:
        </p>
        <ul>
          <li>your profile, reviews and history remain publicly visible
            — REPS does not hide the record of what happened;</li>
          <li>a clear public notice is displayed on your profile and on
            every previously endorsed course page stating that you have
            been suspended from REPS, and the date of suspension;</li>
          <li>all certificates REPS previously issued remain valid —
            learners keep their credential;</li>
          <li>any active subscription is cancelled and your Stripe
            payment method is unsubscribed;</li>
          <li>you may not reapply under a different trading name,
            company, spouse, employee, director or "successor" entity
            without written REPS approval — attempts to do so are treated
            as themselves a breach and re-suspended when discovered.</li>
        </ul>
        <p>
          REPS retains and displays this record indefinitely because it is
          in the public and learner interest. By accepting these terms you
          waive any right to have this record removed on request,
          including under a "right to be forgotten" claim, to the extent
          permitted by applicable law.
        </p>
      </>
    ),
  },
  {
    id: "governing-law-and-changes",
    title: "Governing law, disputes and changes to these terms",
    body: (
      <>
        <p>
          These terms are governed by the laws of England and Wales, with
          the exclusive jurisdiction of the courts of England and Wales.
        </p>
        <p>
          REPS may update these terms. Material changes require you to
          re-accept the new version before your next endorsement
          submission. The current version is recorded on your account
          against each submission, with the date and time you accepted it.
        </p>
        <p>
          These terms sit alongside — and are additional to — the general{" "}
          <Link to="/terms">Terms of Use</Link> and the{" "}
          <Link to="/privacy">Privacy Policy</Link>. Where a specific
          endorsement rule in this document conflicts with the general
          Terms of Use, this document controls for endorsed
          qualifications and courses.
        </p>
      </>
    ),
  },
];

function EndorsementTermsPage() {
  return (
    <LegalLayout
      eyebrow="For training providers"
      title="REPS Endorsement Terms"
      lede="These are the binding rules a training provider accepts each time they request REPS endorsement of a regulated qualification or a course. They exist to protect learners and the REPS register."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
