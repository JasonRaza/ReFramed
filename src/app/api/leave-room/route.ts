import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Room } from "@/lib/game";

/**
 * POST /api/leave-room
 * Body: { roomId: string, playerId: string }
 *
 * Called via navigator.sendBeacon when the user closes the tab or browser.
 * Removes the player from a LOBBY-state room.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    roomId?: string;
    playerId?: string;
  };

  if (!body.roomId || !body.playerId) {
    return NextResponse.json({ error: "roomId et playerId requis." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", body.roomId)
    .single();

  if (!data) return NextResponse.json({ ok: true });
  const room = data as Room;

  // Only clean up lobby — don't touch in-progress games
  if (room.state !== "LOBBY") return NextResponse.json({ ok: true });

  const { playerId, roomId } = body;

  // Host leaving → delete room
  if (room.player1_id === playerId) {
    await supabase.from("rooms").delete().eq("id", roomId);
    return NextResponse.json({ ok: true });
  }

  if (room.mode === "royale") {
    const updated = (room.royale_players ?? []).filter((p) => p.id !== playerId);
    await supabase.from("rooms").update({ royale_players: updated }).eq("id", roomId);
  } else if (room.player2_id === playerId) {
    await supabase.from("rooms").update({
      player2_id: null,
      player2_username: null,
      player2_avatar: null,
    }).eq("id", roomId);
  }

  return NextResponse.json({ ok: true });
}
