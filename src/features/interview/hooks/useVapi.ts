"use client";

import { useCallback, useRef, useState } from "react";

export type VapiStatus = "idle" | "connecting" | "active" | "speaking" | "listening" | "ended";

interface UseVapiOptions {
  sessionId: string;
  onTranscript?: (text: string, role: "user" | "assistant") => void;
  onStateUpdate?: (state: unknown) => void;
  onEnd?: () => void;
}

// Vapi Web SDK wrapper.
// We lazy-load Vapi to avoid SSR issues.
export function useVapi({ sessionId, onTranscript, onStateUpdate, onEnd }: UseVapiOptions) {
  const vapiRef = useRef<any>(null);
  const [status, setStatus] = useState<VapiStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const start = useCallback(async () => {
    setStatus("connecting");

    const { default: Vapi } = await import("@vapi-ai/web");

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    vapiRef.current = vapi;

    vapi.on("call-start", () => setStatus("active"));
    vapi.on("call-end", () => {
      setStatus("ended");
      onEnd?.();
    });
    vapi.on("speech-start", () => setStatus("speaking"));
    vapi.on("speech-end", () => setStatus("listening"));
    vapi.on("volume-level", (level: number) => setVolumeLevel(level));

    vapi.on("message", (msg: any) => {
      if (msg.type === "transcript") {
        onTranscript?.(msg.transcript, msg.role);
      }

      // Our backend sends state updates via function call messages
      if (msg.type === "function-call" && msg.functionCall?.name === "stateUpdate") {
        onStateUpdate?.(JSON.parse(msg.functionCall.parameters?.state ?? "{}"));
      }
    });

    await vapi.start({
      // Custom LLM mode: Vapi sends speech to our backend
      model: {
        provider: "custom-llm",
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
        model: "intervue-v1",
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel — neutral, professional
      },
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      metadata: {
        sessionId,
      },
      firstMessage:
        "Hello, I'm ready to begin. Please go ahead and introduce yourself.",
    });
  }, [sessionId, onTranscript, onStateUpdate, onEnd]);

  const stop = useCallback(() => {
    vapiRef.current?.stop();
  }, []);

  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;
    const next = !isMuted;
    vapiRef.current.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  return { start, stop, toggleMute, status, isMuted, volumeLevel };
}
