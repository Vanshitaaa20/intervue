"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { VapiStatus } from "../hooks/useVapi";

interface VoiceOrbProps {
  status: VapiStatus;
  volumeLevel: number;
  onStart: () => void;
  onStop: () => void;
}

const STATUS_LABEL: Record<VapiStatus, string> = {
  idle: "Click to begin",
  connecting: "Connecting...",
  active: "Interview active",
  speaking: "AI speaking",
  listening: "Listening...",
  ended: "Interview complete",
};

export function VoiceOrb({ status, volumeLevel, onStart, onStop }: VoiceOrbProps) {
  const isActive = status === "active" || status === "speaking" || status === "listening";
  const isSpeaking = status === "speaking";
  const isListening = status === "listening";

  const orbScale = 1 + volumeLevel * 0.3;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Orb */}
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Expanding rings — shown when active */}
        <AnimatePresence>
          {isActive && (
            <>
              <motion.div
                key="ring1"
                className="absolute rounded-full"
                style={{
                  width: 128,
                  height: 128,
                  border: `1px solid ${isSpeaking ? "var(--brand)" : "var(--border-subtle)"}`,
                }}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                key="ring2"
                className="absolute rounded-full"
                style={{
                  width: 128,
                  height: 128,
                  border: `1px solid ${isSpeaking ? "var(--brand)" : "var(--border-subtle)"}`,
                }}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.7,
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Core orb */}
        <motion.button
          onClick={isActive ? onStop : onStart}
          disabled={status === "connecting" || status === "ended"}
          animate={{ scale: isActive ? orbScale : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer disabled:cursor-default transition-colors"
          style={{
            background: isSpeaking
              ? "var(--brand)"
              : isListening
              ? "var(--surface-hover)"
              : isActive
              ? "var(--surface)"
              : "var(--surface)",
            border: `1px solid ${isSpeaking ? "var(--brand)" : "var(--border)"}`,
            boxShadow: isSpeaking
              ? "0 0 40px var(--brand-glow)"
              : "none",
          }}
          whileHover={!isActive ? { scale: 1.05 } : undefined}
          whileTap={!isActive ? { scale: 0.97 } : undefined}
        >
          {status === "connecting" ? (
            <ConnectingDots />
          ) : isListening ? (
            <MicIcon />
          ) : isSpeaking ? (
            <WaveformIcon />
          ) : status === "ended" ? (
            <CheckIcon />
          ) : (
            <MicIcon dim />
          )}
        </motion.button>
      </div>

      {/* Status label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-sm"
          style={{
            color: isSpeaking
              ? "var(--brand)"
              : isListening
              ? "var(--foreground)"
              : "var(--muted)",
          }}
        >
          {STATUS_LABEL[status]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function MicIcon({ dim }: { dim?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={dim ? "var(--muted)" : "var(--foreground)"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg
      width="32"
      height="24"
      viewBox="0 0 32 24"
      fill="none"
      stroke="var(--background)"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <motion.line
        x1="2" y1="12" x2="2" y2="12"
        animate={{ y1: [8, 4, 8], y2: [16, 20, 16] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
      />
      <motion.line
        x1="8" y1="12" x2="8" y2="12"
        animate={{ y1: [5, 2, 5], y2: [19, 22, 19] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
      />
      <motion.line
        x1="14" y1="12" x2="14" y2="12"
        animate={{ y1: [7, 1, 7], y2: [17, 23, 17] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
      />
      <motion.line
        x1="20" y1="12" x2="20" y2="12"
        animate={{ y1: [5, 2, 5], y2: [19, 22, 19] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.45 }}
      />
      <motion.line
        x1="26" y1="12" x2="26" y2="12"
        animate={{ y1: [8, 4, 8], y2: [16, 20, 16] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 }}
      />
      <motion.line
        x1="32" y1="12" x2="32" y2="12"
        animate={{ y1: [6, 3, 6], y2: [18, 21, 18] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.75 }}
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--brand)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ConnectingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--muted)" }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
