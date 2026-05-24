"use client";

import { supabase } from "./supabase";
import { initUserStore, clearStore } from "./userStore";
import type { Profile } from "./game";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id:    string;
  email: string;
};

export type AuthResult =
  | { ok: true;  user: AuthUser }
  | { ok: false; error: string };

// ── Auth actions ──────────────────────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult & { needsProfile?: boolean }> {
  if (!supabase) return { ok: false, error: "Supabase non configuré." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: friendlyError(error?.message) };
  }

  // Load all user data from DB into the store
  await initUserStore();

  // Check if profile exists (store will have default username if not)
  const needsProfile = !data.user;
  return {
    ok: true,
    user: { id: data.user.id, email: data.user.email ?? email },
    needsProfile,
  };
}

export async function signUp(
  email: string,
  password: string,
  profile: Profile,
): Promise<AuthResult & { needsConfirmation?: boolean }> {
  if (!supabase) return { ok: false, error: "Supabase non configuré." };

  const { data, error } = await supabase.auth.signUp({ email, password });
  console.log("[auth] signUp — user:", data.user?.id ?? null, "session:", !!data.session, "error:", error);

  if (error) {
    console.error("[auth] signUp error:", error);
    return { ok: false, error: friendlyError(error.message) };
  }

  if (!data.user) {
    return {
      ok: false,
      error: "Cet email est déjà utilisé. Vérifie ta boîte mail pour le lien de confirmation, ou connecte-toi.",
    };
  }

  if (!data.session) {
    // Email confirmation required — save profile to DB for when they confirm
    await supabase.from("user_profiles").upsert({
      id:       data.user.id,
      username: profile.username,
      avatar:   profile.avatar,
    });
    return {
      ok: true,
      needsConfirmation: true,
      user: { id: data.user.id, email: data.user.email ?? email },
    };
  }

  // Session is active — upsert profile and init store
  await supabase.from("user_profiles").upsert({
    id:       data.user.id,
    username: profile.username,
    avatar:   profile.avatar,
  });
  await initUserStore();

  return { ok: true, user: { id: data.user.id, email: data.user.email ?? email } };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
  clearStore();
}

/** Returns the current authenticated user, or null if not logged in. */
export async function getAuthUser(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}

// ── Error messages ────────────────────────────────────────────────────────────

function friendlyError(msg?: string): string {
  if (!msg) return "Une erreur est survenue.";
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Confirme ton email avant de te connecter.";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "Un compte existe déjà avec cet email.";
  if (m.includes("password should be") || m.includes("password must be"))
    return "Le mot de passe doit faire au moins 6 caractères.";
  if (m.includes("unable to validate"))
    return "Email ou mot de passe invalide.";
  if (m.includes("rate limit") || m.includes("over_email") || m.includes("email rate"))
    return "Limite d'emails atteinte (quota Supabase gratuit). Solution : désactive la confirmation d'email dans le dashboard Supabase → Auth → Providers → Email.";
  if (m.includes("security purposes") || m.includes("request this after"))
    return "Trop de tentatives — attends quelques secondes et réessaie.";
  if (m.includes("sending confirmation") || (m.includes("send") && m.includes("email")))
    return "Impossible d'envoyer l'email de confirmation — réessaie dans quelques minutes.";
  return msg;
}
