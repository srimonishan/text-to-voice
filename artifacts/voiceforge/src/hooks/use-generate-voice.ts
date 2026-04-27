import { useMutation } from "@tanstack/react-query";
import type { ContentMode } from "@workspace/api-client-react";

export interface GenerateVoiceRequest {
  text: string;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  mode: ContentMode;
}

export function useGenerateVoiceAudio() {
  return useMutation({
    mutationFn: async (data: GenerateVoiceRequest) => {
      const res = await fetch(`${import.meta.env.BASE_URL}api/generate-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(errorData.error || "Generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      return { blob, url };
    },
  });
}
