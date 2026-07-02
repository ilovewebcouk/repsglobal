import Stripe from 'stripe';
const key = process.env.STRIPE_SECRET_KEY_LIVE;
if (!key) { console.error('NO STRIPE KEY'); process.exit(1); }
const stripe = new Stripe(key);

// 1. Find prices by lookup_key
const prices = await stripe.prices.list({ lookup_keys: ['verified_annual','verified_legacy_annual'], expand: ['data.product'], limit: 20 });
console.log('== prices with verified lookup keys ==');
for (const p of prices.data) {
  console.log(`- ${p.id}  lookup=${p.lookup_key}  amount=${p.unit_amount} ${p.currency}  active=${p.active}  product=${p.product.name}`);
}

// 2. Search all GBP recurring prices for the verified product(s)
const productIds = [...new Set(prices.data.map(p => p.product.id))];
for (const pid of productIds) {
  const all = await stripe.prices.list({ product: pid, limit: 100 });
  console.log(`\n== all prices on product ${pid} ==`);
  for (const p of all.data) {
    console.log(`- ${p.id}  lookup=${p.lookup_key}  amount=${p.unit_amount} ${p.currency}  interval=${p.recurring?.interval}  active=${p.active}`);
  }
}

// 3. Count active subs per price
console.log('\n== active subscriptions grouped by price ==');
const counts = {};
let starting_after;
let total = 0;
while (true) {
  const subs = await stripe.subscriptions.list({ status: 'active', limit: 100, ...(starting_after ? { starting_after } : {}) });
  for (const s of subs.data) {
    total++;
    for (const item of s.items.data) {
      const key = `${item.price.id}|${item.price.unit_amount}|${item.price.lookup_key ?? ''}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  if (!subs.has_more) break;
  starting_after = subs.data[subs.data.length - 1].id;
}
console.log(`total active subs: ${total}`);
for (const [k, v] of Object.entries(counts).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${v}× ${k}`);
}

// Also non-active states worth knowing
console.log('\n== all subs by status ==');
const byStatus = {};
starting_after = undefined;
while (true) {
  const subs = await stripe.subscriptions.list({ status: 'all', limit: 100, ...(starting_after ? { starting_after } : {}) });
  for (const s of subs.data) byStatus[s.status] = (byStatus[s.status]||0)+1;
  if (!subs.has_more) break;
  starting_after = subs.data[subs.data.length - 1].id;
}
console.log(byStatus);
