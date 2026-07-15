I agree: the current /training-providers page drifted into a flat institutional prospectus and lost the world-class REPs feature/resource style. The rebuild should look like a premium REPs product launch page: dark, cinematic, scrollable, image-led, with a YouTube/resource-style feature hero and crisp product proof.

Plan:

1. Rebuild the hero around a feature/resource-style visual system
   - Use a wide editorial hero composition similar to the strongest REPs feature/resource pages, not the current brochure layout.
   - Lead with a large cinematic training/provider image area and a high-quality certificate/product overlay.
   - Treat the certificates as premium proof assets, not tilted cheap paper mockups.
   - Keep the headline focused on the core offer: getting training courses REPs-endorsed.

2. Restore the “YouTube-style / resource-style” feel
   - Build the top of page like a premium feature story: bold title, dark chrome, large visual, strong CTA, clear pricing.
   - Add video/resource-like visual rhythm: large feature panel, thumbnail-style supporting cards, editorial captions, sharp hierarchy.
   - Avoid the current static prospectus feel.

3. Remove the weak elements
   - No sticky mini-menu under the hero.
   - No comparison table.
   - No fake stats.
   - No SaaS dashboard gimmicks.
   - No cheap badge treatment.
   - No low-quality certificate collage styling.

4. Use real training imagery properly
   - Keep the existing Pilates, spin, classroom/tutor and studying images as supporting visuals where they help sell the provider market.
   - Use them in larger, cleaner editorial/product sections rather than scattered cards.
   - Make the page feel like real fitness education: Pilates, yoga-style movement, personal training, group exercise, learners and tutors.

5. Make the certificate system look premium
   - Use the Certificate of Achievement and Learner Unit Summary images cleanly in dedicated product sections.
   - Present them as official product evidence: large, readable, straight, framed, with restrained shadows.
   - Avoid distorted rotations, tiny thumbnails or fake 3D mockups.

6. Restructure the page into a conversion-focused story
   - Hero: offer, price, CTAs, premium certificate-led visual.
   - Authority section: what REPs reviews and why it matters.
   - Product section: provider page, directory listing, reviews, badge, certificate issuing.
   - Training imagery section: real course delivery environments.
   - Pricing section: £479/year and £15 per certificate, prominent and early enough.
   - Process section: apply, submit evidence, review, endorsed, issue certificates.
   - FAQ and final CTA.

7. Keep the existing compliance rules intact
   - Use “endorsed” / “endorsement” wording only.
   - Preserve the required disclaimer that REPs endorsement is not Ofqual-regulated, UKAS-accredited, government-approved or part of a regulated qualifications framework.
   - Do not introduce banned organisation names.
   - Keep CTAs pointing to /signup?type=training_provider and /contact?topic=training-provider.

8. Technical implementation
   - Edit only src/routes/training-providers.tsx unless a shared primitive is clearly needed.
   - Continue using existing marketing primitives and REPs semantic tokens.
   - Do not touch dashboard, legal, checkout, backend, billing logic or certificate backend.
   - Preserve existing metadata and JSON-LD intent, updating only if needed for the new page structure.

9. QA before handoff
   - Typecheck.
   - Grep for banned “accredited/accreditation” usage outside the mandatory disclaimer context.
   - Confirm pricing: £479/year and £15/certificate.
   - Confirm CTA URLs.
   - Screenshot desktop and mobile sections.
   - Confirm certificate images are used cleanly.
   - Confirm no fake stats or comparison table remain.