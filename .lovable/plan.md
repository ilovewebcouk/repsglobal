# Fix the double-header / double-search on /dashboard/leads (and roll the pattern out)

## Brutal honest read

You're right — it's a mess and it's not just Leads. Three things stacked on top of each other:

1. **TopBar (`DashboardShell`)** renders `title = "Leads"` + a fake non-functional ⌘K Search pill on the right.
2. **Page toolbar** renders another `Search…` input + Import / New lead / Score all buttons.
3. **Lead pipeline panel** renders a third `Search leads…` input next to its own "Lead pipeline" heading.

That gives you: 2 titles ("Leads" and "Lead pipeline"), 3 search boxes (one of which does nothing), and an awkward floating button row that the Profile editor never had — because Profile puts its actions into the shell's `actions` slot.

There's also a stale runtime error referencing the old (pre-move) leads file path; harmless after a dev restart but I'll confirm.

## What I'll change

### 1. DashboardShell — make the TopBar do real work
- Add optional props to `DashboardShell` / `TopBar`:
  - `search?: { value: string; onChange: (v: string) => void; placeholder?: string }` — turns the dead ⌘K pill into a real `<Input>` wired to the page.
  - Keep existing `actions?: ReactNode` (already there, just under-used).
- Wire `⌘K` to focus the input. No new search bar created elsewhere.

### 2. /dashboard/leads — collapse to one header
- Set shell `title="Leads pipeline"` and `subtitle="Track enquiries, prioritise follow-ups and convert leads into clients."` (kill the duplicate body H2).
- Pass `search` (replaces local `search` state) + `actions={<><ImportLeads/><NewLead/><ScoreAll/></>}` to the shell.
- Delete the entire body toolbar block (lines 138–171).
- Delete the third `Search leads…` input inside the Lead pipeline panel. Panel header becomes just the count strip ("2 active leads · sorted by priority and follow-up").
- Filtering uses the single shell search value (drop `innerSearch`).

### 3. Button hover audit
Pass over every interactive button on the leads page + shell TopBar:
- Primary (`New lead`, `Draft reply`, `Book call`): `bg-reps-orange` → `hover:bg-reps-orange-dark` + `transition-colors`. Currently inconsistent.
- Outline (`Import leads`, `Score all`, `Send message`, `Create proposal`, `Convert to client`, `Refresh`): standardise on `hover:bg-reps-panel-soft hover:text-white` + visible 1px border lift, remove the conflicting shadcn default `hover:bg-accent` leaking through `className` order.
- Top-bar icon buttons (Bell, avatar): add proper `hover:bg-reps-panel-soft` instead of the current invisible state.
- Verify every hover via the live preview before claiming done.

### 4. Roll the pattern to the other offenders (same pass)
Same "fold body toolbar into TopBar" fix applied to the other dashboard pages doing the duplicate-bar thing:
- `/dashboard/clients`
- `/dashboard/calendar`
- `/dashboard/bookings`
- `/dashboard/messages`
- `/dashboard/reviews`
- `/dashboard/reports`
- `/dashboard/content`
- `/dashboard/community`
- `/dashboard/programs`, `/dashboard/nutrition`, `/dashboard/check-ins`

For each: if it has a body-level title + search/action row, move them into the shell `title`/`subtitle`/`search`/`actions` props and remove the body block. Pages that are pure mock-ups with no real search (e.g. Calendar) just get their action buttons moved up.

### 5. Out of scope (parked)
- No new functionality. No backend changes.
- Calendar / Bookings / Messages / Reviews logic still parked for their dedicated mockup passes — this turn is purely chrome consolidation + hover polish.
- /dashboard/profile is already correct (it's the reference) — no changes there.

## Quality bar — is it 10/10 after this?

For the **leads page specifically**: yes. One title. One search. One row of actions in the top bar. Panel becomes pure content. Hover states consistent. That's world-class dashboard chrome.

For the **product as a whole**: still not 10/10 until Calendar / Bookings / Messages / Reviews get their real mockup passes — but you've already scoped those as separate passes, so that's fine. This pass closes the chrome-consistency gap so every dashboard page reads as the same product.

## Files touched
- `src/components/dashboard/DashboardShell.tsx` (add `search` prop, wire ⌘K, hover polish on top-bar buttons)
- `src/routes/_authenticated/_professional/_pro/dashboard_.leads.tsx` (delete toolbar + inner search + panel heading, pass to shell, hover audit)
- The ~10 other `dashboard_.*.tsx` route files that currently duplicate the bar (same shape of edit)

Approve and I'll ship it.
