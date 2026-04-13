import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const hadSessionRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // eslint-disable-next-line no-console
        console.warn(`[refresh-telemetry ${new Date().toISOString()}] auth event:`, event, { hasSession: !!session, hadSession: hadSessionRef.current });

        if (event === "SIGNED_OUT") {
          setSession(null);
          setLoading(false);
          hadSessionRef.current = false;
          return;
        }

        // Force sign-out path (defensive). If Supabase fires TOKEN_REFRESHED
        // with NO session after we previously had one, the session is dead.
        if (hadSessionRef.current && !session && event === "TOKEN_REFRESHED") {
          // eslint-disable-next-line no-console
          console.warn(`[refresh-telemetry] FORCE SIGNOUT — TOKEN_REFRESHED with null session`);
          setSession(null);
          setLoading(false);
          hadSessionRef.current = false;
          supabase.auth.signOut().catch(() => {});
          return;
        }

        if (session) {
          hadSessionRef.current = true;
        }
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        hadSessionRef.current = true;
        // Verify the user still exists. Only force-sign-out on a true auth error
        // (401/invalid token). Transient network/5xx errors must NOT wipe the session
        // — that would kick the user out mid-form and lose their work.
        supabase.auth.getUser().then(({ data, error }) => {
          const looksDeleted =
            error &&
            typeof error === "object" &&
            "status" in error &&
            ((error as { status: number }).status === 401 ||
              (error as { status: number }).status === 403);

          if (looksDeleted) {
            // Actual auth failure — user was deleted or token is invalid
            setSession(null);
            setLoading(false);
            hadSessionRef.current = false;
            supabase.auth.signOut().catch(() => {});
          } else {
            // Either success, or transient error — trust the existing session
            setSession(session);
            setLoading(false);
          }
        });
      } else {
        setSession(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    hadSessionRef.current = false;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
