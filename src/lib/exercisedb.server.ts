// Server-only helpers for the Ascend ExerciseDB v2 API (via RapidAPI).
// Never import from client code — keep the X-RapidAPI-Key on the server.

const HOST = "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com";
const BASE = `https://${HOST}`;

export type ExerciseSummary = {
  exerciseId: string;
  name: string;
  imageUrl: string;
};

export type ExerciseDetail = {
  exerciseId: string;
  name: string;
  imageUrl: string;
  imageUrls?: { "360p"?: string; "480p"?: string; "720p"?: string; "1080p"?: string };
  videoUrl?: string;
  equipments?: string[];
  bodyParts?: string[];
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  exerciseType?: string;
  overview?: string;
  instructions?: string[];
};

function getKey(): string {
  const key = process.env.RAPIDAPI_EXERCISEDB_KEY;
  if (!key) throw new Error("RAPIDAPI_EXERCISEDB_KEY is not configured");
  return key;
}

async function edbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "X-RapidAPI-Key": getKey(),
      "X-RapidAPI-Host": HOST,
    },
  });
  if (!res.ok) {
    throw new Error(`ExerciseDB ${path} failed: ${res.status}`);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  if (!json.success) throw new Error(`ExerciseDB ${path} returned success=false`);
  return json.data;
}

// 24h in-memory cache (per server instance; safe for our marketing use)
const cache = new Map<string, { value: unknown; expires: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await loader();
  cache.set(key, { value, expires: Date.now() + TTL_MS });
  return value;
}

export async function searchExercisesRaw(term: string): Promise<ExerciseSummary[]> {
  return cached(`search:${term}`, () =>
    edbFetch<ExerciseSummary[]>(`/api/v1/exercises/search?search=${encodeURIComponent(term)}`),
  );
}

export async function getExerciseByIdRaw(id: string): Promise<ExerciseDetail> {
  return cached(`exercise:${id}`, () =>
    edbFetch<ExerciseDetail>(`/api/v1/exercises/${encodeURIComponent(id)}`),
  );
}
