import { render } from '@react-email/render/node';
import React from 'react';
import { template } from '../src/lib/email-templates/legacy-conversion-confirmation.tsx';
const html = await render(React.createElement(template.component, {
  proName: 'Katie',
  renewalDate: '14 March 2027',
  amount: '£99', previousAmount: '£34',
  cardBrand: 'Visa', cardLast4: '4242',
  manageBillingUrl: 'https://repsuk.org/dashboard/settings',
  settingsUrl: 'https://repsuk.org/dashboard/settings',
}));
process.stdout.write(html);
