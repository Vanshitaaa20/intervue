"use client";

import { useCallback, useState } from "react";
import type { VapiStatus } from "./useVapi";

interface UseTextInterviewOptions {
  sessionId: string;
  onTranscript?: (text: string, role: "user" | "assistant") => void;
  onStateUpdate?: (state: unknown) => void;
  onEnd?: () => void;
}

export function useTextInterview({
  sessionId,
  onTranscript,
  onStateUpdate,
  onEnd,
}: UseTextInterviewOptions) {
  const [status, setStatus] = useState<VapiStatus>("idle");
  const [pendingInput, setPendingInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const start = useCallback(async () => {
    setStatus("active");

    // Fetch session to get the opening message from state
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/interview/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.state?.transcript?.length > 0) {
      // Resumed session — replay transcript
      for (const entry of data.state.transcript) {
        if (entry.spokenResponse) {
          onTranscript?.(entry.spokenResponse, "assistant");
        }
        if (entry.candidateInput) {
          onTranscript?.(entry.candidateInput, "user");
        }
      }
    } else {
      // Fresh session — show opening greeting
      onTranscript?.(
        "Hello! I'm your interviewer today. Let's start with a brief introduction — tell me about yourself and your background.",
        "assistant"
      );
    }

    onStateUpdate?.(data.state);
  }, [sessionId, onTranscript, onStateUpdate]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking) return;
      setIsThinking(true);
      setStatus("listening");

      onTranscript?.(text, "user");

      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`/api/interview/${sessionId}/turn`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transcript: text }),
        });

        const data = await res.json();

        if (!res.ok) {
          onTranscript?.(
            `Error: ${data.error ?? "Something went wrong. Please try again."}`,
            "assistant"
          );
          setIsThinking(false);
          setStatus("active");
          return;
        }

        setStatus("speaking");
        onTranscript?.(data.response, "assistant");
        onStateUpdate?.(data.state);

        if (data.shouldEndInterview) {
          setStatus("ended");
          setTimeout(() => onEnd?.(), 1200);
        } else {
          setStatus("active");
        }
      } catch {
        onTranscript?.("Network error — please try again.", "assistant");
        setStatus("active");
      } finally {
        setIsThinking(false);
      }
    },
    [sessionId, isThinking, onTranscript, onStateUpdate, onEnd]
  );

  const stop = useCallback(() => {
    setStatus("ended");
    onEnd?.();
  }, [onEnd]);

  return {
    status,
    isThinking,
    pendingInput,
    setPendingInput,
    start,
    sendMessage,
    stop,
    // Stub these to match useVapi interface
    toggleMute: () => {},
    isMuted: false,
    volumeLevel: 0,
  };
}
