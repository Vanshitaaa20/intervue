"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CompetencyProgress } from "@/features/interview/components/CompetencyProgress";
import { useVapi } from "@/features/interview/hooks/useVapi";
import { useTextInterview } from "@/features/interview/hooks/useTextInterview";
import { DebugPanel } from "@/features/debug/DebugPanel";
import type { InterviewState } from "@/engine/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

const VOICE_CONFIGURED =
  process.env.NEXT_PUBLIC_INTERVIEW_MODE === "voice" &&
  Boolean(process.env.NEXT_PUBLIC_VAPI_API_KEY);

export default function InterviewPage({ params }: PageProps) {
  const { id: sessionId } = use(params);
  const router = useRouter();

  const [interviewState, setInterviewState] = useState<InterviewState | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [debugVisible, setDebugVisible] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [useVoice, setUseVoice] = useState(VOICE_CONFIGURED);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/interview/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.state) setInterviewState(d.state); })
      .catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "D") setDebugVisible((v) => !v);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleTranscript = useCallback((text: string, role: "user" | "assistant") => {
    setTranscript((prev) => [
      ...prev,
      { id: `${Date.now()}-${role}`, role, text, timestamp: Date.now() },
    ]);
  }, []);

  const handleStateUpdate = useCallback((state: unknown) => {
    setInterviewState(state as InterviewState);
  }, []);

  const handleEnd = useCallback(() => {
    router.push(`/report/${sessionId}`);
  }, [router, sessionId]);

  // Voice mode (Vapi)
  const vapi = useVapi({
    sessionId,
    onTranscript: handleTranscript,
    onStateUpdate: handleStateUpdate,
    onEnd: handleEnd,
  });

  // Text mode (direct API)
  const text = useTextInterview({
    sessionId,
    onTranscript: handleTranscript,
    onStateUpdate: handleStateUpdate,
    onEnd: handleEnd,
  });

  const mode = useVoice ? vapi : text;
  const { status, start, stop } = mode;
  const isActive = status === "active" || status === "speaking" || status === "listening";
  const isEnded = status === "ended";
  const isTextMode = !useVoice;
  const isThinking = isTextMode && (text as ReturnType<typeof useTextInterview>).isThinking;

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function handleSend() {
    if (!inputValue.trim() || isThinking) return;
    (text as ReturnType<typeof useTextInterview>).sendMessage(inputValue.trim());
    setInputValue("");
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#090909", color: "#f2f2f2" }}>

      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 54, flexShrink: 0,
        borderBottom: "1px solid #1e1e1e",
        background: "#090909",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="5" fill="#f97316" />
            <path d="M6 10.5L9 13.5L14 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>Intervue</span>
          {interviewState && (
            <span style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 5,
              background: "#1a1a1a", color: "#666", border: "1px solid #2a2a2a",
            }}>
              {interviewState.template.title}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, fontFamily: "monospace", color: "#555" }}>
            {formatTime(elapsedSeconds)}
          </span>

          {/* Mode toggle — only shown before interview starts */}
          {status === "idle" && (
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#141414", border: "1px solid #2a2a2a", borderRadius: 7, padding: 3 }}>
              {[
                { id: false, label: "Text" },
                { id: true,  label: "Voice" },
              ].map(({ id, label }) => (
                <button
                  key={String(id)}
                  onClick={() => setUseVoice(id)}
                  title={id ? "Requires Vapi + public URL" : "Works immediately, no setup"}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 5,
                    border: "none", cursor: "pointer", transition: "background 0.15s, color 0.15s",
                    background: useVoice === id ? "#f97316" : "transparent",
                    color: useVoice === id ? "#fff" : "#555",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {useVoice && status === "idle" && !VOICE_CONFIGURED && (
            <span style={{ fontSize: 11, color: "#f97316", opacity: 0.7 }}>
              ⚠ needs ngrok + NEXT_PUBLIC_INTERVIEW_MODE=voice
            </span>
          )}

          <span style={{ fontSize: 11, color: "#2e2e2e" }}>Shift+D debug</span>

          {isActive && !isTextMode && (
            <button
              onClick={() => {
                const v = mode as ReturnType<typeof useVapi>;
                v.toggleMute();
              }}
              style={{
                fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                background: mode.isMuted ? "#7f1d1d" : "#1a1a1a",
                color: mode.isMuted ? "#fca5a5" : "#888",
                border: `1px solid ${mode.isMuted ? "#991b1b" : "#2a2a2a"}`,
              }}
            >
              {mode.isMuted ? "Unmute" : "Mute"}
            </button>
          )}

          {(isActive || status === "connecting") && (
            <button
              onClick={stop}
              style={{
                fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a",
              }}
            >
              End interview
            </button>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left sidebar — competency progress */}
        <AnimatePresence>
          {interviewState && isActive && (
            <motion.aside
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              style={{
                width: 200, flexShrink: 0, padding: "24px 20px", overflowY: "auto",
                borderRight: "1px solid #1e1e1e",
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 14 }}>
                Coverage
              </p>
              <CompetencyProgress state={interviewState} />

              <div style={{ marginTop: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 8 }}>
                  Stage
                </p>
                <span style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 5,
                  background: "rgba(249,115,22,0.1)", color: "#f97316",
                  border: "1px solid rgba(249,115,22,0.2)", textTransform: "capitalize",
                }}>
                  {interviewState.stage.replace(/_/g, " ")}
                </span>
              </div>

              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 8 }}>
                  Difficulty
                </p>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <div key={d} style={{
                      height: 3, flex: 1, borderRadius: 2,
                      background: d <= interviewState.difficulty ? "#f2f2f2" : "#222",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Center ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Transcript / chat area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
            {transcript.length === 0 && !isActive && (status === "idle" || status === "connecting") && (
              <IdlePrompt onStart={start} isConnecting={status === "connecting"} />
            )}
            {status === "connecting" && transcript.length === 0 && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
                <ThinkingDots />
              </div>
            )}
            <ChatThread entries={transcript} isThinking={isThinking} />
            {isEnded && transcript.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  textAlign: "center", marginTop: 32, padding: "20px",
                  borderRadius: 12, background: "rgba(249,115,22,0.06)",
                  border: "1px solid rgba(249,115,22,0.15)",
                }}
              >
                <p style={{ fontSize: 14, color: "#f97316", fontWeight: 500 }}>Interview complete</p>
                <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Generating your report…</p>
              </motion.div>
            )}
          </div>

          {/* ── Input area ── */}
          {isTextMode ? (
            <TextInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              disabled={!isActive || isThinking || isEnded}
              isThinking={isThinking}
              isActive={isActive}
              onStart={start}
              status={status}
            />
          ) : (
            <VoiceControls status={status} onStart={start} onStop={stop} volumeLevel={mode.volumeLevel} />
          )}
        </div>
      </div>

      {/* Debug panel */}
      <AnimatePresence>
        {debugVisible && interviewState && (
          <DebugPanel state={interviewState} onClose={() => setDebugVisible(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function ChatThread({ entries, isThinking }: { entries: TranscriptEntry[]; isThinking: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, isThinking]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720, margin: "0 auto" }}>
      {entries.map((entry) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: "flex", flexDirection: "column", alignItems: entry.role === "assistant" ? "flex-start" : "flex-end", gap: 5 }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#444" }}>
            {entry.role === "assistant" ? "Interviewer" : "You"}
          </span>
          <div style={{
            maxWidth: "82%",
            padding: entry.role === "assistant" ? "14px 18px" : "12px 16px",
            borderRadius: entry.role === "assistant" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
            background: entry.role === "assistant" ? "#141414" : "#1c1c1c",
            border: `1px solid ${entry.role === "assistant" ? "#242424" : "#2a2a2a"}`,
            fontSize: 14,
            lineHeight: 1.65,
            color: entry.role === "assistant" ? "#e8e8e8" : "#aaa",
          }}>
            {entry.text}
          </div>
        </motion.div>
      ))}

      {isThinking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#444" }}>
            Interviewer
          </span>
          <div style={{
            padding: "14px 18px", borderRadius: "4px 16px 16px 16px",
            background: "#141414", border: "1px solid #242424",
          }}>
            <ThinkingDots />
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{ width: 5, height: 5, borderRadius: "50%", background: "#555" }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function IdlePrompt({ onStart, isConnecting }: { onStart: () => void; isConnecting: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, textAlign: "center", gap: 20 }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "rgba(249,115,22,0.08)",
        border: "1px solid rgba(249,115,22,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 6 }}>
          Your interviewer is waiting
        </p>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
          Click begin to start the interview. Take a breath.
        </p>
      </div>
      <button
        onClick={onStart}
        disabled={isConnecting}
        style={{
          padding: "10px 28px", borderRadius: 8, border: "none",
          background: "#f97316", color: "#fff",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          opacity: isConnecting ? 0.6 : 1,
          letterSpacing: "-0.01em",
        }}
      >
        {isConnecting ? "Connecting…" : "Begin interview"}
      </button>
    </motion.div>
  );
}

function TextInput({
  value, onChange, onSend, disabled, isThinking, isActive, onStart, status,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  isThinking: boolean;
  isActive: boolean;
  onStart: () => void;
  status: string;
}) {
  if (status === "idle" || status === "connecting") return null;
  if (status === "ended") return null;

  return (
    <div style={{
      borderTop: "1px solid #1e1e1e",
      padding: "16px 40px 20px",
      background: "#090909",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 10 }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={disabled}
          placeholder={isThinking ? "Interviewer is thinking…" : "Type your answer… (Enter to send, Shift+Enter for new line)"}
          rows={2}
          style={{
            flex: 1,
            background: "#111",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 14,
            color: "#e8e8e8",
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.6,
            transition: "border-color 0.15s",
            opacity: disabled ? 0.5 : 1,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#f97316")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          style={{
            padding: "0 18px",
            borderRadius: 10,
            border: "none",
            background: disabled || !value.trim() ? "#1a1a1a" : "#f97316",
            color: disabled || !value.trim() ? "#444" : "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: disabled || !value.trim() ? "default" : "pointer",
            transition: "background 0.2s, color 0.2s",
            flexShrink: 0,
            alignSelf: "stretch",
          }}
        >
          Send
        </button>
      </div>
      <p style={{ maxWidth: 720, margin: "8px auto 0", fontSize: 11, color: "#333" }}>
        Speak naturally — the AI evaluates your answer and may follow up.
      </p>
    </div>
  );
}

function VoiceControls({ status, onStart, onStop, volumeLevel }: {
  status: string; onStart: () => void; onStop: () => void; volumeLevel: number;
}) {
  const isActive = status === "active" || status === "speaking" || status === "listening";
  const scale = 1 + volumeLevel * 0.3;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "24px 0 32px",
      borderTop: "1px solid #1e1e1e",
      gap: 12,
    }}>
      <motion.button
        onClick={isActive ? onStop : onStart}
        disabled={status === "connecting" || status === "ended"}
        animate={{ scale: isActive ? scale : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          width: 72, height: 72, borderRadius: "50%",
          border: status === "speaking" ? "1px solid #f97316" : "1px solid #2a2a2a",
          background: status === "speaking" ? "#f97316" : "#141414",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: status === "speaking" ? "0 0 32px rgba(249,115,22,0.4)" : "none",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={status === "speaking" ? "#fff" : "#888"} strokeWidth="1.5" strokeLinecap="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </motion.button>
      <p style={{ fontSize: 12, color: "#444" }}>
        {status === "idle" ? "Click to begin" : status === "speaking" ? "AI speaking" : status === "listening" ? "Listening…" : status === "connecting" ? "Connecting…" : ""}
      </p>
    </div>
  );
}
