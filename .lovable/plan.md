## Change

In `src/routes/index.tsx` (inline stats row inside the "We set the bar" trust block, lines ~459–472):

- Remove the orange-circle icon `<span>` that wraps `<s.icon />` from each stat cell.
- Keep the value (large number) and label — pure typographic row.
- Leave the `stats` array's `icon` field in place (unused, harmless) so nothing else needs to change. The Users / Star / Globe / Calendar imports stay because they're still referenced in the array.

Result: stats row reads as 4 typographic cells (number + label), the trust pillars above keep their orange icons, and the block stops looking like 8 orange circles stacked.

Nothing else changes — pillars, pull-quote, surrounding sections all untouched.