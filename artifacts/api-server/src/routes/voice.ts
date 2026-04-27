import { Router, type IRouter } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { GenerateVoiceBody, type Voice } from "@workspace/api-zod";

const router: IRouter = Router();

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

const VOICES: Voice[] = [
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "Calm, narrative female voice — great for storytelling",
  },
  {
    id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    description: "Strong, confident female voice — ideal for motivational talks",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    description: "Soft, friendly female voice — perfect for educational content",
  },
  {
    id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    description: "Warm, well-rounded male voice — versatile for any tone",
  },
  {
    id: "VR6AewLTigWG4xSOukaG",
    name: "Arnold",
    description: "Crisp, authoritative male voice — perfect for narration",
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    description: "Deep, resonant male voice — cinematic and dramatic",
  },
];

function shapeTextForMode(text: string, mode: string): string {
  const trimmed = text.trim();
  switch (mode) {
    case "motivational":
      return `Listen closely. ${trimmed} You've got this — keep pushing forward.`;
    case "storytelling":
      return `Let me tell you a story. ${trimmed} ...And that, is how it unfolded.`;
    case "educational":
      return `Today, we're going to learn something important. ${trimmed} Remember this — it matters.`;
    case "plain":
    default:
      return trimmed;
  }
}

function extractUpstreamMessage(detail: string, fallback: string): string {
  try {
    const parsed = JSON.parse(detail) as { detail?: unknown };
    const d = parsed.detail;
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && "message" in d) {
      const msg = (d as { message?: unknown }).message;
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
  } catch {
    // not JSON
  }
  return fallback;
}

router.get("/voices", (_req, res) => {
  res.json(VOICES);
});

router.post("/generate-voice", async (req, res): Promise<void> => {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) {
    req.log.error("ELEVENLABS_API_KEY is not configured");
    res.status(502).json({ error: "Voice provider is not configured on the server." });
    return;
  }

  const parsed = GenerateVoiceBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid generate-voice body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, voiceId, stability, similarityBoost, mode } = parsed.data;
  const processedText = shapeTextForMode(text, mode);

  const url = `${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(voiceId)}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: processedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to reach ElevenLabs");
    res.status(502).json({ error: "Failed to reach voice provider." });
    return;
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    req.log.error(
      { status: upstream.status, detail },
      "ElevenLabs returned non-OK status",
    );
    const fallback =
      upstream.status === 401
        ? "Voice provider rejected the API key."
        : `Voice provider error (${upstream.status}).`;
    const message = extractUpstreamMessage(detail, fallback);
    res.status(502).json({ error: message });
    return;
  }

  if (!upstream.body) {
    req.log.error("ElevenLabs response had no body to stream");
    res.status(502).json({ error: "Voice provider returned an empty response." });
    return;
  }

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  const upstreamLength = upstream.headers.get("content-length");
  if (upstreamLength) {
    res.setHeader("Content-Length", upstreamLength);
  }

  const nodeStream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);

  try {
    await pipeline(nodeStream, res);
  } catch (err) {
    req.log.error({ err }, "Error while streaming audio from ElevenLabs");
    if (!res.headersSent) {
      res.status(502).json({ error: "Failed while streaming audio from voice provider." });
    } else if (!res.writableEnded) {
      res.destroy(err as Error);
    }
  }
});

export default router;
