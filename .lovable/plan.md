## Match price lockup to title size (per mock-up)

In the mock-up, `From £60` is the **same size and weight as the title** (`Personal Training`), and `per session` is a small lowercase line directly underneath — not uppercase, not tracked.

### Current vs target

| | Current | Target (mock-up) |
|---|---|---|
| Price | `text-[22px]` bold | `text-[15px]` bold (same as title) |
| Unit | `text-[11px] uppercase tracking-wider` | `text-[12px]` lowercase, no tracking |
| Spacing | `mt-1` | tight (`mt-0.5`) |

### Change

`src/routes/pro.$slug.tsx` price block (lines 441-448):

```tsx
<div className="pt-1">
  <div className="font-display text-[15px] font-bold leading-tight text-white">
    {s.price}
  </div>
  <div className="mt-0.5 text-[12px] text-white/60">
    {s.unit}
  </div>
</div>
```

### Out of scope

Title, description, image, icon badge, header link, and all other sections unchanged.
