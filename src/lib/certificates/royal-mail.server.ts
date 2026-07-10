/**
 * Royal Mail Click & Drop API client — server-only helper.
 *
 * Docs: https://api.parcel.royalmail.com/#tag/Orders
 *
 * We use two calls:
 *   POST /api/v1/orders              → create the shipment order
 *   POST /api/v1/orders/label        → return the shipping-label PDF (base64)
 *
 * Auth: single API token from Click & Drop → Settings → Integrations →
 * "Create API application". Stored as `ROYAL_MAIL_CLICK_DROP_API_KEY`.
 */

const RM_BASE = "https://api.parcel.royalmail.com/api/v1";

// Service codes.  Full list in the Click & Drop portal — we surface two.
export const RM_SERVICE = {
  TPN: { code: "TPN", label: "Royal Mail Tracked 48" },
  TPS: { code: "TPS", label: "Royal Mail Tracked 24" },
  MTM: { code: "MTM", label: "Royal Mail International Tracked" },
  MTL: { code: "MTL", label: "Royal Mail International Tracked & Signed" },
} as const;
export type RmServiceCode = keyof typeof RM_SERVICE;

export type RmAddress = {
  fullName: string;
  companyName?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  addressLine3?: string | null;
  city: string;
  county?: string | null;
  postcode: string;
  countryCode?: string; // ISO 3166-1 alpha-2, defaults to "GB"
  phoneNumber?: string | null;
  emailAddress?: string | null;
};

function requireApiKey(): string {
  const key = process.env.ROYAL_MAIL_CLICK_DROP_API_KEY;
  if (!key) {
    throw new Error(
      "ROYAL_MAIL_CLICK_DROP_API_KEY is not configured. Add it in project secrets.",
    );
  }
  return key;
}

async function rmFetch(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown } = { method: "GET" },
) {
  const res = await fetch(`${RM_BASE}${path}`, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: requireApiKey(),
      Accept: "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    // Relay the exact Royal Mail error body — matches gateway-style error rules.
    throw new Error(
      `Royal Mail Click & Drop ${res.status}: ${text || res.statusText}`,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export type CreateRmOrderInput = {
  orderReference: string; // our batch id
  serviceCode: RmServiceCode | string;
  recipient: RmAddress;
  weightGrams: number; // total shipment weight
  itemCount: number; // certificates in the shipment
  specialInstructions?: string | null;
};

export type CreateRmOrderResult = {
  orderIdentifier: number; // Click & Drop numeric id
  orderReference: string;
  trackingNumber: string | null;
  createdOn: string;
};

export async function createRoyalMailOrder(
  input: CreateRmOrderInput,
): Promise<CreateRmOrderResult> {
  const grams = Math.max(50, Math.min(2000, Math.round(input.weightGrams)));

  const body = {
    items: [
      {
        orderReference: input.orderReference,
        recipient: {
          address: {
            fullName: input.recipient.fullName,
            companyName: input.recipient.companyName ?? "",
            addressLine1: input.recipient.addressLine1,
            addressLine2: input.recipient.addressLine2 ?? "",
            addressLine3: input.recipient.addressLine3 ?? "",
            city: input.recipient.city,
            county: input.recipient.county ?? "",
            postcode: input.recipient.postcode.toUpperCase(),
            countryCode: (input.recipient.countryCode ?? "GB").toUpperCase(),
          },
          phoneNumber: input.recipient.phoneNumber ?? "",
          emailAddress: input.recipient.emailAddress ?? "",
        },
        billing: {
          address: {
            fullName: input.recipient.fullName,
            companyName: input.recipient.companyName ?? "",
            addressLine1: input.recipient.addressLine1,
            addressLine2: input.recipient.addressLine2 ?? "",
            addressLine3: input.recipient.addressLine3 ?? "",
            city: input.recipient.city,
            county: input.recipient.county ?? "",
            postcode: input.recipient.postcode.toUpperCase(),
            countryCode: (input.recipient.countryCode ?? "GB").toUpperCase(),
          },
        },
        packages: [
          {
            weightInGrams: grams,
            packageFormatIdentifier: "largeLetter",
          },
        ],
        orderDate: new Date().toISOString(),
        subtotal: 0,
        shippingCostCharged: 0,
        total: 0,
        shippingService: { serviceCode: input.serviceCode },
        label: { includeLabelInResponse: false },
        specialInstructions: input.specialInstructions ?? "",
      },
    ],
  };

  const resp = (await rmFetch("/orders", { method: "POST", body })) as {
    createdOrders?: Array<{
      orderIdentifier: number;
      orderReference: string;
      trackingNumber?: string | null;
      createdOn: string;
    }>;
    failedOrders?: Array<{ orderReference: string; errors: Array<{ errorMessage: string }> }>;
  };

  const failed = resp.failedOrders?.[0];
  if (failed) {
    const msg = failed.errors?.map((e) => e.errorMessage).join("; ") ?? "unknown";
    throw new Error(`Royal Mail rejected order ${failed.orderReference}: ${msg}`);
  }
  const created = resp.createdOrders?.[0];
  if (!created) {
    throw new Error("Royal Mail response contained no created order.");
  }
  return {
    orderIdentifier: created.orderIdentifier,
    orderReference: created.orderReference,
    trackingNumber: created.trackingNumber ?? null,
    createdOn: created.createdOn,
  };
}

/** Returns a base64-encoded PDF of the shipping label. */
export async function generateRoyalMailLabel(
  orderIdentifier: number,
): Promise<Uint8Array> {
  const body = {
    orderIdentifiers: [orderIdentifier],
    documentType: "postageLabel",
    includeReturnsLabel: false,
    includeCN22CN23: false,
  };
  const resp = (await rmFetch("/orders/label", { method: "POST", body })) as {
    label?: string; // base64
    labelErrors?: Array<{ orderIdentifier: number; errorMessage: string }>;
  };
  if (resp.labelErrors && resp.labelErrors.length > 0) {
    throw new Error(
      `Royal Mail label error: ${resp.labelErrors.map((e) => e.errorMessage).join("; ")}`,
    );
  }
  if (!resp.label) throw new Error("Royal Mail returned no label PDF.");
  // Node/Worker: Buffer + atob both available; use Buffer.
  const buf = Buffer.from(resp.label, "base64");
  return new Uint8Array(buf);
}

export function buildTrackingUrl(trackingNumber: string): string {
  return `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(
    trackingNumber,
  )}`;
}

/** Rough weight estimate: A4 cert @ ~5g + envelope 25g. */
export function estimateShipmentWeightGrams(certificateCount: number): number {
  return 25 + certificateCount * 5;
}
