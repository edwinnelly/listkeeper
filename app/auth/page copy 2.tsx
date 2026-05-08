"use client";
import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MailRegular,
  LockClosedRegular,
  EyeRegular,
  EyeOffRegular,
  ShieldRegular,
  ErrorCircleRegular,
  ArrowRightRegular,
  CheckmarkRegular,
} from "@fluentui/react-icons";
import { api, withCsrf } from "@/lib/axios";

// ── Types ──────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATS = [
  { value: "15K+", label: "Products" },
  { value: "500+", label: "Warehouses" },
  { value: "99.8%", label: "Accuracy" },
];

// Unsplash: warm-lit warehouse shelves — used as CSS background to bypass next.config domain rules
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1400&q=85&auto=format&fit=crop";

// ── Component ──────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const router = useRouter();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [focused, setFocused]       = useState<"email" | "password" | null>(null);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // FIX: rememberMe passed to API so session duration is respected
      await withCsrf(() =>
        api.post("/login", { email, password, remember: rememberMe }, { withCredentials: true })
      );
      await api.get<User>("/user", { withCredentials: true });
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const iBorder = (f: "email" | "password") =>
    focused === f ? "1px solid #e8a045" : "1px solid #e4dfd8";
  const iShadow = (f: "email" | "password") =>
    focused === f ? "0 0 0 3.5px rgba(232,160,69,0.13)" : "none";

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        .lk-root {
          font-family: 'Outfit', sans-serif;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #faf7f3;
        }
        @media (min-width: 1024px) { .lk-root { flex-direction: row; } }
        .lk-bebas { font-family: 'Bebas Neue', sans-serif; }
        /* Subtle grain on photo panel */
        .lk-photo::after {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 3;
          mix-blend-mode: screen;
        }
        .lk-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: #1a1714;
        }
        .lk-input::placeholder { color: #c8c0b4; }
        .lk-input:disabled { opacity: 0.45; }
        @keyframes lk-spin { to { transform: rotate(360deg); } }
        @keyframes lk-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .lk-shimmer {
          background: linear-gradient(90deg, #2e2822 0%, #48403a 45%, #2e2822 90%);
          background-size: 200% auto;
          animation: lk-shimmer 1.5s linear infinite;
        }
        .lk-btn-idle {
          background: #1a1714;
          transition: background 0.2s, transform 0.1s;
        }
        .lk-btn-idle:hover:not(:disabled) { background: #2e2822; }
        .lk-btn-idle:disabled { background: #d0c9c0; cursor: not-allowed; }
      `}</style>

      <div className="lk-root">

        {/* ════════════════════════════════════════════════════════════
            LEFT PANEL — Full-bleed warehouse photo (desktop only)
        ════════════════════════════════════════════════════════════ */}
        <div
          className="lk-photo hidden lg:flex flex-col relative overflow-hidden"
          style={{ width: "47%", minHeight: "100dvh" }}
        >
          {/* Photo */}
          <div
            style={{
              position: "absolute", inset: 0, zIndex: 0,
              backgroundImage: `url('${HERO_IMAGE}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* Gradient overlays */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(130deg, rgba(8,6,4,0.86) 0%, rgba(16,12,8,0.68) 55%, rgba(8,6,4,0.80) 100%)",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, height: "60%",
            background: "linear-gradient(to top, rgba(6,4,2,0.97) 0%, transparent 100%)",
          }} />
          {/* Right border glow */}
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 1, zIndex: 4,
            background: "linear-gradient(to bottom, transparent 0%, rgba(232,160,69,0.35) 50%, transparent 100%)",
          }} />

          {/* Content */}
          <div className="relative flex flex-col h-full px-11 py-10" style={{ zIndex: 5 }}>

            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div
                className="lk-bebas flex items-center justify-center rounded-xl"
                style={{ width: 42, height: 42, background: "#e8a045", color: "#0d0a07", fontSize: "1.05rem", letterSpacing: "0.04em" }}
              >
                LK
              </div>
              <span className="lk-bebas text-white tracking-wider" style={{ fontSize: "1.45rem" }}>
                LISTKEEPING
              </span>
            </motion.div>

            <div style={{ flex: 1 }} />

            {/* Hero copy */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#e8a045", marginBottom: 16 }}>
                Inventory Management System
              </p>
              <h1 className="lk-bebas text-white" style={{ fontSize: "clamp(3.8rem, 5.2vw, 5.4rem)", lineHeight: "0.94", letterSpacing: "0.02em" }}>
                TRACK<br />EVERY<br />
                <span style={{ color: "#e8a045" }}>UNIT.</span>
              </h1>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.48)", lineHeight: 1.7, maxWidth: 270, marginTop: 20 }}>
                Real-time visibility across all your warehouses, branches, and
                distribution points — in one place.
              </p>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.55, delay: 0.3 }}
              style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "32px 0 28px", transformOrigin: "left" }}
            />

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ display: "flex", gap: 36 }}
            >
              {STATS.map((s) => (
                <div key={s.value}>
                  <div className="lk-bebas" style={{ fontSize: "2.1rem", color: "#e8a045", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </motion.div>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 28, letterSpacing: "0.04em" }}>
              © {new Date().getFullYear()} ListKeeping · All rights reserved
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            MOBILE — Top photo strip
        ════════════════════════════════════════════════════════════ */}
        <div className="lk-photo lg:hidden relative overflow-hidden" style={{ height: 200, flexShrink: 0 }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url('${HERO_IMAGE}')`,
            backgroundSize: "cover", backgroundPosition: "center 35%",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(8,6,4,0.5), rgba(8,6,4,0.88))",
            zIndex: 1,
          }} />
          <div className="relative flex items-end h-full px-6 pb-5" style={{ zIndex: 2 }}>
            <div className="flex items-center gap-2.5">
              <div className="lk-bebas flex items-center justify-center rounded-lg"
                style={{ width: 36, height: 36, background: "#e8a045", color: "#0d0a07", fontSize: "0.95rem" }}>
                LK
              </div>
              <span className="lk-bebas text-white tracking-wider" style={{ fontSize: "1.3rem" }}>LISTKEEPING</span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            RIGHT PANEL — Form
        ════════════════════════════════════════════════════════════ */}
        <div
          className="flex-1 flex flex-col items-center justify-center overflow-y-auto"
          style={{ background: "#faf7f3", padding: "clamp(28px, 5vw, 72px) clamp(20px, 4vw, 64px)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ width: "100%", maxWidth: 400 }}
          >
            {/* Heading */}
            <div style={{ marginBottom: 32 }}>
              <h2 className="lk-bebas" style={{ fontSize: "2.9rem", color: "#1a1714", letterSpacing: "0.03em", lineHeight: 1 }}>
                SIGN IN
              </h2>
              <p style={{ fontSize: 14, color: "#9e958a", marginTop: 8 }}>
                Enter your credentials to access the dashboard.
              </p>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 18 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 9,
                    padding: "11px 14px", borderRadius: 10,
                    background: "#fff0ef", border: "1px solid #fbc9c5",
                    color: "#c0392b", fontSize: 13,
                  }}
                >
                  <ErrorCircleRegular style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Email field */}
              <div>
                <label htmlFor="lk-email" style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9e958a", marginBottom: 7 }}>
                  Email Address
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 12, background: "#fff", border: iBorder("email"), boxShadow: iShadow("email"), transition: "border 0.15s, box-shadow 0.15s" }}>
                  <MailRegular style={{ width: 16, height: 16, flexShrink: 0, color: focused === "email" ? "#e8a045" : "#c0b8ae", transition: "color 0.15s" }} />
                  <input
                    id="lk-email" type="email" className="lk-input"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    placeholder="you@company.com" autoComplete="email"
                    required disabled={loading}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <label htmlFor="lk-password" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9e958a" }}>
                    Password
                  </label>
                  <Link href="/forgetpwd" style={{ fontSize: 12, color: "#e8a045", fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 12, background: "#fff", border: iBorder("password"), boxShadow: iShadow("password"), transition: "border 0.15s, box-shadow 0.15s" }}>
                  <LockClosedRegular style={{ width: 16, height: 16, flexShrink: 0, color: focused === "password" ? "#e8a045" : "#c0b8ae", transition: "color 0.15s" }} />
                  <input
                    id="lk-password" type={showPwd ? "text" : "password"} className="lk-input"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    placeholder="••••••••" autoComplete="current-password"
                    required disabled={loading}
                  />
                  <button
                    type="button" onClick={() => setShowPwd((v) => !v)} disabled={loading}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#c0b8ae", display: "flex", flexShrink: 0 }}
                  >
                    {showPwd ? <EyeOffRegular style={{ width: 15, height: 15 }} /> : <EyeRegular style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              {/* Remember me — custom checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe((v) => !v)}
                  disabled={loading}
                  style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                    border: rememberMe ? "none" : "1.5px solid #d0c8be",
                    background: rememberMe ? "#1a1714" : "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s, border 0.15s",
                  }}
                >
                  {rememberMe && <CheckmarkRegular style={{ width: 11, height: 11, color: "white" }} />}
                </button>
                <span style={{ fontSize: 13, color: "#9e958a" }}>Keep me signed in for 30 days</span>
              </label>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={loading || !email || !password}
                whileTap={!loading && email && password ? { scale: 0.985 } : {}}
                className={loading ? "lk-shimmer" : "lk-btn-idle"}
                style={{
                  width: "100%", padding: "15px 20px", borderRadius: 12, border: "none",
                  color: "white", fontFamily: "'Outfit', sans-serif", fontSize: 14,
                  fontWeight: 600, letterSpacing: "0.03em", marginTop: 6,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "lk-spin 0.75s linear infinite", flexShrink: 0 }} />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in to Dashboard
                    <ArrowRightRegular style={{ width: 16, height: 16 }} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div style={{ height: 1, background: "#ece6de", margin: "26px 0" }} />

            {/* Register */}
            <p style={{ textAlign: "center", fontSize: 14, color: "#9e958a" }}>
              New to ListKeeping?{" "}
              <Link href="/register" style={{ color: "#1a1714", fontWeight: 600 }}>
                Create an account
              </Link>
            </p>

            {/* Security note */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 18, fontSize: 11, color: "#c0b8ae" }}>
              <ShieldRegular style={{ width: 13, height: 13, flexShrink: 0 }} />
              <span>CSRF-protected · Encrypted sessions · Role-based access</span>
            </div>

            {/* Legal */}
            <p style={{ textAlign: "center", fontSize: 11, color: "#c8c0b4", marginTop: 12 }}>
              By signing in you agree to our{" "}
              <Link href="/terms" style={{ color: "#9e958a" }}>Terms</Link>{" & "}
              <Link href="/privacy" style={{ color: "#9e958a" }}>Privacy Policy</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;