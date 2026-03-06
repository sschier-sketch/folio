import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isBanned: boolean;
  banReason: string | null;
  checkingBan: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEDUP_WINDOW_MS = 10_000;

async function fetchClientIp(): Promise<string> {
  const services = [
    "https://api.ipify.org?format=json",
    "https://api.seeip.org/jsonip",
  ];
  for (const url of services) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const ip = data.ip || "";
        if (ip) return ip;
      }
    } catch {}
  }
  return "";
}

async function sendAuthEvent(
  session: { access_token: string; user: { id: string } },
  eventType: string,
) {
  const clientIp = await fetchClientIp();

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-auth-event`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        userId: session.user.id,
        eventType,
        userAgent: navigator.userAgent,
        clientIp,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("log-auth-event failed:", res.status, text);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [checkingBan, setCheckingBan] = useState(false);
  const loggedRef = useRef<{ userId: string; ts: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN" && session?.user && session.access_token) {
        const now = Date.now();
        const prev = loggedRef.current;
        if (prev && prev.userId === session.user.id && now - prev.ts < DEDUP_WINDOW_MS) {
          return;
        }
        loggedRef.current = { userId: session.user.id, ts: now };

        const eventType = sessionStorage.getItem("auth_event_type") || "login";
        sessionStorage.removeItem("auth_event_type");

        const capturedSession = { access_token: session.access_token, user: { id: session.user.id } };
        (async () => {
          try {
            await sendAuthEvent(capturedSession, eventType);
          } catch (err) {
            console.error("sendAuthEvent error:", err);
          }
        })();
      }

      if (event === "SIGNED_OUT") {
        loggedRef.current = null;
        sessionStorage.removeItem("auth_event_type");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setIsBanned(false);
      setBanReason(null);
      setCheckingBan(false);
      return;
    }

    const userId = user.id;

    const checkBanStatus = async () => {
      setCheckingBan(true);
      try {
        const { data, error } = await supabase
          .from("account_profiles")
          .select("banned, ban_reason")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error checking ban status:", error);
          setCheckingBan(false);
          return;
        }

        if (data?.banned) {
          setIsBanned(true);
          setBanReason(data.ban_reason || null);
        } else {
          setIsBanned(false);
          setBanReason(null);
        }
      } catch (err) {
        console.error("Error checking ban status:", err);
      } finally {
        setCheckingBan(false);
      }
    };

    checkBanStatus();
  }, [user?.id]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isBanned, banReason, checkingBan, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
