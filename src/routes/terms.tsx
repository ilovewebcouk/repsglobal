import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, type LegalSection } from "@/components/legal/LegalLayout";

const CANONICAL = "https://repsuk.org/terms";
const META_TITLE = "Terms of Use — REPs";
const META_DESC =
  "The binding terms that govern use of REPs — accounts, listings, reviews, subscriptions, no-refund policy, intellectual property and our UK registered trade marks. English law, exclusive jurisdiction of the courts of England & Wales.";
const LAST_UPDATED = "26 June 2026";

export const Route = createFileRoute("/terms")({
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
  component: TermsPage,
});

const SECTIONS: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          These terms of use (the <strong>"Terms"</strong>) form a binding
          legal agreement between you and <strong>REPs</strong>, of
          167-169 Great Portland Street, London, W1W 5PF, United Kingdom (
          <strong>"REPs"</strong>, <strong>"we"</strong>, <strong>"us"</strong>,{" "}
          <strong>"our"</strong>). They apply to every visitor and account
          holder on{" "}
          <a href="https://repsuk.org">repsuk.org</a> and any subdomain,
          application or service we operate (together, the{" "}
          <strong>"Platform"</strong>).
        </p>
        <p>
          By creating an account, listing a profile, paying for a
          subscription, submitting a review or otherwise using the Platform,
          you confirm that you have read, understood and agree to be bound by
          these Terms, our{" "}
          <Link to="/privacy">Privacy Policy</Link>, our{" "}
          <Link to="/cookies">Cookies Policy</Link> and our published{" "}
          <Link to="/standards">Standards</Link>. If you do not agree, you
          must not use the Platform.
        </p>
        <p>
          Where there is a conflict, these Terms prevail over the Privacy
          Policy, the Cookies Policy and any tier-specific commercial terms
          we publish, except that mandatory consumer-protection rights under
          English law always take precedence.
        </p>
        <p>
          <strong>Important.</strong> These Terms have been drafted to a
          professional standard but are not bespoke legal advice for you. If
          anything is unclear, take independent legal advice before relying
          on them.
        </p>
      </>
    ),
  },
  {
    id: "definitions",
    title: "Definitions",
    body: (
      <ul>
        <li>
          <strong>Client</strong> — any individual using the Platform to find
          or enquire about a Professional.
        </li>
        <li>
          <strong>Professional</strong> — any individual or business listed
          on the Platform, including personal trainers, group instructors,
          coaches, nutritionists and other fitness professionals.
        </li>
        <li>
          <strong>Listing</strong> — a Professional's public profile and
          associated content on the Platform.
        </li>
        <li>
          <strong>Verification</strong> — REPs' own platform-level checks of
          identity, qualifications and insurance, as described on our{" "}
          <Link to="/standards">Standards</Link> page. It is not a statutory
          accreditation, qualification or regulator's approval.
        </li>
        <li>
          <strong>Subscription</strong> — any paid plan offered by REPs
          (currently Core, Pro and Studio tiers).
        </li>
        <li>
          <strong>Content</strong> — any text, image, video, audio, review,
          message, document or other material submitted to the Platform by a
          user.
        </li>
        <li>
          <strong>Trade Marks</strong> — the REPs marks identified in section
          11.
        </li>
      </ul>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility & accounts",
    body: (
      <ul>
        <li>
          You must be at least 16 years old and have the legal capacity to
          enter into a contract. If you are under 18, you must have the
          consent of a parent or guardian.
        </li>
        <li>
          Accounts are personal to you. You must provide accurate, current
          and complete information at sign-up and keep it up to date.
        </li>
        <li>
          You are responsible for keeping your credentials confidential and
          for all activity carried out under your account. Notify us
          immediately at{" "}
          <a href="mailto:support@repsuk.org">support@repsuk.org</a> if you
          suspect unauthorised access.
        </li>
        <li>
          One account per person. Multiple, duplicate or impersonation
          accounts may be suspended without notice.
        </li>
        <li>
          We may suspend, restrict or close any account that breaches these
          Terms, our Standards, or applicable law, or that presents a risk to
          other users or to the Platform.
        </li>
      </ul>
    ),
  },
  {
    id: "platform-role",
    title: "The Platform — what REPs is, and what REPs is not",
    body: (
      <>
        <p>
          REPs operates a directory and software platform that helps Clients
          discover Professionals and helps Professionals run their business.
        </p>
        <p>
          REPs is <strong>not</strong>:
        </p>
        <ul>
          <li>
            a party to any contract for services between a Client and a
            Professional;
          </li>
          <li>
            an employer, agent, partner, franchisor or representative of any
            Professional;
          </li>
          <li>
            a statutory regulator, awarding body, training provider or
            insurer; or
          </li>
          <li>
            responsible for the acts, omissions, advice, conduct, training,
            programming or outcomes of any Professional or Client.
          </li>
        </ul>
        <p>
          Professionals are independent. Any session, programme, course,
          subscription or product they sell to a Client is a direct
          contract between that Professional and that Client.
        </p>
      </>
    ),
  },
  {
    id: "listings",
    title: "Listings, Verification & Standards",
    body: (
      <>
        <p>
          Professionals listed on the Platform commit to our{" "}
          <Link to="/standards">Standards</Link> and are subject to
          Verification. Verification is a platform-level check performed by
          REPs. It does not replace, supersede or guarantee compliance with
          any statutory regulator, awarding body, insurer or court, and is
          not a warranty of any specific outcome, qualification or skill.
        </p>
        <p>
          We may, in our sole and reasonable discretion: request further
          evidence at any time; downgrade, suspend, hide or remove a Listing
          where evidence is missing, expired, suspected to be fraudulent or
          in breach of these Terms or our Standards; and remove any user
          (Client or Professional) who misrepresents their identity,
          qualifications, insurance, employment or affiliation.
        </p>
      </>
    ),
  },
  {
    id: "reviews",
    title: "Reviews & user content",
    body: (
      <>
        <p>
          Reviews and other user-submitted Content must be honest, based on a
          real interaction, lawful and respectful. The following are
          prohibited and will be removed:
        </p>
        <ul>
          <li>fabricated, paid-for, incentivised or solicited fake reviews;</li>
          <li>defamatory, harassing, threatening, discriminatory, hateful or sexually explicit material;</li>
          <li>personal data of third parties without their consent;</li>
          <li>content that infringes intellectual-property or confidentiality rights;</li>
          <li>spam, advertising or attempts to manipulate search or ranking.</li>
        </ul>
        <p>
          Professionals may publicly respond to reviews of their own Listing.
          Buying, exchanging, threatening or otherwise improperly
          influencing reviews — positive or negative — is a material breach
          of these Terms and grounds for removal from the Platform.
        </p>
        <p>
          REPs may, at its discretion, moderate, edit (for legal compliance
          only), refuse to publish or remove any Content, but we are not
          obliged to monitor Content and accept no responsibility for
          Content posted by users.
        </p>
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "Subscriptions, billing & auto-renewal",
    body: (
      <>
        <p>
          REPs offers paid Subscriptions to Professionals. Pricing for each
          tier (currently Core at £34 per year, Pro Founding at £59 per
          month, and Studio by waitlist) is shown at{" "}
          <Link to="/pricing">/pricing</Link> and at checkout. All prices
          are in pounds sterling and inclusive of UK VAT where applicable
          unless stated otherwise.
        </p>
        <ul>
          <li>
            Subscriptions renew automatically at the end of each billing
            period at the then-current price until cancelled.
          </li>
          <li>
            You may cancel at any time from your dashboard. Cancellation
            takes effect at the end of the current paid period; access
            continues until then.
          </li>
          <li>
            We may change pricing, plan inclusions or introduce new plans.
            For existing Subscriptions, we will give you at least 30 days'
            advance notice in-app or by email before any price increase
            takes effect. If you do not accept, you may cancel before the
            change applies.
          </li>
          <li>
            If a payment fails, we may retry, downgrade or suspend access
            after reasonable notice.
          </li>
          <li>
            Payments are processed by our third-party payments provider
            under their own terms. We do not store full card numbers.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "no-refunds",
    title: "No refunds — digital service",
    body: (
      <>
        <p>
          REPs is a digital service provided immediately on payment. Subject
          to your statutory rights (see below), Subscriptions are{" "}
          <strong>non-refundable</strong>.
        </p>
        <ul>
          <li>
            By purchasing any Subscription, you{" "}
            <strong>expressly request and consent</strong> to immediate
            performance of the contract and to access being made available
            to you before the end of any statutory cancellation period. You
            acknowledge that, under regulation 37 of the Consumer Contracts
            (Information, Cancellation and Additional Charges) Regulations
            2013, this consent means you{" "}
            <strong>lose your 14-day right to cancel</strong> in respect of
            the digital content and services supplied.
          </li>
          <li>
            We do not provide pro-rata refunds on cancellation, downgrade,
            account closure, suspension for breach, or non-use of the
            Platform.
          </li>
          <li>
            Annual plans are paid annually in advance and are not refundable
            in whole or in part if you cancel partway through the term.
          </li>
          <li>
            Goodwill refunds are entirely at our discretion and are
            generally limited to (a) duplicate or accidental charges
            attributable to a REPs system error, or (b) a sustained and
            proven failure by REPs to provide the core Platform features of
            your tier.
          </li>
          <li>
            Initiating a chargeback or payment dispute instead of contacting
            <a href="mailto:support@repsuk.org"> support@repsuk.org</a> is a
            material breach of these Terms and may result in immediate
            suspension and recovery of associated fees and costs.
          </li>
        </ul>
        <p>
          Nothing in this section affects any non-excludable statutory
          rights you have as a consumer under the Consumer Rights Act 2015
          (including in respect of digital content of unsatisfactory
          quality, not fit for purpose, or not as described).
        </p>
      </>
    ),
  },
  {
    id: "bookings",
    title: "Bookings between Clients and Professionals",
    body: (
      <>
        <p>
          Any session, package, course, programme or product purchased from
          a Professional through the Platform forms a direct contract
          between that Client and that Professional, on the Professional's
          own terms (including their own cancellation, rescheduling, refund,
          health-screening and liability terms).
        </p>
        <p>
          REPs is not a party to that contract and is not liable for the
          quality, safety, delivery, suitability, lawfulness or outcome of
          any Professional's services, nor for any refund, rebooking or
          dispute relating to them. Refund requests for Professional
          services must be made directly to the Professional.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to, and not to permit any third party to:</p>
        <ul>
          <li>
            scrape, harvest, crawl, index, copy, mirror or bulk-extract any
            part of the Platform or its Content, except by search engines
            obeying our published <code>robots.txt</code>;
          </li>
          <li>
            use Listings, profile data, reviews or contact information to
            build, populate or train any competing directory, lead-list,
            mailing list, dataset or AI model;
          </li>
          <li>
            use automated means (bots, scripts, headless browsers) to
            interact with the Platform, except for our public APIs used
            under their documented terms;
          </li>
          <li>
            reverse engineer, decompile, disassemble or otherwise attempt to
            derive source code from the Platform, except to the extent
            expressly permitted by law;
          </li>
          <li>
            impersonate any person or misrepresent your identity,
            qualifications, employer, insurance or affiliation;
          </li>
          <li>
            misuse, replicate or display Verification badges, the REPs name
            or the Trade Marks in any way that suggests endorsement,
            partnership or registration that does not exist;
          </li>
          <li>
            upload malware, attempt to gain unauthorised access, probe for
            vulnerabilities outside a responsibly disclosed programme, or
            interfere with the security, integrity or availability of the
            Platform;
          </li>
          <li>
            use the Platform in breach of applicable law, including
            consumer-protection, data-protection, advertising,
            anti-discrimination, anti-bribery, sanctions, anti-money-laundering
            and tax law.
          </li>
        </ul>
        <p>
          Breach of this section may result in immediate suspension,
          permanent removal, civil proceedings (including for damages and
          injunctive relief) and referral to law enforcement.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property & REPs trade marks",
    body: (
      <>
        <p>
          The Platform, its software, design, layouts, copy, photography,
          datasets, badges, logos and branding are owned by or licensed to
          REPs and are protected by United Kingdom and international
          intellectual-property law, including the Copyright, Designs and
          Patents Act 1988 and the Trade Marks Act 1994. All rights are
          reserved.
        </p>
        <p>
          <strong>Registered and pending UK trade marks.</strong> The
          following Trade Marks are owned by REPs of 167-169 Great Portland
          Street, London W1W 5PF and are entered on the public register at
          the United Kingdom Intellectual Property Office (UKIPO):
        </p>
        <ul>
          <li>
            <strong>UK00003857976</strong> — <strong>REPs</strong> (word
            mark) — Registered (filing 09 December 2022; entered 31 March
            2023; renewal 09 December 2032) — Class 41 (education,
            training, sports and physical-education services).
          </li>
          <li>
            <strong>UK00003863503</strong> — REPs (figurative mark) —
            Registered (filing 30 December 2022; entered 31 March 2023;
            renewal 30 December 2032) — Classes 16 and 41.
          </li>
          <li>
            <strong>UK00003868963</strong> — REPs (figurative mark) —
            Registered (filing 18 January 2023; entered 14 April 2023;
            renewal 18 January 2033) — Classes 16 and 41.
          </li>
          <li>
            <strong>UK00003883073</strong> — REPs (series of figurative
            marks) — Registered.
          </li>
          <li>
            <strong>UK00004397125</strong> — <strong>REPs</strong> (word
            mark) — Application Published (filed 4 June 2026) — Classes 9,
            35 and 42 (downloadable software and mobile applications;
            online searchable directory and marketplace services for
            fitness professionals, personal trainers, training providers
            and education providers; SaaS and PaaS for client management,
            bookings, payments, reviews, learner management and
            AI-assisted coaching tools).
          </li>
          <li>
            <strong>UK00004397139</strong> — REPs (figurative mark) — in
            Examination (filed 4 June 2026).
          </li>
        </ul>
        <p>
          No licence, express or implied, is granted to use the REPs name,
          the Trade Marks or any confusingly similar sign, including in any
          domain name, sub-domain, social-media handle, app-store listing,
          paid-search keyword, advertising creative, training-provider or
          awarding-body marketing, certificate, badge or directory.
          Unauthorised use is infringement under sections 9, 10 and 10A of
          the Trade Marks Act 1994 and may also amount to passing off.
        </p>
        <p>
          Limited nominative or editorial reference to "REPs" is permitted
          where it is necessary to identify the Platform truthfully, is not
          misleading as to source, sponsorship or endorsement, and does not
          use any figurative element of the Trade Marks.
        </p>
        <p>
          Suspected infringement, counterfeit or look-alike usage should be
          reported to{" "}
          <a href="mailto:legal@repsuk.org">legal@repsuk.org</a>. REPs
          actively monitors and enforces its rights, including by takedown
          notice, UDRP/Nominet domain-dispute proceedings, UKIPO opposition
          and civil proceedings for injunction, account of profits and
          damages.
        </p>
      </>
    ),
  },
  {
    id: "user-content-licence",
    title: "Your licence to REPs",
    body: (
      <>
        <p>
          You keep ownership of the Content you submit. You grant REPs a
          worldwide, non-exclusive, royalty-free, sub-licensable and
          transferable licence to host, store, reproduce, adapt (for
          formatting and accessibility), publish, communicate to the public,
          translate and distribute that Content for the purposes of
          operating, securing, promoting, improving and lawfully marketing
          the Platform, including in search results, promotional materials
          and case studies.
        </p>
        <p>
          To the extent permitted by law, you waive any moral rights in the
          Content for these purposes. You warrant that you own or have all
          necessary rights to grant this licence and that the Content does
          not infringe any third-party rights.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party services",
    body: (
      <p>
        The Platform integrates with third-party services (including our
        payments processor, email-delivery provider, hosting provider,
        analytics provider and AI provider). Your use of those services may
        be subject to their own terms. REPs is not liable for the acts,
        omissions, outages, pricing changes or terms of any third-party
        provider.
      </p>
    ),
  },
  {
    id: "beta",
    title: "Beta, Founding and waitlist features",
    body: (
      <p>
        Features identified as beta, preview, "Founding" or waitlist are
        provided <em>as is</em>, may change, be limited, or be withdrawn at
        any time, and may carry promotional pricing that applies only while
        you remain in continuous good standing on the relevant tier.
        Founding pricing is not transferable and may be retired for new
        signups without notice.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension & termination",
    body: (
      <>
        <p>
          You may close your account at any time from your dashboard or by
          emailing <a href="mailto:support@repsuk.org">support@repsuk.org</a>.
          Closure does not entitle you to a refund of any unused portion of
          a Subscription (see section 8).
        </p>
        <p>
          We may suspend or terminate your access immediately and without
          refund if: (a) you breach these Terms, our Standards or
          applicable law; (b) we reasonably believe you present a risk to
          other users, to REPs or to the integrity of the Platform; (c) we
          are required to do so by a court, regulator or law-enforcement
          authority; or (d) the Platform is discontinued in whole or in
          part.
        </p>
        <p>
          Sections covering intellectual property, your licence to REPs,
          no refunds, limitation of liability, indemnity, governing law
          and any clause that by its nature should survive termination
          will continue to apply.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Warranties & disclaimers",
    body: (
      <p>
        To the maximum extent permitted by law, the Platform is provided{" "}
        <em>as is</em> and <em>as available</em>. We exclude all implied
        warranties, conditions and other terms (including warranties of
        satisfactory quality, fitness for purpose and conformity with
        description) other than those that cannot lawfully be excluded.
        Your statutory rights as a consumer under English law are not
        affected.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p>
          Nothing in these Terms limits or excludes our liability for: (a)
          death or personal injury caused by our negligence; (b) fraud or
          fraudulent misrepresentation; or (c) any other liability that
          cannot lawfully be limited or excluded, including under the
          Consumer Rights Act 2015 for consumers.
        </p>
        <p>Subject to that, REPs will not be liable to you for:</p>
        <ul>
          <li>loss of profits, revenue, business, anticipated savings, goodwill or reputation;</li>
          <li>loss or corruption of data;</li>
          <li>business interruption;</li>
          <li>any indirect, consequential, special or punitive loss; or</li>
          <li>any loss arising from a Professional's or Client's acts or omissions, or from any third-party service.</li>
        </ul>
        <p>
          Subject to the carve-outs above, our total aggregate liability to
          you arising out of or in connection with these Terms or the
          Platform, whether in contract, tort (including negligence),
          misrepresentation, restitution or otherwise, in any twelve-month
          period, is limited to the greater of (i) the fees actually paid by
          you to REPs in the twelve months immediately before the event
          giving rise to the claim, and (ii) one hundred pounds (£100).
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity (business and Professional users)",
    body: (
      <p>
        If you use the Platform as a Professional or otherwise in the course
        of a business, you agree to indemnify and keep REPs, its officers,
        employees and contractors indemnified against all losses, damages,
        claims, demands, fines, regulatory actions, reasonable legal costs
        and expenses arising out of or in connection with: (a) your
        Listing, Content or use of the Platform; (b) the services or
        products you supply to Clients; (c) your breach of these Terms or
        any applicable law; or (d) any infringement of a third party's
        rights by you or anyone acting on your behalf. This clause does not
        apply to individuals acting as consumers.
      </p>
    ),
  },
  {
    id: "data-protection",
    title: "Data protection",
    body: (
      <p>
        Our processing of personal data is described in our{" "}
        <Link to="/privacy">Privacy Policy</Link>. REPs is the controller
        for personal data we hold about account holders. Where a
        Professional uses the Platform to manage their own clients,
        prospects and business records, the Professional is the independent
        controller of that personal data and REPs is a processor acting on
        the Professional's documented instructions under the terms set out
        in the Privacy Policy and any data-processing addendum we publish.
      </p>
    ),
  },
  {
    id: "disputes",
    title: "Complaints & dispute resolution",
    body: (
      <p>
        We want to resolve any concern quickly. Please write to{" "}
        <a href="mailto:support@repsuk.org">support@repsuk.org</a> setting
        out the issue and the outcome you are seeking. We will acknowledge
        within 5 working days and aim to resolve within 30 days. If a
        dispute is not resolved through good-faith negotiation within that
        period, either party may bring proceedings as set out in section
        25. Consumers also have the right to use the EU/UK Online Dispute
        Resolution platform where applicable.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these Terms from time to time. For material changes,
        we will give at least 30 days' notice in-app or by email before
        they take effect. Non-material changes (clarifications, formatting,
        contact details) take effect on posting. Continuing to use the
        Platform after a change comes into force means you accept the
        updated Terms. The "Last updated" date at the top of this page
        always reflects the current version.
      </p>
    ),
  },
  {
    id: "force-majeure",
    title: "Force majeure",
    body: (
      <p>
        Neither party is liable for any failure or delay in performing its
        obligations (other than payment obligations) caused by events
        beyond its reasonable control, including acts of God, war, civil
        unrest, terrorism, cyber-attack, pandemic, strike, governmental
        action, failure of utilities, internet or upstream cloud
        providers, fire or flood.
      </p>
    ),
  },
  {
    id: "general",
    title: "General",
    body: (
      <ul>
        <li>
          <strong>Assignment.</strong> You may not assign or transfer your
          rights or obligations under these Terms without our prior written
          consent. We may assign or novate these Terms (including to a
          successor entity, group company or purchaser of our business or
          assets) on notice to you.
        </li>
        <li>
          <strong>Severability.</strong> If any provision is held to be
          invalid or unenforceable, the rest of the Terms remain in full
          force, and the offending provision will be modified to the
          minimum extent necessary to make it enforceable.
        </li>
        <li>
          <strong>Waiver.</strong> A failure or delay to enforce any right
          is not a waiver of it.
        </li>
        <li>
          <strong>Entire agreement.</strong> These Terms, together with
          documents they reference, are the entire agreement between you
          and REPs on their subject matter and supersede any prior
          arrangement.
        </li>
        <li>
          <strong>No partnership or agency.</strong> Nothing in these Terms
          creates a partnership, joint venture, agency, franchise or
          employment relationship between you and REPs.
        </li>
        <li>
          <strong>Third-party rights.</strong> The Contracts (Rights of
          Third Parties) Act 1999 is excluded; no one other than you and
          REPs has any right to enforce these Terms.
        </li>
      </ul>
    ),
  },
  {
    id: "notices",
    title: "Notices",
    body: (
      <p>
        We will send notices to the email address on your account. You may
        send legal notices to REPs by email to{" "}
        <a href="mailto:legal@repsuk.org">legal@repsuk.org</a> or by post to
        REPs, c/o 167-169 Great Portland Street, London, W1W 5PF, United
        Kingdom. Notices are deemed received on the next working day after
        sending by email or two working days after first-class posting
        within the UK.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law & jurisdiction",
    body: (
      <p>
        These Terms, their subject matter and their formation (and any
        non-contractual disputes or claims arising out of or in connection
        with them) are governed by and construed in accordance with the
        laws of <strong>England and Wales</strong>. You and REPs irrevocably
        agree to the <strong>exclusive jurisdiction of the courts of
        England and Wales</strong>, save that if you are a consumer
        resident in another part of the UK you may also bring proceedings
        in the courts of your home jurisdiction, and you retain the benefit
        of any mandatory consumer-protection rights in your country of
        residence.
      </p>
    ),
  },
  {
    id: "contact",
    title: "How to contact us",
    body: (
      <p>
        General enquiries:{" "}
        <a href="mailto:support@repsuk.org">support@repsuk.org</a>. Legal,
        intellectual-property and trade-mark notices:{" "}
        <a href="mailto:legal@repsuk.org">legal@repsuk.org</a>. Postal
        address: REPs, 167-169 Great Portland Street, London, W1W 5PF,
        United Kingdom.
      </p>
    ),
  },
];

function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Use"
      lede="The binding rules for using REPs — written in plain English, governed by the laws of England & Wales, and protective of our brand, our registered trade marks and our no-refund policy for digital subscriptions."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
