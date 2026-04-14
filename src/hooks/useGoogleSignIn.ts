import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type GsiButtonOptions = {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  type?: "standard" | "icon";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

type GSI = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        nonce?: string;
        use_fedcm_for_prompt?: boolean;
        ux_mode?: "popup" | "redirect";
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      prompt: (cb?: (n: unknown) => void) => void;
      renderButton: (parent: HTMLElement, options: GsiButtonOptions) => void;
      disableAutoSelect: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GSI;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadGsiScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS script failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("GIS script failed to load"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Opens Google's GIS popup sign-in and signs the user into Supabase.
 * Flow:
 *   1. Generate raw nonce
 *   2. SHA-256 hash it → pass to GIS as `nonce`
 *   3. GIS returns id_token containing the HASHED nonce
 *   4. We pass the RAW nonce to supabase.auth.signInWithIdToken, which hashes it and compares
 *
 * Returns the session on success, throws on failure.
 */
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const pendingResolve = useRef<((idToken: string) => void) | null>(null);
  const pendingReject = useRef<((err: Error) => void) | null>(null);
  const currentRawNonce = useRef<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      setReady(false);
      return;
    }
    let cancelled = false;
    loadGsiScript()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!CLIENT_ID) return { ok: false, error: "VITE_GOOGLE_CLIENT_ID missing" };
    if (!window.google?.accounts?.id) {
      try {
        await loadGsiScript();
      } catch {
        return { ok: false, error: "Google Identity Services script could not load" };
      }
    }

    setLoading(true);
    try {
      const rawNonce = randomNonce();
      const hashedNonce = await sha256Hex(rawNonce);
      currentRawNonce.current = rawNonce;

      const idToken = await new Promise<string>((resolve, reject) => {
        pendingResolve.current = resolve;
        pendingReject.current = reject;

        window.google!.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          callback: (response) => {
            if (response?.credential) {
              pendingResolve.current?.(response.credential);
            } else {
              pendingReject.current?.(new Error("Aucun jeton reçu de Google"));
            }
            pendingResolve.current = null;
            pendingReject.current = null;
          },
        });

        window.google!.accounts.id.prompt((notification: unknown) => {
          // If One Tap is blocked/dismissed, prompt doesn't return a token — fall back to button.
          // We leave the prompt to resolve via callback; otherwise reject after timeout.
          const n = notification as { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean };
          if (typeof n?.isNotDisplayed === "function" && n.isNotDisplayed()) {
            pendingReject.current?.(new Error("GIS prompt bloqué par le navigateur"));
            pendingResolve.current = null;
            pendingReject.current = null;
          }
        });

        // Safety timeout (30s) — user may have dismissed
        setTimeout(() => {
          if (pendingResolve.current) {
            pendingReject.current?.(new Error("Connexion Google annulée"));
            pendingResolve.current = null;
            pendingReject.current = null;
          }
        }, 30_000);
      });

      // Exchange with Supabase using the RAW nonce (Supabase re-hashes and validates)
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce: currentRawNonce.current!,
      });

      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "Connexion Google échouée";
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Render Google's official branded button inside a container element.
   * Clicking the button opens the full account picker + consent popup that shows
   * the BonoitecPilot app name + logo from the OAuth consent screen (not the
   * Supabase redirect URI host).
   */
  const renderButton = useCallback(
    async (
      container: HTMLElement,
      options: GsiButtonOptions = { theme: "outline", size: "large", text: "continue_with", shape: "pill", width: 360, locale: "fr_FR" },
      onSuccess?: () => void,
      onError?: (e: string) => void,
    ) => {
      if (!CLIENT_ID) {
        onError?.("VITE_GOOGLE_CLIENT_ID missing");
        return;
      }
      try {
        await loadGsiScript();
      } catch {
        onError?.("Google Identity Services script could not load");
        return;
      }
      if (!window.google?.accounts?.id) {
        onError?.("GIS not available");
        return;
      }

      const rawNonce = randomNonce();
      const hashedNonce = await sha256Hex(rawNonce);

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        nonce: hashedNonce,
        ux_mode: "popup",
        callback: async (response) => {
          if (!response?.credential) {
            onError?.("Aucun jeton reçu de Google");
            return;
          }
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce: rawNonce,
          });
          if (error) onError?.(error.message);
          else onSuccess?.();
        },
      });

      // Clear previous button (if re-rendering) then mount a fresh one
      container.innerHTML = "";
      window.google.accounts.id.renderButton(container, options);
    },
    [],
  );

  return {
    /** True when the GIS script is loaded and ready to call. */
    ready,
    /** True while an sign-in attempt is in flight. */
    loading,
    /** Whether a Google client ID is configured at all. */
    enabled: Boolean(CLIENT_ID),
    signIn,
    renderButton,
  };
}
