"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
        <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
          <rect width="20" height="20" rx="5" fill="var(--brand)" />
          <path d="M6 10.5L9 13.5L14 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.03em" }}>Intervue</span>
      </div>

      {/* Card */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 16,
        padding: "36px 36px 32px",
      }}>
        {/* Top accent line */}
        <div style={{
          height: 2,
          background: "linear-gradient(90deg, var(--brand) 0%, transparent 80%)",
          borderRadius: 2,
          marginBottom: 28,
          marginLeft: -36,
          marginRight: -36,
          marginTop: -36,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }} />

        <h1 style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.035em", marginBottom: 6 }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
          {mode === "login"
            ? "Sign in to continue your practice."
            : "Start practicing behavioral interviews today."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "register" && (
            <Field label="Full name" type="text" value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Alex Chen" />
          )}
          <Field label="Email" type="email" value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="you@company.com" />
          <Field label="Password" type="password" value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            placeholder={mode === "register" ? "Minimum 8 characters" : "••••••••"} />

          {error && (
            <div style={{
              fontSize: 13, padding: "10px 14px", borderRadius: 8,
              color: "var(--destructive)",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.15)",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: 4, width: "100%", height: 44, fontSize: 14 }}
          >
            {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 13, textAlign: "center", color: "var(--muted)" }}>
          {mode === "login" ? (
            <>No account?{" "}
              <Link href="/register" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
                Sign up free
              </Link>
            </>
          ) : (
            <>Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}

function Field({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", letterSpacing: "0.02em" }}>
        {label}
      </label>
      <input
        type={type} value={value} placeholder={placeholder} required
        onChange={(e) => onChange(e.target.value)}
        className="input-base"
      />
    </div>
  );
}
