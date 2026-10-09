import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { appRedirectUrl } from "../basePath";
import { supabase } from "./client";

export type AuthState = {
  user: User | null;
  session: Session | null;
};

export type AuthStateChange = AuthState & {
  event: AuthChangeEvent;
};

export async function getAuthState(): Promise<AuthState> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return {
    session,
    user: session?.user ?? null,
  };
}

export function subscribeToAuthChanges(callback: (authState: AuthStateChange) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback({
      event,
      session,
      user: session?.user ?? null,
    });
  });

  return () => {
    subscription.unsubscribe();
  };
}

export async function signUpWithEmail(displayName: string, email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: appRedirectUrl(),
      data: {
        display_name: displayName,
      },
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function sendPasswordResetEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appRedirectUrl(),
  });
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({
    password: newPassword,
  });
}

export async function verifyCurrentPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: appRedirectUrl(),
    },
  });
}
