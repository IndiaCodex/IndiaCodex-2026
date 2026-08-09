"use client";

import { api, getTokens, setTokens } from "@/lib/api";
import { useRouter } from "next/navigation";
import * as React from "react";

export type Role = "user" | "hospital" | "admin";

export type Session = {
  role: Role;
  name: string;
  email: string;
};

// Hospital portal has no backend yet - it keeps a mock session.
const HOSPITAL_KEY = "medvault.hospital.session";

const homes: Record<Role, string> = {
  user: "/dashboard",
  hospital: "/hospital",
  admin: "/admin",
};

const logins: Record<Role, string> = {
  user: "/auth/login",
  hospital: "/hospital-auth/login",
  admin: "/admin-auth/login",
};

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  /** Real backend login (user/admin). Routes by the role the SERVER returns. */
  loginBackend: (email: string, password: string) => Promise<void>;
  /** Real backend registration. */
  registerBackend: (email: string, password: string) => Promise<void>;
  /** Mock login for the hospital portal only. */
  loginHospital: (name: string, email: string) => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

function nameFromEmail(email: string) {
  const raw = email.split("@")[0] ?? "there";
  return raw.replace(/^\w/, (c) => c.toUpperCase());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    async function restore() {
      try {
        const hospital = localStorage.getItem(HOSPITAL_KEY);
        if (hospital) {
          setSession(JSON.parse(hospital));
          return;
        }
        if (getTokens()) {
          const me = await api.me();
          setSession({ role: me.role, name: nameFromEmail(me.email), email: me.email });
        }
      } catch {
        setTokens(null);
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  const loginBackend = React.useCallback(
    async (email: string, password: string) => {
      const me = await api.login(email, password);
      const s: Session = { role: me.role, name: nameFromEmail(me.email), email: me.email };
      setSession(s);
      router.push(homes[me.role]);
    },
    [router]
  );

  const registerBackend = React.useCallback(async (email: string, password: string) => {
    await api.register(email, password);
  }, []);

  const loginHospital = React.useCallback(
    (name: string, email: string) => {
      const s: Session = { role: "hospital", name, email };
      localStorage.setItem(HOSPITAL_KEY, JSON.stringify(s));
      setSession(s);
      router.push("/hospital");
    },
    [router]
  );

  const logout = React.useCallback(() => {
    const role = session?.role ?? "user";
    localStorage.removeItem(HOSPITAL_KEY);
    api.logout();
    setSession(null);
    router.push(logins[role]);
  }, [router, session]);

  return (
    <AuthContext.Provider
      value={{ session, loading, loginBackend, registerBackend, loginHospital, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (!session) router.replace(logins[role]);
    else if (session.role !== role) router.replace(homes[session.role]);
  }, [session, loading, role, router]);

  if (loading || !session || session.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }
  return <>{children}</>;
}
