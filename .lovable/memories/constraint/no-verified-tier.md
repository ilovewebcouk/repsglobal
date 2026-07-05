---
name: No Verified tier
description: The subscription tier is called "Core" in every user-facing surface. "Verified" survives only as an internal DB key and as the trust-badge concept.
type: constraint
---

# No "Verified" tier — it is called "Core"

## Rule

The three subscription tiers are **Core / Pro / Studio**. There is no "Verified" tier, no "Verified plan", no "Verified members".

Every user-facing string — pricing, compare, dashboards, help, emails, marketing pillars, feature CTAs, admin filters, resource articles — must say **Core** (or "Core tier", "Core members", "Start with Core", etc.).

**Why:** the tier was renamed. Prior "Verified" wording confused it with the trust badge (a separate concept — see below). Owner confirmed 2026-07-05.

## Two meanings — keep them separate

| Meaning | Where it appears | Rule |
| --- | --- | --- |
| **Tier / plan name** | pricing, checkout, dashboard upsell copy, compare matrices, emails, marketing, admin campaign filters, resource articles | Say **Core** |
| **Trust concept** — a professional who has passed ID + insurance + qualification checks | "Verified professional" badge on `/pro/$slug` and `/c/$slug`, `VerificationCard`, `VerificationPill`, `/dashboard/verification` flow, `verification.functions.ts`, "verified register" copy, "Verified Professionals" stat count, admin verification queue, help articles about verification | **KEEP unchanged** |

A Core member is still a "verified professional" on the register once they clear the three checks. The badge is not the tier.

## Internal-only exception

The DB tier key is still the string `"verified"` (column value, TS union member `Tier = "verified" | "pro" | "studio"`, checkout period switch, admin metric keys). Do NOT rename the identifier — that would require a migration and break every downstream mapping. Only rename **string literals and prose**.

When touching code that uses the internal key, add a short comment clarifying: `// internal key "verified" = user-facing "Core" tier`.

## How to apply

1. Any new user-visible copy referring to the £34/yr plan: write **Core**.
2. Editing existing copy that still says "Verified" in a tier sense: replace with "Core".
3. Editing anywhere that describes credential/insurance/ID checks or the badge: leave "verified" alone.
4. Never introduce phrases like "Verified tier", "Verified members", "Verified plan", "Start with Verified", "on Verified", "Verified vs Pro" (use "Core vs Pro"), "Upgrade from Verified" (use "Upgrade from Core").
