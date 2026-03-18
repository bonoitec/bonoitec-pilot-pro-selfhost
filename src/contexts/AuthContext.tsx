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
        // If the user was deleted or token refresh failed, force sign out
        if (event === "SIGNED_OUT" || event === "USER_DELETED") {
          setSession(null);
          setLoading(false);
          hadSessionRef.current = false;
          return;
        }

        // If we previously had a session but now it's null, the token refresh
        // likely failed (deleted user). Force clean sign out.
        if (hadSessionRef.current && !session && event === "TOKEN_REFRESHED") {
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
        // Verify the user still exists by trying to get fresh user data
        supabase.auth.getUser().then(({ error }) => {
          if (error) {
            // User was deleted — clear session
            setSession(null);
            setLoading(false);
            hadSessionRef.current = false;
            supabase.auth.signOut().catch(() => {});
          } else {
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
