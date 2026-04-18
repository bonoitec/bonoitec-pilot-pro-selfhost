import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavbarBrand } from "@/components/NavbarBrand";
import { AuthHeroScene } from "@/components/AuthHeroScene";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? "";
const TURNSTILE_ENABLED = TURNSTILE_SITE_KEY.length > 0;

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const [loginTurnstileToken, setLoginTurnstileToken] = useState<string | null>(null);
  const loginTurnstileRef = useRef<HTMLDivElement>(null);
  const loginTurnstileWidgetId = useRef<string | null>(null);

  // Generic Turnstile renderer
  const renderTurnstileWidget = useCallback((
    containerRef: React.RefObject<HTMLDivElement>,
    widgetIdRef: React.MutableRefObject<string | null>,
    setToken: (token: string | null) => void,
  ) => {
    if (!containerRef.current) return;
    if (widgetIdRef.current !== null && window.turnstile) {
      try { window.turnstile.remove(widgetIdRef.current); } catch {}
      widgetIdRef.current = null;
    }
    setToken(null);

    const render = () => {
      if (!containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setToken(token),
        "expired-callback": () => setToken(null),
        "error-callback": () => setToken(null),
        theme: "auto",
        size: "flexible",
      });
    };

    if (window.turnstile) {
      render();
    } else {
      if (!document.getElementById("cf-turnstile-script")) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.onload = () => render();
        document.head.appendChild(script);
      }
    }
  }, []);


  // Redirect to dashboard if already authenticated
  // Forward-declare email helpers for use in useEffect
  const sendWelcomeEmailRef = async (email: string, fullName: string, userId: string) => {
    try {
      await new Promise(r => setTimeout(r, 2000));
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userId)
        .single();
      if (profile) {
        await supabase.functions.invoke("send-email", {
          body: {
            template: "welcome_signup",
            to: email,
            data: { clientName: fullName },
            organization_id: profile.organization_id,
          },
        });
      }
    } catch { /* non-blocking */ }
  };

  const sendLoginAlertEmailRef = async (email: string, userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id, full_name")
        .eq("user_id", userId)
        .single();
      if (profile) {
        await supabase.functions.invoke("send-email", {
          body: {
            template: "login_alert",
            to: email,
            data: {
              clientName: profile.full_name || email,
              loginTime: new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }),
            },
            organization_id: profile.organization_id,
          },
        });
      }
    } catch { /* non-blocking */ }
  };

  useEffect(() => {
    if (!authLoading && session) {
      const intent = localStorage.getItem("auth_intent");
      const user = session.user;

      // If user came from Google OAuth with "login" intent, check if account was just created
      if (intent === "login" && user) {
        const createdAt = new Date(user.created_at).getTime();
        const now = Date.now();
        const justCreated = now - createdAt < 30000;

        if (justCreated && user.app_metadata?.provider === "google") {
          localStorage.removeItem("auth_intent");
          supabase.auth.signOut().then(() => {
            toast.error("Aucun compte n'existe avec cette adresse Google.", {
              description: "Veuillez d'abord créer un compte avant de vous connecter avec Google.",
              duration: 6000,
            });
          });
          return;
        }
      }

      // If user came from Google OAuth with "signup" intent and just created
      if (intent === "signup" && user) {
        const createdAt = new Date(user.created_at).getTime();
        const justCreated = Date.now() - createdAt < 30000;
        if (justCreated) {
          sendWelcomeEmailRef(user.email || "", user.user_metadata?.full_name || user.email || "", user.id);
        }
      }

      // Send login alert for returning users (not newly created)
      if (intent && user) {
        const createdAt = new Date(user.created_at).getTime();
        const justCreated = Date.now() - createdAt < 30000;
        if (!justCreated) {
          sendLoginAlertEmailRef(user.email || "", user.id);
        }
      }

      localStorage.removeItem("auth_intent");
      navigate("/dashboard", { replace: true });
    }
  }, [session, authLoading, navigate]);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");

  useEffect(() => {
    if (!TURNSTILE_ENABLED) return;
    const timer = setTimeout(() => {
      if (activeTab === "signup") {
        renderTurnstileWidget(turnstileRef, turnstileWidgetId, setTurnstileToken);
      } else {
        renderTurnstileWidget(loginTurnstileRef, loginTurnstileWidgetId, setLoginTurnstileToken);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, renderTurnstileWidget]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Anti-bot: disposable email domains blocklist ──
  const BLOCKED_DOMAINS = new Set([
    "sharebot.net", "test.invalid", "mailinator.com", "guerrillamail.com", "guerrillamailblock.com",
    "tempmail.com", "throwaway.email", "temp-mail.org", "fakeinbox.com", "trashmail.com",
    "yopmail.com", "10minutemail.com", "dispostable.com", "maildrop.cc", "getairmail.com",
    "mohmal.com", "getnada.com", "mailnesia.com", "tempail.com", "burnermail.io",
    "grr.la", "sharklasers.com", "guerrillamail.info", "spam4.me", "byom.de",
    "trashmail.net", "trashmail.me", "discard.email", "mailsac.com", "inboxkitten.com",
    "temp-mail.io", "emailondeck.com", "mintemail.com", "tempinbox.com",
  ]);

  const isDisposableEmail = (email: string): boolean => {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;
    if (BLOCKED_DOMAINS.has(domain)) return true;
    // Block .invalid TLD and other suspicious TLDs
    if (domain.endsWith(".invalid") || domain.endsWith(".test") || domain.endsWith(".example")) return true;
    return false;
  };

  // ── UX rate limiting (NOT security) ──
  // This is a soft cap on rapid signup retries. It's stored in localStorage and
  // can be bypassed by clearing browser data. Real rate limiting is enforced
  // server-side via Supabase Auth built-ins and Cloudflare Turnstile.
  const RATE_LIMIT_KEY = "signup_attempts";
  const RATE_LIMIT_MAX = 3;
  const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

  const isRateLimited = (): boolean => {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return false;
      const attempts: number[] = JSON.parse(raw);
      const recent = attempts.filter((t) => Date.now() - t < RATE_LIMIT_WINDOW_MS);
      return recent.length >= RATE_LIMIT_MAX;
    } catch {
      return false;
    }
  };

  const recordSignupAttempt = () => {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      const attempts: number[] = raw ? JSON.parse(raw) : [];
      attempts.push(Date.now());
      // Keep only recent attempts
      const recent = attempts.filter((t) => Date.now() - t < RATE_LIMIT_WINDOW_MS);
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
    } catch { /* ignore */ }
  };

  const validateSignup = () => {
    const e: Record<string, string> = {};
    if (!signupFirstName.trim()) e.firstName = "Requis";
    if (!signupLastName.trim()) e.lastName = "Requis";
    if (!signupEmail.trim()) e.email = "Requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) e.email = "E-mail invalide";
    else if (isDisposableEmail(signupEmail)) e.email = "Les adresses e-mail jetables ne sont pas acceptées";
    if (signupPassword.length < 6) e.password = "6 caractères minimum";
    if (signupPassword !== signupConfirmPassword) e.confirmPassword = "Ne correspond pas";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Turnstile CAPTCHA verification (only if enabled)
    if (TURNSTILE_ENABLED) {
      if (!loginTurnstileToken) {
        toast.error("Veuillez compléter la vérification anti-bot.");
        return;
      }
    }

    setLoading(true);

    // Server-side Turnstile verification (only if enabled)
    if (TURNSTILE_ENABLED) {
      try {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-turnstile", {
          body: { token: loginTurnstileToken },
        });
        if (verifyError || !verifyData?.success) {
          setLoading(false);
          toast.error("La vérification anti-bot a échoué.", { description: "Veuillez réessayer." });
          if (loginTurnstileWidgetId.current && window.turnstile) {
            window.turnstile.reset(loginTurnstileWidgetId.current);
          }
          setLoginTurnstileToken(null);
          return;
        }
      } catch {
        setLoading(false);
        toast.error("Erreur lors de la vérification. Veuillez réessayer.");
        return;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials") || error.message.toLowerCase().includes("invalid_credentials")) {
        toast.error("Aucun compte n'est associé à cette adresse e-mail, ou le mot de passe est incorrect.", {
          description: "Vérifiez vos identifiants ou créez un compte.",
          duration: 5000,
        });
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Veuillez confirmer votre adresse e-mail avant de vous connecter.", {
          description: "Vérifiez votre boîte de réception.",
          duration: 5000,
        });
      } else {
        toast.error(error.message);
      }
      return;
    }
    // Send login alert email (fire and forget)
    if (data?.user) {
      sendLoginAlertEmailRef(data.user.email || "", data.user.id);
    }
    navigate("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    // Rate limiting check
    if (isRateLimited()) {
      toast.error("Trop de tentatives d'inscription.", {
        description: "Veuillez patienter quelques minutes avant de réessayer.",
        duration: 6000,
      });
      return;
    }

    // Turnstile CAPTCHA verification (only if enabled)
    if (TURNSTILE_ENABLED) {
      if (!turnstileToken) {
        toast.error("Veuillez compléter la vérification anti-bot.");
        return;
      }
    }

    recordSignupAttempt();
    setLoading(true);

    // Server-side Turnstile verification (only if enabled)
    if (TURNSTILE_ENABLED) {
      try {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-turnstile", {
          body: { token: turnstileToken },
        });
        if (verifyError || !verifyData?.success) {
          setLoading(false);
          toast.error("La vérification anti-bot a échoué.", {
            description: "Veuillez réessayer.",
          });
          // Reset the widget
          if (turnstileWidgetId.current && window.turnstile) {
            window.turnstile.reset(turnstileWidgetId.current);
          }
          setTurnstileToken(null);
          return;
        }
      } catch {
        setLoading(false);
        toast.error("Erreur lors de la vérification. Veuillez réessayer.");
        return;
      }
    }

    const { data: signupData, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: `${signupFirstName} ${signupLastName}`.trim(),
          organization_name: "Mon atelier",
          phone: signupPhone,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Send welcome email (fire and forget)
    if (signupData?.user) {
      sendWelcomeEmailRef(signupData.user.email || "", `${signupFirstName} ${signupLastName}`.trim(), signupData.user.id);
    }
    toast.success("Votre compte a été créé ! Vérifiez votre boîte mail pour confirmer votre inscription.", { duration: 6000 });
  };

  const googleSignIn = useGoogleSignIn();
  const googleBtnContainer = useRef<HTMLDivElement>(null);

  // Mount Google's official branded button when GIS is ready.
  // The button clicks open a popup that shows "BonoitecPilot" + the consent-screen logo.
  useEffect(() => {
    if (!googleSignIn.ready || !googleBtnContainer.current) return;
    localStorage.setItem("auth_intent", activeTab);
    googleSignIn.renderButton(
      googleBtnContainer.current,
      { theme: "outline", size: "large", text: "continue_with", shape: "pill", width: 360, locale: "fr_FR" },
      () => {
        // Session is set by supabase.auth.signInWithIdToken — AuthContext picks it up.
      },
      (err) => {
        toast.error(`Erreur Google: ${err}`);
      },
    );
  }, [googleSignIn.ready, googleSignIn.renderButton, activeTab]);

  const handleGoogleLogin = async () => {
    localStorage.setItem("auth_intent", activeTab);

    // Primary: GIS popup flow — shows "BonoitecPilot" in consent, not the Supabase URL.
    if (googleSignIn.enabled && googleSignIn.ready) {
      setLoading(true);
      const res = await googleSignIn.signIn();
      setLoading(false);
      if (res.ok) {
        // Session is set by Supabase. AuthContext will pick it up and redirect via the effect below.
        return;
      }
      // Fall through to the old redirect flow if GIS failed (user blocked popup, FedCM off, etc.)
      toast.message("Connexion Google: bascule sur la méthode de secours…");
    }

    // Fallback: legacy Supabase OAuth redirect (still shows the Supabase URL but always works).
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    setLoading(false);
    if (error) toast.error("Erreur lors de la connexion Google");
  };

  const inputClass = (err?: string) =>
    `h-[42px] text-sm ${err ? "border-destructive" : ""}`;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="flex w-full max-w-[1200px]">
      {/* LEFT — Visual panel */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 gradient-primary opacity-[0.04]" />
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] bg-primary-glow/8 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-dots opacity-20" />
        </div>

        {/* Cinematic product scene — floating glass cards with live ticket
            lifecycle, stats, and inventory. Shows from xl (1280px) and up;
            cards are sized so the scene and the text column don't overlap. */}
        <div className="absolute inset-0 z-0 pointer-events-none hidden xl:block">
          <AuthHeroScene />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <Link to="/" className="inline-flex items-center w-fit group" aria-label="BonoitecPilot">
            <NavbarBrand />
          </Link>

          <div className="max-w-[260px] space-y-10">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-[2.75rem] leading-[1.1] font-extrabold tracking-tight text-foreground font-display">
                Votre atelier, <br />
                <span className="gradient-text">simplifié.</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
                Gérez vos réparations, devis, clients et stock depuis une seule plateforme intuitive.
              </p>
            </motion.div>

            {/* Feature list with cascading stagger */}
            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { delayChildren: 1.8, staggerChildren: 0.1 } },
              }}
            >
              {["Devis et factures automatisés", "Suivi des réparations en temps réel", "Gestion de stock intégrée", "Essai gratuit 30 jours"].map((item) => (
                <motion.div
                  key={item}
                  className="flex items-center gap-3"
                  variants={{
                    hidden: { opacity: 0, x: -14 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                  }}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full gradient-primary-subtle text-primary">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm text-foreground/80">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.p
            className="text-xs text-muted-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 0.8 }}
          >
            Accès complet · Sans carte bancaire · Annulation libre
          </motion.p>
        </div>
      </div>

      {/* RIGHT — Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 sm:px-8 lg:px-16">
        {/* Theme toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Mobile header */}
        <div className="lg:hidden flex flex-col items-center gap-1 mb-10">
          <Link to="/" className="inline-flex items-center" aria-label="BonoitecPilot">
            <NavbarBrand />
          </Link>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-display">
              {activeTab === "signup" ? "Créez votre espace" : "Bon retour"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {activeTab === "signup"
                ? "30 jours gratuits, sans engagement."
                : "Connectez-vous à votre tableau de bord."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-muted/50 p-1 mb-6 border border-border/30">
            {(["signup", "login"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setErrors({}); }}
                className={`flex-1 text-[13px] font-semibold py-2.5 rounded-lg transition-all duration-300 ${
                  activeTab === tab
                    ? "gradient-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "signup" ? "Créer un compte" : "Connexion"}
              </button>
            ))}
          </div>

          {/* Google — custom styled button overlaying Google's official GIS iframe.
              The iframe handles the actual click (required for the popup to open);
              the styled layer gives us site-consistent design. */}
          {googleSignIn.ready ? (
            <div className="relative w-full h-[42px]">
              {/* Invisible Google GIS iframe — the real click target */}
              <div
                ref={googleBtnContainer}
                className="absolute inset-0 z-10 flex items-center justify-center opacity-0 [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full"
              />
              {/* Visible styled layer matching the rest of the site's buttons */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 rounded-xl border border-input bg-background text-sm font-medium text-foreground"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuer avec Google
              </div>
            </div>
          ) : (
            /* Fallback while GIS is still loading (or failed): legacy redirect flow */
            <Button
              variant="outline"
              className="w-full h-[42px] gap-2.5 text-sm font-medium rounded-xl"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuer avec Google
            </Button>
          )}

          <div className="relative my-5">
            <Separator className="bg-border/30" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[11px] text-muted-foreground/50 uppercase tracking-wider">
              ou
            </span>
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {activeTab === "signup" ? (
              <motion.form
                key="signup"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSignup}
                className="space-y-3.5"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="s-first" className="text-xs font-medium">Prénom</Label>
                    <Input id="s-first" placeholder="Jean" value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)} required className={inputClass(errors.firstName)} />
                    {errors.firstName && <p className="text-[11px] text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="s-last" className="text-xs font-medium">Nom</Label>
                    <Input id="s-last" placeholder="Dupont" value={signupLastName}
                      onChange={(e) => setSignupLastName(e.target.value)} required className={inputClass(errors.lastName)} />
                    {errors.lastName && <p className="text-[11px] text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-email" className="text-xs font-medium">E-mail</Label>
                  <Input id="s-email" type="email" placeholder="nom@exemple.com" value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)} required className={inputClass(errors.email)} />
                  {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-phone" className="text-xs font-medium">
                    Téléphone <span className="text-muted-foreground/50 font-normal">optionnel</span>
                  </Label>
                  <Input id="s-phone" type="tel" placeholder="06 12 34 56 78" value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)} className={inputClass()} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-pw" className="text-xs font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Input id="s-pw" type={showSignupPassword ? "text" : "password"} placeholder="Min. 6 caractères" value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)} required
                      className={`pr-10 h-[42px] text-sm ${errors.password ? "border-destructive" : ""}`} />
                    <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
                      {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-cpw" className="text-xs font-medium">Confirmer</Label>
                  <div className="relative">
                    <Input id="s-cpw" type={showSignupConfirm ? "text" : "password"} placeholder="Confirmez le mot de passe" value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)} required
                      className={`pr-10 h-[42px] text-sm ${errors.confirmPassword ? "border-destructive" : ""}`} />
                    <button type="button" onClick={() => setShowSignupConfirm(!showSignupConfirm)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
                      {showSignupConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[11px] text-destructive">{errors.confirmPassword}</p>}
                </div>

                {/* Cloudflare Turnstile CAPTCHA */}
                {TURNSTILE_ENABLED && <div ref={turnstileRef} className="flex justify-center" />}

                <Button type="submit" variant="premium" className="w-full h-[42px] text-sm font-semibold mt-1 rounded-xl" disabled={loading || (TURNSTILE_ENABLED && !turnstileToken)}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Créer mon compte
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="login"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleLogin}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <Label htmlFor="l-email" className="text-xs font-medium">E-mail</Label>
                  <Input id="l-email" type="email" placeholder="nom@exemple.com" value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)} required className={inputClass()} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="l-pw" className="text-xs font-medium">Mot de passe</Label>
                    <button
                      type="button"
                      className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                      onClick={async () => {
                        if (!loginEmail.trim()) {
                          toast.error("Entrez votre e-mail d'abord.");
                          return;
                        }
                        setLoading(true);
                        const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        setLoading(false);
                        if (error) toast.error(error.message);
                        else toast.success("Un e-mail de réinitialisation a été envoyé.");
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Input id="l-pw" type={showLoginPassword ? "text" : "password"} placeholder="Votre mot de passe" value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)} required
                      className="pr-10 h-[42px] text-sm" />
                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
                      {showLoginPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} className="h-3.5 w-3.5" />
                  <label htmlFor="remember" className="text-[11px] text-muted-foreground cursor-pointer select-none">Se souvenir de moi</label>
                </div>

                {/* Cloudflare Turnstile CAPTCHA */}
                {TURNSTILE_ENABLED && <div ref={loginTurnstileRef} className="flex justify-center" />}

                <Button type="submit" variant="premium" className="w-full h-[42px] text-sm font-semibold mt-1 rounded-xl" disabled={loading || (TURNSTILE_ENABLED && !loginTurnstileToken)}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-muted-foreground/40 text-center mt-6 leading-relaxed">
            En continuant, vous acceptez les{" "}
            <Link to="/cgu-cgv" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">CGU</Link>
            {" "}et la{" "}
            <Link to="/confidentialite" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">Politique de confidentialité</Link>.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Auth;
