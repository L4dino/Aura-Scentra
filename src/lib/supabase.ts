import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ixjelvaoxyjydwdjnwao.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lfnsgQyG8xsqx2Wm1Z7QFA_eHl4dapk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export const WHATSAPP_NUMBER = "877702560";
export const ADMIN_EMAIL = "ladinocossa@gmail.com";
export const BRAND = "AURA SCENTRA";