// Public server functions for the coaching page to pull a real, curated
// exercise set + a featured video clip from Ascend ExerciseDB v2.
//
// On failure (missing key, network error, rate limit) these return null so
// the marketing page can fall back to its static mock without breaking.

import { createServerFn } from "@tanstack/react-start";
import {
  getExerciseByIdRaw,
  searchExercisesRaw,
  type ExerciseDetail,
} from "./exercisedb.server";

export type CuratedExercise = {
  exerciseId: string;
  name: string;
  imageUrl: string;
};

export type FeaturedExercise = {
  exerciseId: string;
  name: string;
  videoUrl: string;
  posterUrl: string;
  bodyPart?: string;
  equipment?: string;
};

// 12 curated terms — broad coverage of lower / upper / conditioning.
const CURATED_TERMS = [
  "bench press",
  "back squat",
  "romanian deadlift",
  "pull up",
  "overhead press",
  "bulgarian split squat",
  "hip thrust",
  "bent over row",
  "lat pulldown",
  "plank",
  "kettlebell swing",
  "assault bike",
];

// Bench Press — picked as the featured demo because it's universally
// recognisable and renders cleanly as a looping video.
const FEATURED_EXERCISE_ID = "exr_41n2hxnFMotsXTj3";

export const getCoachingExerciseShowcase = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    curated: CuratedExercise[];
    featured: FeaturedExercise | null;
  }> => {
    try {
      // Fire all curated searches in parallel; one bad term shouldn't kill the page.
      const settled = await Promise.allSettled(
        CURATED_TERMS.map((t) => searchExercisesRaw(t)),
      );

      const curated: CuratedExercise[] = [];
      const seen = new Set<string>();
      for (const r of settled) {
        if (r.status !== "fulfilled") continue;
        const first = r.value[0];
        if (!first || seen.has(first.exerciseId)) continue;
        seen.add(first.exerciseId);
        curated.push({
          exerciseId: first.exerciseId,
          name: first.name.trim(),
          imageUrl: first.imageUrl,
        });
      }

      let featured: FeaturedExercise | null = null;
      try {
        const d: ExerciseDetail = await getExerciseByIdRaw(FEATURED_EXERCISE_ID);
        if (d.videoUrl) {
          featured = {
            exerciseId: d.exerciseId,
            name: d.name,
            videoUrl: d.videoUrl,
            posterUrl: d.imageUrls?.["720p"] ?? d.imageUrl,
            bodyPart: d.bodyParts?.[0],
            equipment: d.equipments?.[0],
          };
        }
      } catch {
        featured = null;
      }

      return { curated, featured };
    } catch {
      return { curated: [], featured: null };
    }
  },
);
