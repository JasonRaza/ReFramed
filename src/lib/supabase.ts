import { createClient } from "@supabase/supabase-js";
import type { Room } from "./game";

type Database = {
  public: {
    Tables: {
      rooms: {
        Row: Room;
        Insert: Partial<Room> & Pick<Room, "code" | "state">;
        Update: Partial<Room>;
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;
