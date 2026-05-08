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

// ── Design tokens: Dark Blue & Black Theme ─────────────────────────────────

const T = {
  black:      "#000000",
  surface:    "#0a0e17",      // Deep navy-black
  surface2:   "#111827",      // Dark blue-gray
  border:     "rgba(255,255,255,0.06)",
  borderHover:"rgba(96,165,250,0.35)",
  blue:       "#3b82f6",      // Electric blue primary
  blueHover:  "#60a5fa",      // Lighter blue for hover
  blueGlow:   "rgba(59,130,246,0.18)",
  blueDeep:   "#1d4ed8",      // Darker blue for depth
  white:      "#ffffff",
  muted:      "rgba(255,255,255,0.42)",
  faint:      "rgba(255,255,255,0.18)",
  error:      "#f87171",
  errorBg:    "rgba(248,113,113,0.10)",
  errorBdr:   "rgba(248,113,113,0.25)",
};

// ── Constants ──────────────────────────────────────────────────────────────

const STATS = [
  { value: "15K+", label: "Products" },
  { value: "500+", label: "Warehouses" },
  { value: "99.8%", label: "Accuracy" },
];

const FEATURES = [
  "Real-time stock visibility across all branches",
  "Automated low-stock alerts & reorder triggers",
  "Role-based access with full audit logs",
];

// Dark industrial warehouse image with blue-toned overlay
const PHOTO = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&q=85&auto=format&fit=crop";

