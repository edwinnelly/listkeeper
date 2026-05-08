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
  CheckboxCheckedRegular,
  CheckboxUncheckedRegular,
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

// ── Fluent Design Tokens: Microsoft Dark Theme ─────────────────────────────
const F = {
  // Core surfaces (Mica-inspired)
  background: "#0f0f0f",
  surface: "rgba(32,32,32,0.6)",
  surfaceAlt: "rgba(44,44,44,0.7)",
  surfaceHover: "rgba(64,64,64,0.5)",
  
  // Borders & dividers
  border: "rgba(255,255,255,0.08)",
  borderFocus: "rgba(0,120,212,0.6)",
  borderHover: "rgba(255,255,255,0.15)",
  
  // Brand colors (Microsoft Blue)
  primary: "#0078d4",
  primaryHover: "#1084d8",
  primaryPressed: "#005a9e",
  primaryGlow: "rgba(0,120,212,0.25)",
  
  // Typography
  text: "#ffffff",
  textSecondary: "rgba(255,255,255,0.7)",
  textTertiary: "rgba(255,255,255,0.45)",
  textOnPrimary: "#ffffff",
  
  // States
  error: "#f1707a",
  errorBg: "rgba(241,112,122,0.12)",
  success: "#6cc24a",
  
  // Effects
  elevation1: "0 1.6px 3.2px rgba(0,0,0,0.12), 0 0.4px 1.2px rgba(0,0,0,0.08)",
  elevation2: "0 3.2px 6.4px rgba(0,0,0,0.18), 0 0.8px 2.4px rgba(0,0,0,0.12)",
  elevation4: "0 6.4px 14.4px rgba(0,0,0,0.22), 0 1.6px 4.8px rgba(0,0,0,0.16)",
  revealHighlight: "inset 0 0 0 1px rgba(255,255,255,0.08)",
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

const PHOTO = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&q=85&auto=format&fit=crop";

// ── Animation Variants ─────────────────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } 
  },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};

