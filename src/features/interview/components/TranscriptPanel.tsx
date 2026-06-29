"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

export function TranscriptPanel({ entries }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Your conversation will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex flex-col gap-1 ${
              entry.role === "assistant" ? "items-start" : "items-end"
            }`}
          >
            <span
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              {entry.role === "assistant" ? "Interviewer" : "You"}
            </span>
            <div
              className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={{
                background:
                  entry.role === "assistant"
                    ? "var(--surface)"
                    : "var(--surface-hover)",
                border: "1px solid var(--border)",
                borderRadius:
                  entry.role === "assistant"
                    ? "4px 16px 16px 16px"
                    : "16px 4px 16px 16px",
              }}
            >
              {entry.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
