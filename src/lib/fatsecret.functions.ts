// Client-safe server-fn wrappers around the FatSecret Platform API.
// Until NUTRITION_API_ENABLED=true and credentials are set, these return
// empty/null results so callers can render a static fallback safely.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  type FoodDetail,
  type FoodSummary,
  getFoodByIdRaw,
  isNutritionApiEnabled,
  lookupBarcodeRaw,
  searchFoodsRaw,
} from "./fatsecret.server";

export type { FoodDetail, FoodServing, FoodSummary } from "./fatsecret.server";

export const searchFoods = createServerFn({ method: "GET" })
  .inputValidator((input: { term: string; max?: number }) =>
    z.object({ term: z.string().min(1).max(100), max: z.number().int().min(1).max(50).optional() }).parse(input),
  )
  .handler(async ({ data }): Promise<FoodSummary[]> => {
    if (!isNutritionApiEnabled()) return [];
    try {
      return await searchFoodsRaw(data.term, data.max ?? 20);
    } catch (err) {
      console.error("[fatsecret] searchFoods failed", err);
      return [];
    }
  });

export const getFoodById = createServerFn({ method: "GET" })
  .inputValidator((input: { foodId: string }) =>
    z.object({ foodId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<FoodDetail | null> => {
    if (!isNutritionApiEnabled()) return null;
    try {
      return await getFoodByIdRaw(data.foodId);
    } catch (err) {
      console.error("[fatsecret] getFoodById failed", err);
      return null;
    }
  });

export const lookupBarcode = createServerFn({ method: "GET" })
  .inputValidator((input: { barcode: string }) =>
    z.object({ barcode: z.string().regex(/^\d{8,14}$/) }).parse(input),
  )
  .handler(async ({ data }): Promise<string | null> => {
    if (!isNutritionApiEnabled()) return null;
    try {
      return await lookupBarcodeRaw(data.barcode);
    } catch (err) {
      console.error("[fatsecret] lookupBarcode failed", err);
      return null;
    }
  });
