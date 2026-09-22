"use client";

import * as React from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AppProvider, ToastProvider, useApp } from "@/lib/store";
import { ToastViewport } from "@/components/shell";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import { loadSessionUser } from "@/lib/supabase/auth";
import { hydrateAll } from "@/lib/supabase/data";
import { RealtimeBridge } from "@/components/realtime";

/**
 * In real (Supabase) mode this keeps the app store in sync with the auth
 * session: on sign-in it loads the Locora profile, on sign-out it clears it.
 * In mock mode it renders nothing extra.
 */
function SupabaseAuthBridge() {
  const { dispatch } = useApp();
  const hydratedFor = React.useRef<string | null>(null);
  const hadSession = React.useRef(false);

  React.useEffect(() => {
    if (!REAL_MODE) return;
    const sb = supabase();
    if (!sb) return;

    let mounted = true;

    const syncSession = async (session: Session | null) => {
      if (!mounted) return;
      if (!session) {
        // only reset when this is an actual sign-out (a session we had),
        // so guests keep their saved location/preferences across reloads
        if (hadSession.current) {
          dispatch({ type: "LOGOUT" });
          dispatch({ type: "RESET" });
          hydratedFor.current = null;
          hadSession.current = false;
        }
        return;
      }
      hadSession.current = true;
      const user = await loadSessionUser(session);
      if (!user || !mounted) return;
      dispatch({ type: "UPSERT_USER", user });
      dispatch({ type: "LOGIN", userId: user.id });

      // Phase B: pull the marketplace data for this account from Supabase
      // (once per sign-in — dispatches are mirrored back on every write)
      if (hydratedFor.current === user.id) return;
      hydratedFor.current = user.id;
      const data = await hydrateAll(sb, user.id);
      if (data && mounted) dispatch({ type: "HYDRATE_DATA", data });
    };

    sb.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) =>
      syncSession(session)
    );

    const { data: sub } = sb.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      syncSession(session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppProvider>
        <SupabaseAuthBridge />
        <RealtimeBridge />
        {children}
        <ToastViewport />
      </AppProvider>
    </ToastProvider>
  );
}