// ── Component ──────────────────────────────────────────────────────────────
const LoginPage: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<"email" | "password" | null>(null);

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

  const canSubmit = !loading && email.trim() && password.trim();

  return (
    <>
      {/* ── Fluent Typography & Base Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        
        html, body { 
          background: ${F.background}; 
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Mica/Acrylic Background Effect ── */
        .fluent-mica {
          background: ${F.surface};
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid ${F.border};
        }

        /* ── Reveal Highlight Effect (Fluent hover) ── */
        .fluent-reveal {
          position: relative;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .fluent-reveal::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: ${F.surfaceHover};
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .fluent-reveal:hover::before { opacity: 1; }
        .fluent-reveal:active::before { background: rgba(255,255,255,0.08); }

        /* ── Input Fields ── */
        .fluent-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 4px;
          background: ${F.surfaceAlt};
          border: 1px solid ${F.border};
          color: ${F.text};
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }
        .fluent-input::placeholder { color: ${F.textTertiary}; }
        .fluent-input:focus {
          border-color: ${F.primary};
          box-shadow: 0 0 0 2px ${F.primaryGlow};
        }
        .fluent-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Primary Button (Fluent) ── */
        .fluent-btn {
          width: 100%;
          padding: 11px 20px;
          border-radius: 4px;
          border: none;
          background: ${F.primary};
          color: ${F.textOnPrimary};
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s ease, transform 0.05s ease;
          box-shadow: ${F.elevation1};
        }
        .fluent-btn:hover { background: ${F.primaryHover}; }
        .fluent-btn:active { 
          background: ${F.primaryPressed}; 
          transform: scale(0.995); 
        }
        .fluent-btn:disabled {
          background: ${F.surfaceAlt};
          color: ${F.textTertiary};
          cursor: not-allowed;
          box-shadow: none;
        }
        .fluent-btn:focus-visible {
          outline: 2px solid ${F.primary};
          outline-offset: 2px;
        }

        /* ── Secondary/Text Button ── */
        .fluent-link {
          color: ${F.primary};
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }
        .fluent-link:hover { opacity: 0.85; }
        .fluent-link:focus-visible {
          outline: 2px solid ${F.primary};
          outline-offset: 2px;
          border-radius: 2px;
        }

        /* ── Checkbox (Fluent) ── */
        .fluent-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1.5px solid ${F.border};
          background: ${F.surfaceAlt};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .fluent-checkbox:hover { border-color: ${F.borderHover}; }
        .fluent-checkbox[aria-checked="true"] {
          background: ${F.primary};
          border-color: ${F.primary};
        }
        .fluent-checkbox:focus-visible {
          outline: 2px solid ${F.primary};
          outline-offset: 2px;
        }

        /* ── Error Message ── */
        .fluent-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 4px;
          background: ${F.errorBg};
          border: 1px solid rgba(241,112,122,0.3);
          color: ${F.error};
          font-size: 13px;
          line-height: 1.4;
        }

        /* ── Spinner ── */
        @keyframes fluent-spin { to { transform: rotate(360deg); } }
        .fluent-spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: ${F.textOnPrimary};
          animation: fluent-spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* ── Layout ── */
        .fluent-root {
          min-height: 100dvh;
          display: flex;
          background: ${F.background};
        }
        @media (min-width: 1024px) {
          .fluent-root { flex-direction: row; }
        }

        /* ── Scrollbar (Fluent) ── */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { 
          background: ${F.surfaceHover}; 
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        ::-webkit-scrollbar-thumb:hover { background: ${F.borderHover}; }

        /* ── Divider ── */
        .fluent-divider {
          height: 1px;
          background: ${F.border};
          margin: 20px 0;
        }

        /* ── Utility ── */
        .text-secondary { color: ${F.textSecondary}; }
        .text-tertiary { color: ${F.textTertiary}; }
        .text-primary { color: ${F.primary}; }
        .font-mono { font-family: 'Cascadia Code', 'Consolas', monospace; }
      `}</style>

      <div className="fluent-root">

        {/* ════════════════════════════════════════════════════════════
            LEFT PANEL — Brand & Visual (Desktop)
        ════════════════════════════════════════════════════════════ */}
        <motion.aside
          className="hidden lg:flex flex-col relative overflow-hidden"
          style={{ 
            width: "45%", 
            background: `linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)`,
            borderRight: `1px solid ${F.border}`
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Subtle gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(600px circle at 20% 30%, rgba(0,120,212,0.08), transparent 40%),
                         radial-gradient(400px circle at 80% 70%, rgba(0,120,212,0.05), transparent 50%)`
          }} />

          {/* Content */}
          <motion.div
            className="relative flex flex-col h-full p-10"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Logo */}
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-auto">
              <div style={{
                width: 36, height: 36, borderRadius: 4,
                background: F.primary,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: F.textOnPrimary,
                fontWeight: 700, fontSize: "0.85rem",
                boxShadow: `0 2px 8px ${F.primaryGlow}`
              }}>
                LK
              </div>
              <span style={{ 
                color: F.text, 
                fontSize: "1.1rem", 
                fontWeight: 600,
                letterSpacing: "0.02em"
              }}>
                ListKeeping
              </span>
            </motion.div>

            {/* Hero */}
            <motion.div variants={fadeInUp} style={{ marginTop: "auto", marginBottom: 32 }}>
              <p className="font-mono" style={{ 
                fontSize: "0.7rem", 
                letterSpacing: "0.18em", 
                color: F.primary, 
                textTransform: "uppercase",
                marginBottom: 16
              }}>
                Inventory Management
              </p>
              <h1 style={{
                fontSize: "clamp(2.5rem, 4vw, 3.8rem)",
                color: F.text,
                lineHeight: 1.1,
                fontWeight: 600,
                letterSpacing: "-0.02em"
              }}>
                Full stock<br />
                <span style={{ color: F.primary }}>control.</span>
              </h1>
              <p style={{
                fontSize: "1rem",
                color: F.textSecondary,
                lineHeight: 1.6,
                marginTop: 20,
                maxWidth: 380
              }}>
                Real-time inventory tracking across all your branches, 
                warehouses, and distribution points — powered by Microsoft-grade security.
              </p>
            </motion.div>

            {/* Features */}
            <motion.ul variants={fadeInUp} style={{ 
              listStyle: "none", padding: 0, 
              display: "flex", flexDirection: "column", gap: 12,
              marginBottom: 28
            }}>
              {FEATURES.map((feature, i) => (
                <li key={i} style={{ 
                  display: "flex", alignItems: "flex-start", gap: 10,
                  fontSize: "0.9rem", color: F.textSecondary
                }}>
                  <span style={{ 
                    width: 5, height: 5, borderRadius: "50%", 
                    background: F.primary, marginTop: 7, flexShrink: 0,
                    boxShadow: `0 0 0 2px ${F.primaryGlow}`
                  }} />
                  {feature}
                </li>
              ))}
            </motion.ul>

            {/* Stats */}
            <motion.div variants={fadeInUp} style={{ 
              display: "flex", gap: 28, padding: "16px 0",
              borderTop: `1px solid ${F.border}`
            }}>
              {STATS.map((stat) => (
                <div key={stat.value}>
                  <div style={{ 
                    fontSize: "1.6rem", 
                    fontWeight: 600, 
                    color: F.text,
                    lineHeight: 1
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ 
                    fontSize: "0.75rem", 
                    color: F.textTertiary,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: 4
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Footer */}
            <motion.p variants={fadeInUp} className="font-mono" style={{ 
              fontSize: "0.7rem", 
              color: F.textTertiary,
              marginTop: "auto"
            }}>
              © {new Date().getFullYear()} ListKeeping · Enterprise Edition
            </motion.p>
          </motion.div>
        </motion.aside>

        {/* ════════════════════════════════════════════════════════════
            RIGHT PANEL — Sign In Form
        ════════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", maxWidth: 420 }}
          >
            {/* Card Container with Mica effect */}
            <div className="fluent-mica" style={{
              borderRadius: 8,
              padding: "28px 32px",
              boxShadow: F.elevation2
            }}>
              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <p className="font-mono" style={{ 
                  fontSize: "0.7rem", 
                  letterSpacing: "0.16em", 
                  color: F.primary, 
                  textTransform: "uppercase",
                  marginBottom: 12
                }}>
                  Welcome back
                </p>
                <h2 style={{ 
                  fontSize: "1.75rem", 
                  color: F.text, 
                  fontWeight: 600,
                  lineHeight: 1.2
                }}>
                  Sign in to your account
                </h2>
                <p className="text-secondary" style={{ 
                  fontSize: "0.95rem", 
                  marginTop: 8 
                }}>
                  Access your inventory dashboard and manage stock in real-time.
                </p>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="fluent-error"
                  >
                    <ErrorCircleRegular style={{ 
                      width: 16, height: 16, 
                      flexShrink: 0, marginTop: 2 
                    }} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                
                {/* Email Field */}
                <div>
                  <label htmlFor="email" style={{ 
                    display: "block", 
                    fontSize: "0.85rem", 
                    color: F.textSecondary, 
                    marginBottom: 6,
                    fontWeight: 500
                  }}>
                    Email address
                  </label>
                  <div style={{ position: "relative" }}>
                    <MailRegular style={{ 
                      position: "absolute", left: 12, top: "50%", 
                      transform: "translateY(-50%)",
                      width: 16, height: 16,
                      color: focused === "email" ? F.primary : F.textTertiary,
                      transition: "color 0.2s ease",
                      pointerEvents: "none"
                    }} />
                    <input
                      id="email"
                      type="email"
                      className="fluent-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                      disabled={loading}
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    marginBottom: 6 
                  }}>
                    <label htmlFor="password" style={{ 
                      fontSize: "0.85rem", 
                      color: F.textSecondary,
                      fontWeight: 500
                    }}>
                      Password
                    </label>
                    <Link href="/forgetpwd" className="fluent-link" style={{ fontSize: "0.85rem" }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: "relative" }}>
                    <LockClosedRegular style={{ 
                      position: "absolute", left: 12, top: "50%", 
                      transform: "translateY(-50%)",
                      width: 16, height: 16,
                      color: focused === "password" ? F.primary : F.textTertiary,
                      transition: "color 0.2s ease",
                      pointerEvents: "none"
                    }} />
                    <input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      className="fluent-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      style={{ paddingLeft: 36, paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      disabled={loading}
                      aria-label={showPwd ? "Hide password" : "Show password"}
                      className="fluent-reveal"
                      style={{
                        position: "absolute", right: 8, top: "50%",
                        transform: "translateY(-50%)",
                        background: "none", border: "none",
                        padding: 6, borderRadius: 4,
                        color: F.textTertiary, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}
                    >
                      {showPwd 
                        ? <EyeOffRegular style={{ width: 16, height: 16 }} />
                        : <EyeRegular style={{ width: 16, height: 16 }} />
                      }
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <label style={{ 
                  display: "flex", alignItems: "center", gap: 10, 
                  cursor: "pointer", userSelect: "none",
                  fontSize: "0.9rem", color: F.textSecondary
                }}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rememberMe}
                    onClick={() => !loading && setRememberMe(v => !v)}
                    disabled={loading}
                    className="fluent-checkbox"
                  >
                    {rememberMe 
                      ? <CheckmarkRegular style={{ width: 14, height: 14, color: F.textOnPrimary }} />
                      : null
                    }
                  </button>
                  <span>Keep me signed in</span>
                </label>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  whileTap={canSubmit ? { scale: 0.995 } : {}}
                  className="fluent-btn"
                  style={{ marginTop: 8 }}
                >
                  {loading ? (
                    <>
                      <span className="fluent-spinner" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRightRegular style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="fluent-divider" />

              {/* Register Link */}
              <p style={{ textAlign: "center", fontSize: "0.9rem", color: F.textSecondary }}>
                Don't have an account?{" "}
                <Link href="/register" className="fluent-link">
                  Create one now
                </Link>
              </p>

              {/* Security Badge */}
              <div style={{ 
                display: "flex", alignItems: "center", justifyContent: "center", 
                gap: 6, marginTop: 20, padding: "8px 12px",
                background: F.surfaceAlt, borderRadius: 4,
                border: `1px solid ${F.border}`
              }}>
                <ShieldRegular style={{ width: 14, height: 14, color: F.textTertiary }} />
                <span className="font-mono" style={{ 
                  fontSize: "0.7rem", color: F.textTertiary,
                  letterSpacing: "0.05em"
                }}>
                  CSRF PROTECTED · AES-256 ENCRYPTED
                </span>
              </div>
            </div>

            {/* Legal Footer */}
            <p style={{ 
              textAlign: "center", 
              fontSize: "0.8rem", 
              color: F.textTertiary, 
              marginTop: 20,
              lineHeight: 1.5
            }}>
              By signing in, you agree to our{" "}
              <Link href="/terms" className="fluent-link">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="fluent-link">Privacy Policy</Link>.
            </p>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default LoginPage;