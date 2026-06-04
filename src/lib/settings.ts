import { supabase } from "./supabase";

export const NHOGUISTA_SEM_STOCK_SETTING = "nhoguista_sem_stock_open";

export type BooleanSettingResult = {
  value: boolean;
  missingTable: boolean;
  error?: string;
};

export async function getBooleanSetting(key: string, fallback = true): Promise<BooleanSettingResult> {
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (error) {
    const missingTable = error.code === "42P01" || /app_settings|relation/i.test(error.message);
    return { value: fallback, missingTable, error: error.message };
  }
  return { value: typeof data?.value === "boolean" ? data.value : fallback, missingTable: false };
}

export async function setBooleanSetting(key: string, value: boolean): Promise<{ error?: string }> {
  const { error } = await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
  return error ? { error: error.message } : {};
}