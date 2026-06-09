// Public server functions for the coaching page to pull a real, curated
// exercise set + a featured video clip from the upstream exercise media API.
//
// On failure (missing key, network error, rate limit) these return empty
// state so the marketing page can fall back gracefully without breaking.

import { createServerFn } from "@tanstack/react-start";
import {
  getExerciseByIdRaw,
  searchExercisesRaw,
  type ExerciseDetail,
} from "./exercisedb.server";

export type ExerciseCategory = "lower" | "upper" | "cond";

export type CuratedExercise = {
  exerciseId: string;
  name: string;
  imageUrl: string;
  category: ExerciseCategory;
};

export type FeaturedExercise = {
  exerciseId: string;
  name: string;
  videoUrl: string;
  posterUrl: string;
  bodyPart?: string;
  equipment?: string;
};

// Curated terms tagged with a coaching category so the library tabs are
// always populated, even with only 12-15 fetched records.
const CURATED_TERMS: { term: string; category: ExerciseCategory }[] = [
  // Lower
  { term: "back squat", category: "lower" },
  { term: "romanian deadlift", category: "lower" },
  { term: "bulgarian split squat", category: "lower" },
  { term: "hip thrust", category: "lower" },
  { term: "walking lunge", category: "lower" },
  // Upper
  { term: "bench press", category: "upper" },
  { term: "pull up", category: "upper" },
  { term: "overhead press", category: "upper" },
  { term: "bent over row", category: "upper" },
  { term: "lat pulldown", category: "upper" },
  // Conditioning
  { term: "kettlebell swing", category: "cond" },
  { term: "assault bike", category: "cond" },
  { term: "burpee", category: "cond" },
  { term: "box jump", category: "cond" },
  { term: "battle rope", category: "cond" },
];

// Bench Press — featured demo (universally recognisable, loops cleanly).
const FEATURED_EXERCISE_ID = "exr_41n2hxnFMotsXTj3";

export const getCoachingExerciseShowcase = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    curated: CuratedExercise[];
    featured: FeaturedExercise | null;
  }> => {
    try {
      const settled = await Promise.allSettled(
        CURATED_TERMS.map((t) => searchExercisesRaw(t.term)),
      );

      const curated: CuratedExercise[] = [];
      const seen = new Set<string>();
      settled.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const first = r.value[0];
        if (!first || seen.has(first.exerciseId)) return;
        seen.add(first.exerciseId);
        curated.push({
          exerciseId: first.exerciseId,
          name: first.name.trim(),
          imageUrl: first.imageUrl,
          category: CURATED_TERMS[i].category,
        });
      });

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