// ── Stagger variants ───────────────────────────────────────────────────────

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
  },
};

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
      await withCsrf(() =>
        api.post("/login", { email, password, remember: rememberMe }, { withCredentials: true })
      );
      await api.get<User>("/user", { withCredentials: true });
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (f: "email" | "password") => ({
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: "13px 16px",
    borderRadius: 10,
    background: T.surface2,
    border: `1px solid ${focused === f ? T.blue : T.border}`,
    boxShadow: focused === f ? `0 0 0 3px ${T.blueGlow}` : "none",
    transition: "border 0.15s ease, box-shadow 0.15s ease",
  });

  const canSubmit = !loading && email.trim() && password.trim();

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Space+Mono:wght@400;700&family=Barlow:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; }

        html, body { background: #000; }

        .lk-root {
          font-family: 'Barlow', sans-serif;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: ${T.black};
        }
        @media (min-width: 1024px) { .lk-root { flex-direction: row; } }

        .lk-display { font-family: 'Unbounded', sans-serif; }
        .lk-mono    { font-family: 'Space Mono', monospace; }

        /* ── Input ── */
        .lk-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Barlow', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: ${T.white};
          min-width: 0;
        }
        .lk-input::placeholder { color: ${T.faint}; }
        .lk-input:disabled     { opacity: 0.4; }

        /* ── Icon button ── */
        .lk-icon-btn {
          background: none; border: none; cursor: pointer;
          padding: 3px; display: flex; flex-shrink: 0;
          color: ${T.muted}; transition: color 0.15s ease;
        }
        .lk-icon-btn:hover { color: ${T.white}; }
        .lk-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Submit button ── */
        .lk-btn {
          width: 100%; padding: 15px 20px; border-radius: 10px; border: none;
          font-family: 'Barlow', sans-serif; font-size: 15px; font-weight: 600;
          letter-spacing: 0.03em; display: flex; align-items: center;
          justify-content: center; gap: 8px; cursor: pointer;
          transition: opacity 0.2s ease, transform 0.1s ease, background 0.2s ease;
        }
        .lk-btn-active {
          background: ${T.blue}; color: ${T.white};
        }
        .lk-btn-active:hover { 
          background: ${T.blueHover}; 
          box-shadow: 0 4px 20px ${T.blueGlow};
        }
        .lk-btn-disabled {
          background: ${T.surface2}; color: ${T.faint}; cursor: not-allowed;
          border: 1px solid ${T.border};
        }

        /* ── Checkbox ── */
        .lk-checkbox {
          width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; background: none; border: none;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        /* ── Spinner ── */
        @keyframes lk-spin { to { transform: rotate(360deg); } }
        .lk-spinner {
          width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.15); border-top-color: ${T.blue};
          animation: lk-spin 0.75s linear infinite;
        }

        /* ── Photo grain ── */
        .lk-photo-wrap::after {
          content: '';
          position: absolute; inset: 0; z-index: 3;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.025; pointer-events: none; mix-blend-mode: screen;
        }

        /* ── Scan lines (subtle) ── */
        .lk-scanlines::before {
          content: '';
          position: absolute; inset: 0; z-index: 10; pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.04) 2px,
            rgba(0,0,0,0.04) 4px
          );
        }

        /* ── Scrollbar ── */
        .lk-form-panel::-webkit-scrollbar { width: 4px; }
        .lk-form-panel::-webkit-scrollbar-track { background: transparent; }
        .lk-form-panel::-webkit-scrollbar-thumb { background: ${T.surface2}; border-radius: 4px; }
        .lk-form-panel::-webkit-scrollbar-thumb:hover { background: ${T.blueDeep}; }

        /* ── Divider ── */
        .lk-divider {
          height: 1px; background: ${T.border}; margin: 24px 0;
        }

        /* ── Link ── */
        .lk-link { color: ${T.blue}; font-weight: 500; text-decoration: none; transition: opacity 0.15s ease; }
        .lk-link:hover { opacity: 0.8; color: ${T.blueHover}; }
        .lk-link-white { color: ${T.white}; font-weight: 600; text-decoration: none; transition: opacity 0.15s ease; }
        .lk-link-white:hover { opacity: 0.75; }
        .lk-link-muted { color: ${T.muted}; text-decoration: none; transition: opacity 0.15s ease; }
        .lk-link-muted:hover { opacity: 0.8; color: ${T.white}; }

        /* ── Focus ring for accessibility ── */
        .lk-input:focus-visible,
        .lk-checkbox:focus-visible,
        .lk-icon-btn:focus-visible,
        .lk-btn:focus-visible {
          outline: 2px solid ${T.blue};
          outline-offset: 2px;
        }
      `}</style>

      <div className="lk-root">

        {/* ════════════════════════════════════════════════════════════
            LEFT PANEL — Photo + Brand (desktop)
        ════════════════════════════════════════════════════════════ */}
        <motion.div
          className="lk-photo-wrap hidden lg:flex flex-col relative overflow-hidden"
          style={{ width: "46%", minHeight: "100dvh", background: T.black }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Photo — dark overlay with blue tint */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: `url('${PHOTO}')`,
            backgroundSize: "cover", backgroundPosition: "center",
          }} />
          {/* Blue-tinted dark overlay */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(135deg, rgba(10,14,23,0.95) 0%, rgba(17,24,39,0.85) 50%, rgba(29,78,216,0.15) 100%)",
          }} />
          {/* Bottom black fade */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, height: "55%",
            background: "linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 100%)",
          }} />
          {/* Right edge separator with blue glow */}
          <div style={{
            position: "absolute", top: "10%", right: 0, bottom: "10%", width: 1, zIndex: 5,
            background: `linear-gradient(to bottom, transparent, ${T.blue}66, transparent)`,
            boxShadow: `0 0 20px ${T.blueGlow}`,
          }} />

          {/* ── Left content ── */}
          <motion.div
            className="relative flex flex-col h-full px-12 py-11"
            style={{ zIndex: 6 }}
            variants={stagger.container}
            initial="initial"
            animate="animate"
          >
            {/* Brand */}
            <motion.div variants={stagger.item} className="flex items-center gap-3">
              <div
                className="lk-display flex items-center justify-center"
                style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: T.blue, color: T.white,
                  fontSize: "0.78rem", letterSpacing: "0.04em",
                  boxShadow: `0 4px 14px ${T.blueGlow}`,
                }}
              >
                LK
              </div>
              <span className="lk-mono" style={{ color: T.white, fontSize: "1rem", letterSpacing: "0.06em" }}>
                LISTKEEPING
              </span>
            </motion.div>

            <div style={{ flex: 1 }} />

            {/* Tag */}
            <motion.p
              variants={stagger.item}
              className="lk-mono"
              style={{ fontSize: 9, letterSpacing: "0.25em", color: T.blue, textTransform: "uppercase", marginBottom: 18 }}
            >
              // inventory management system
            </motion.p>

            {/* Hero heading */}
            <motion.h1
              variants={stagger.item}
              className="lk-display"
              style={{
                fontSize: "clamp(3.2rem, 4.8vw, 5rem)",
                color: T.white,
                lineHeight: "0.95",
                letterSpacing: "-0.01em",
              }}
            >
              FULL<br />STOCK<br />
              <span style={{ color: T.blue, textShadow: `0 0 30px ${T.blueGlow}` }}>CONTROL.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={stagger.item}
              style={{
                fontSize: 13, color: T.muted, lineHeight: 1.7,
                maxWidth: 265, marginTop: 20,
                fontWeight: 400,
              }}
            >
              Real-time inventory tracking across all your branches,
              warehouses, and distribution points.
            </motion.p>

            {/* Features */}
            <motion.ul
              variants={stagger.item}
              style={{ listStyle: "none", padding: 0, marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}
            >
              {FEATURES.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: T.muted }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.blue, flexShrink: 0, boxShadow: `0 0 8px ${T.blueGlow}` }} />
                  {f}
                </li>
              ))}
            </motion.ul>

            {/* Divider */}
            <motion.div
              variants={stagger.item}
              style={{ height: 1, background: T.border, margin: "28px 0 24px" }}
            />

            {/* Stats */}
            <motion.div
              variants={stagger.item}
              style={{ display: "flex", gap: 32 }}
            >
              {STATS.map((s) => (
                <div key={s.value}>
                  <div className="lk-display" style={{ fontSize: "1.9rem", color: T.blue, lineHeight: 1, textShadow: `0 0 20px ${T.blueGlow}` }}>
                    {s.value}
                  </div>
                  <div className="lk-mono" style={{ fontSize: 9, color: T.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.p
              variants={stagger.item}
              className="lk-mono"
              style={{ fontSize: 10, color: T.faint, marginTop: 24 }}
            >
              © {new Date().getFullYear()} ListKeeping
            </motion.p>
          </motion.div>
        </motion.div>

        {/* ════════════════════════════════════════════════════════════
            MOBILE — Top photo strip
        ════════════════════════════════════════════════════════════ */}
        <div
          className="lk-photo-wrap lg:hidden relative overflow-hidden"
          style={{ height: 180, flexShrink: 0, background: T.black }}
        >
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url('${PHOTO}')`,
            backgroundSize: "cover", backgroundPosition: "center 30%",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, rgba(10,14,23,0.7), rgba(0,0,0,0.95))",
          }} />
          <div className="relative flex items-end h-full px-6 pb-5" style={{ zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                className="lk-display flex items-center justify-center"
                style={{ width: 34, height: 34, borderRadius: 7, background: T.blue, color: T.white, fontSize: "0.72rem", boxShadow: `0 3px 10px ${T.blueGlow}` }}
              >
                LK
              </div>
              <span className="lk-mono" style={{ color: T.white, fontSize: "0.9rem", letterSpacing: "0.06em" }}>
                LISTKEEPING
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            RIGHT PANEL — Form
        ════════════════════════════════════════════════════════════ */}
        <div
          className="lk-form-panel flex-1 flex flex-col items-center justify-center overflow-y-auto"
          style={{
            background: T.black,
            padding: "clamp(32px, 5vw, 80px) clamp(20px, 5vw, 72px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            style={{ width: "100%", maxWidth: 400 }}
          >
            {/* Heading */}
            <div style={{ marginBottom: 36 }}>
              <p
                className="lk-mono"
                style={{ fontSize: 9, letterSpacing: "0.2em", color: T.blue, marginBottom: 12, textTransform: "uppercase" }}
              >
                // welcome back
              </p>
              <h2
                className="lk-display"
                style={{ fontSize: "3rem", color: T.white, letterSpacing: "-0.01em", lineHeight: 1 }}
              >
                SIGN IN
              </h2>
              <p style={{ fontSize: 14, color: T.muted, marginTop: 10, fontWeight: 400 }}>
                Access your inventory dashboard.
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 9,
                    padding: "12px 14px", borderRadius: 10,
                    background: T.errorBg, border: `1px solid ${T.errorBdr}`,
                    color: T.error, fontSize: 13,
                  }}
                >
                  <ErrorCircleRegular style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontWeight: 500 }}>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form ── */}
            <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Email */}
              <div>
                <label
                  htmlFor="lk-email"
                  className="lk-mono"
                  style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: T.muted, marginBottom: 8, textTransform: "uppercase" }}
                >
                  Email Address
                </label>
                <div style={inputStyle("email")}>
                  <MailRegular style={{ width: 15, height: 15, flexShrink: 0, color: focused === "email" ? T.blue : T.faint, transition: "color 0.15s ease" }} />
                  <input
                    id="lk-email"
                    type="email"
                    className="lk-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label
                    htmlFor="lk-password"
                    className="lk-mono"
                    style={{ fontSize: 10, letterSpacing: "0.14em", color: T.muted, textTransform: "uppercase" }}
                  >
                    Password
                  </label>
                  <Link href="/forgetpwd" className="lk-link" style={{ fontSize: 12 }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={inputStyle("password")}>
                  <LockClosedRegular style={{ width: 15, height: 15, flexShrink: 0, color: focused === "password" ? T.blue : T.faint, transition: "color 0.15s ease" }} />
                  <input
                    id="lk-password"
                    type={showPwd ? "text" : "password"}
                    className="lk-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="lk-icon-btn"
                    onClick={() => setShowPwd((v) => !v)}
                    disabled={loading}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd
                      ? <EyeOffRegular style={{ width: 15, height: 15 }} />
                      : <EyeRegular style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe((v) => !v)}
                  disabled={loading}
                  className="lk-checkbox"
                  style={{
                    border: rememberMe ? "none" : `1.5px solid ${T.border}`,
                    background: rememberMe ? T.blue : T.surface2,
                  }}
                >
                  {rememberMe && <CheckmarkRegular style={{ width: 11, height: 11, color: T.white }} />}
                </button>
                <span style={{ fontSize: 13, color: T.muted, fontWeight: 400 }}>
                  Keep me signed in for 30 days
                </span>
              </label>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={!canSubmit}
                whileTap={canSubmit ? { scale: 0.975 } : {}}
                className={`lk-btn ${canSubmit ? "lk-btn-active" : "lk-btn-disabled"}`}
                style={{ marginTop: 4 }}
              >
                {loading ? (
                  <>
                    <span className="lk-spinner" />
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
            <div className="lk-divider" />

            {/* Register */}
            <p style={{ textAlign: "center", fontSize: 14, color: T.muted }}>
              New to ListKeeping?{" "}
              <Link href="/register" className="lk-link-white">
                Create an account
              </Link>
            </p>

            {/* Security */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 18 }}>
              <ShieldRegular style={{ width: 12, height: 12, flexShrink: 0, color: T.faint }} />
              <span className="lk-mono" style={{ fontSize: 9, color: T.faint, letterSpacing: "0.08em" }}>
                CSRF-PROTECTED · ENCRYPTED · ROLE-BASED ACCESS
              </span>
            </div>

            {/* Legal */}
            <p style={{ textAlign: "center", fontSize: 11, color: T.faint, marginTop: 14, lineHeight: 1.6 }}>
              By signing in you agree to our{" "}
              <Link href="/terms" className="lk-link-muted">Terms</Link>
              {" & "}
              <Link href="/privacy" className="lk-link-muted">Privacy Policy</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;