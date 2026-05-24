-- ── 011_find_by_email.sql ─────────────────────────────────────────────────────
-- Secure RPC: look up a user profile by email address.
-- SECURITY DEFINER lets the function access auth.users without exposing emails
-- in the public user_profiles table.

CREATE OR REPLACE FUNCTION public.find_profile_by_email(search_email TEXT)
RETURNS TABLE(id UUID, username TEXT, avatar TEXT, rank_points INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT up.id, up.username, up.avatar, up.rank_points
    FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email = LOWER(TRIM(search_email));
END;
$$;
