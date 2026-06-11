## Centre all text in the /auth left column

1. Add `text-center` to the inner content wrapper (`<div className="w-full max-w-[400px]">`) so the headline, lede, form labels, divider text, buttons and footer all read centred.
2. Form inputs and buttons remain full-width within the centred text block (inputs are block elements so they stay left-aligned internally, which is correct for form controls).
3. No other layout changes — right column `ShopFrontMock` stays as-is.