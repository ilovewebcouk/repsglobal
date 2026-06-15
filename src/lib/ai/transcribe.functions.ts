import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  audioBase64: z.string().min(1),
  format: z.enum(["webm", "mp4", "m4a", "wav", "mp3", "ogg"]),
});

/**
 * Transcribe a recorded audio blob via the Lovable AI Gateway.
 * Uses Gemini (multimodal audio in → text out) — record→stop→transcribe UX.
 */
export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a transcription engine. Return ONLY the verbatim transcript of the audio in plain text. No preamble, no quotation marks, no commentary. Preserve sentence punctuation. If the audio is silent or unintelligible, return an empty string.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio." },
              {
                type: "input_audio",
                input_audio: { data: data.audioBase64, format: data.format },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Transcription failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const json: any = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    return { text: text.trim() };
  });
