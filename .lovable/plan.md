## Problem

In `src/routes/_authenticated/_professional/dashboard_.profile.tsx` the shared `Field` wrapper (line 208) renders as a `<label>`:

```tsx
<label className={`flex flex-col gap-1.5 ${className}`}>
  <span>{label}</span>
  {children}
  {hint ? <span>{hint}</span> : null}
</label>
```

Native `<label>` behaviour: a click anywhere inside it forwards to the first focusable control. For the "How you work with clients" row that control is the **In person** ToggleGroupItem — so clicking the hint text, the row padding, the gap between pills, or the "Hybrid" status pill toggles "In person" on/off. The same trap applies to every other `Field` that contains a `ToggleGroup`, `RadioGroup`, `Checkbox`, `Switch`, or multi-control composition.

Wrapping multiple distinct controls (and decorative status badges) in a single `<label>` is the bug. Labels should only wrap one control.

## Fix

Change `Field` to render a `<div>` instead of `<label>`, and render the label text as a non-interactive `<span>`. This stops the entire row from being a click proxy, while keeping the visual layout identical. Inputs/textarea/select inside Fields already have their own accessible names via the label text and aria, and users interact with them by clicking the actual control.

### Change in `src/routes/_authenticated/_professional/dashboard_.profile.tsx`

```tsx
function Field({ label, children, hint, className = "" }: { ... }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[12px] font-medium text-white/70">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-white/45">{hint}</span> : null}
    </div>
  );
}
```

That single change fixes the "click anywhere toggles In person" bug across the whole profile editor — including the tagline char counter row, the bio row, the work-mode row, and every future Field.

## Verification (must complete before declaring fixed)

1. Hard reload `/dashboard/profile`.
2. Click in empty space inside the "How you work with clients" row (around the pills, on the hint text, on the Hybrid badge) → confirm **In person / Online state does NOT change**.
3. Click the pills themselves → confirm they still toggle and Hybrid badge appears when both are on.
4. Spot-check other Fields: clicking the hint under Tagline / Bio / Postcode does not focus or mutate anything unexpected; clicking inside text inputs still focuses them as before.
5. Re-screenshot the row to confirm no visual regression.

## Out of scope

- No visual changes.
- No changes to the `DeliveryModePicker` toggle group itself — last turn's width fix stands.
- Accessibility upgrade (giving each input a real `htmlFor`/`id` pair) is a separate, larger pass and not required to fix this bug.
