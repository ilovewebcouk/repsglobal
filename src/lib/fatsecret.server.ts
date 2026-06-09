// Server-only helpers for the FatSecret Platform REST API.
// OAuth 1.0a HMAC-SHA1 signed requests. Never import from client code.
//
// Activation: set FATSECRET_CONSUMER_KEY + FATSECRET_CONSUMER_SECRET secrets,
// then set NUTRITION_API_ENABLED=true. Until then `isNutritionApiEnabled()`
// returns false and callers fall back to static mock data.

import { createHmac, randomBytes } from "node:crypto";

const BASE = "https://platform.fatsecret.com/rest/server.api";

export function isNutritionApiEnabled(): boolean {
  return process.env.NUTRITION_API_ENABLED === "true";
}

function getCreds(): { key: string; secret: string } {
  const key = process.env.FATSECRET_CONSUMER_KEY;
  const secret = process.env.FATSECRET_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error("FatSecret credentials not configured");
  }
  return { key, secret };
}

// RFC 3986 percent-encoding (stricter than encodeURIComponent for !*'())
function rfc3986(input: string): string {
  return encodeURIComponent(input).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function sign(params: Record<string, string>, consumerSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`)
    .join("&");
  const base = ["POST", rfc3986(BASE), rfc3986(sorted)].join("&");
  const signingKey = `${rfc3986(consumerSecret)}&`; // no token secret (2-legged)
  return createHmac("sha1", signingKey).update(base).digest("base64");
}

async function fsCall<T>(method: string, extra: Record<string, string>): Promise<T> {
  const { key, secret } = getCreds();
  const params: Record<string, string> = {
    method,
    format: "json",
    oauth_consumer_key: key,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    ...extra,
  };
  params.oauth_signature = sign(params, secret);

  const body = new URLSearchParams(params).toString();
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`FatSecret ${method} failed: ${res.status}`);
  const json = (await res.json()) as { error?: { code: number; message: string } } & T;
  if ("error" in json && json.error) {
    throw new Error(`FatSecret ${method}: ${json.error.message}`);
  }
  return json;
}

// 24h in-memory cache (per server instance)
const cache = new Map<string, { value: unknown; expires: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await loader();
  cache.set(key, { value, expires: Date.now() + TTL_MS });
  return value;
}

// --- Public types ---

export type FoodSummary = {
  foodId: string;
  name: string;
  brand?: string;
  description?: string;
};

export type FoodServing = {
  servingId: string;
  description: string;
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  fiber?: number;
  sugar?: number;
};

export type FoodDetail = {
  foodId: string;
  name: string;
  brand?: string;
  type?: string;
  servings: FoodServing[];
};

// --- API surface ---

export async function searchFoodsRaw(term: string, max = 20): Promise<FoodSummary[]> {
  return cached(`search:${term}:${max}`, async () => {
    const json = await fsCall<{ foods_search?: { results?: { food?: unknown[] | unknown } } }>(
      "foods.search.v3",
      { search_expression: term, max_results: String(max) },
    );
    const raw = json.foods_search?.results?.food;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return list.map((f) => {
      const x = f as Record<string, string>;
      return {
        foodId: x.food_id,
        name: x.food_name,
        brand: x.brand_name,
        description: x.food_description,
      };
    });
  });
}

export async function getFoodByIdRaw(foodId: string): Promise<FoodDetail> {
  return cached(`food:${foodId}`, async () => {
    const json = await fsCall<{ food: Record<string, unknown> }>("food.get.v4", {
      food_id: foodId,
    });
    const f = json.food;
    const rawServings = (f.servings as { serving?: unknown[] | unknown } | undefined)?.serving;
    const list = Array.isArray(rawServings) ? rawServings : rawServings ? [rawServings] : [];
    return {
      foodId: f.food_id as string,
      name: f.food_name as string,
      brand: f.brand_name as string | undefined,
      type: f.food_type as string | undefined,
      servings: list.map((s) => {
        const x = s as Record<string, string>;
        return {
          servingId: x.serving_id,
          description: x.serving_description,
          calories: Number(x.calories) || 0,
          protein: Number(x.protein) || 0,
          carbohydrate: Number(x.carbohydrate) || 0,
          fat: Number(x.fat) || 0,
          fiber: x.fiber !== undefined ? Number(x.fiber) : undefined,
          sugar: x.sugar !== undefined ? Number(x.sugar) : undefined,
        };
      }),
    };
  });
}

export async function lookupBarcodeRaw(barcode: string): Promise<string | null> {
  return cached(`barcode:${barcode}`, async () => {
    const json = await fsCall<{ food_id?: { value?: string } }>("food.find_id_for_barcode", {
      barcode,
    });
    const value = json.food_id?.value;
    return value && value !== "0" ? value : null;
  });
}
