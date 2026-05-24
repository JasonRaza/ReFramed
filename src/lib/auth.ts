"use client";

import { supabase } from "./supabase";
import type { Profile } from "./game";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResult =
  | { ok: true;  user: AuthUser }
  | { ok: false; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sync Supabase user ID into localStorage so getPlayerId() returns the right value. */
function syncPlayerId(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("reframed_player_id", userId);
}

/** Load profile from user_profiles table and sync to localStorage. */
async function syncProfileFromDb(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("user_profiles")
    .select("username, avatar")
    .eq("id", userId)
    .single();
  if (!data) return null;
  const profile: Profile = { username: data.username as string, avatar: data.avatar as string };
  localStorage.setItem("reframed_profile", JSON.stringify(profile));
  return profile;
}

/** Upsert profile in user_profiles table and sync to localStorage. */
export async function saveProfileToDb(
  userId: string,
  profile: Profile,
): Promise<void> {
  if (!supabase) return;
  await supabase.from("user_profiles").upsert({
    id: userId,
    username: profile.username,
    avatar: profile.avatar,
  });
  localStorage.setItem("reframed_profile", JSON.stringify(profile));
}

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

  syncPlayerId(data.user.id);
  let profile = await syncProfileFromDb(data.user.id);

  // If profile doesn't exist in DB yet (e.g. signed up with email confirmation),
  // try to push the locally saved profile to DB now that we have a session.
  if (!profile) {
    const raw = typeof window !== "undefined" ? localStorage.getItem("reframed_profile") : null;
    if (raw) {
      try {
        const local = JSON.parse(raw) as Profile;
        await saveProfileToDb(data.user.id, local);
        profile = local;
      } catch { /* ignore */ }
    }
  }

  return {
    ok: true,
    user: { id: data.user.id, email: data.user.email ?? email },
    needsProfile: !profile,
  };
}

export async function signUp(
  email: string,
  password: string,
  profile: Profile,
): Promise<AuthResult & { needsConfirmation?: boolean }> {
  if (!supabase) return { ok: false, error: "Supabase non configuré." };

  const { data, error } = await supabase.auth.signUp({ email, password });
  console.log("[auth] signUp response — user:", data.user?.id ?? null, "session:", !!data.session, "error:", error);

  if (error) {
    console.error("[auth] signUp error:", error);
    return { ok: false, error: friendlyError(error.message) };
  }

  // Supabase returns user:null (no error) when the email is already registered
  // but not yet confirmed — it silently swallows it to prevent enumeration.
  if (!data.user) {
    return {
      ok: false,
      error: "Cet email est déjà utilisé. Vérifie ta boîte mail pour le lien de confirmation, ou connecte-toi.",
    };
  }

  // Always persist profile to localStorage so the app works immediately
  localStorage.setItem("reframed_profile", JSON.stringify(profile));
  syncPlayerId(data.user.id);

  if (!data.session) {
    // Email confirmation is required — profile will be synced to DB after confirmation + sign-in
    return { ok: true, needsConfirmation: true, user: { id: data.user.id, email: data.user.email ?? email } };
  }

  // Session is active (email confirmation disabled) — save to DB right away
  await saveProfileToDb(data.user.id, profile);
  return { ok: true, user: { id: data.user.id, email: data.user.email ?? email } };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
  // Keep player_id and profile in localStorage so a guest session starts fresh
  localStorage.removeItem("reframed_player_id");
  localStorage.removeItem("reframed_profile");
}

/** Returns the current authenticated user, or null if not logged in. */
export async function getAuthUser(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}

// ── Game stats ────────────────────────────────────────────────────────────────

const STATS_APPLIED_KEY = "reframed_stats_applied_rooms";

function statsAppliedRooms(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(STATS_APPLIED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

/**
 * Records a game result in the database (total_games, total_wins, best_score).
 * Idempotent per roomId — safe to call on page reload.
 */
export async function saveGameResultToDb(
  roomId: string,
  result: "win" | "loss" | "draw",
  score: number,
): Promise<void> {
  if (typeof window === "undefined" || !supabase) return;

  const rooms = statsAppliedRooms();
  if (rooms.has(roomId)) return;

  await supabase.rpc("record_game_result", {
    p_won:   result === "win",
    p_score: score,
  });

  rooms.add(roomId);
  localStorage.setItem(STATS_APPLIED_KEY, JSON.stringify(Array.from(rooms).slice(-50)));
}

// ── Error messages ────────────────────────────────────────────────────────────

function friendlyError(msg?: string): string {
  if (!msg) return "Une erreur est survenue.";
  if (msg.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (msg.includes("Email not confirmed"))        return "Confirme ton email avant de te connecter.";
  if (msg.includes("User already registered"))    return "Un compte existe déjà avec cet email.";
  if (msg.includes("Password should be"))         return "Le mot de passe doit faire au moins 6 caractères.";
  if (msg.includes("Unable to validate"))         return "Email ou mot de passe invalide.";
  if (msg.includes("rate limit"))                 return "Trop de tentatives — attends quelques minutes et réessaie.";
  if (msg.includes("already registered"))         return "Cet email est déjà utilisé.";
  if (msg.includes("sending confirmation"))       return "Impossible d'envoyer l'email — réessaie dans quelques minutes.";
  return msg;
}
