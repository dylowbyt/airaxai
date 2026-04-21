import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── Types ────────────────────────────────────────────
export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular: boolean;
}

export interface GenerationCosts {
  chat: number;
  image: number;
  video: number;
  audio: number;
}

export interface FreeLimits {
  daily_chat: number;
  daily_image: number;
  daily_video: number;
}

export interface UserTokenInfo {
  tokens: number;
  daily_chat_count: number;
  daily_image_count: number;
  daily_video_count: number;
  last_usage_reset: string;
}

// ─── Server-side Supabase helper ──────────────────────
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
}

// ─── Fetch app settings ──────────────────────────────
export async function getAppSetting<T>(key: string): Promise<T | null> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? null;
}

export async function getTokenPackages(): Promise<TokenPackage[]> {
  return (await getAppSetting<TokenPackage[]>("token_packages")) ?? [];
}

export async function getGenerationCosts(): Promise<GenerationCosts> {
  return (
    (await getAppSetting<GenerationCosts>("generation_costs")) ?? {
      chat: 0,
      image: 5,
      video: 20,
      audio: 3,
    }
  );
}

export async function getFreeLimits(): Promise<FreeLimits> {
  return (
    (await getAppSetting<FreeLimits>("free_limits")) ?? {
      daily_chat: 15,
      daily_image: 3,
      daily_video: 1,
    }
  );
}

// ─── User token operations ───────────────────────────
export async function getUserTokenInfo(
  userId: string
): Promise<UserTokenInfo | null> {
  const supabase = await getSupabase();

  // Reset daily counters if needed
  const today = new Date().toISOString().split("T")[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "tokens, daily_chat_count, daily_image_count, daily_video_count, last_usage_reset"
    )
    .eq("id", userId)
    .single();

  if (!profile) return null;

  // Auto-reset daily counters if date changed
  if (profile.last_usage_reset !== today) {
    await supabase
      .from("profiles")
      .update({
        daily_chat_count: 0,
        daily_image_count: 0,
        daily_video_count: 0,
        last_usage_reset: today,
      })
      .eq("id", userId);

    return {
      tokens: profile.tokens,
      daily_chat_count: 0,
      daily_image_count: 0,
      daily_video_count: 0,
      last_usage_reset: today,
    };
  }

  return profile as UserTokenInfo;
}

// ─── Usage check & deduction ─────────────────────────
export type GenerationType = "chat" | "image" | "video" | "audio";

interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  tokensToDeduct?: number;
}

export async function checkAndDeductUsage(
  userId: string,
  type: GenerationType,
  costOverride?: number
): Promise<UsageCheckResult> {
  const supabase = await getSupabase();
  const [tokenInfo, costs, limits] = await Promise.all([
    getUserTokenInfo(userId),
    getGenerationCosts(),
    getFreeLimits(),
  ]);

  if (!tokenInfo) {
    return { allowed: false, reason: "Profil user tidak ditemukan" };
  }

  // Check daily limits for free users
  const dailyLimitMap: Record<string, { count: number; limit: number; field: string }> = {
    chat: {
      count: tokenInfo.daily_chat_count,
      limit: limits.daily_chat,
      field: "daily_chat_count",
    },
    image: {
      count: tokenInfo.daily_image_count,
      limit: limits.daily_image,
      field: "daily_image_count",
    },
    video: {
      count: tokenInfo.daily_video_count,
      limit: limits.daily_video,
      field: "daily_video_count",
    },
  };

  const limitInfo = dailyLimitMap[type];
  if (limitInfo && limitInfo.count >= limitInfo.limit) {
    return {
      allowed: false,
      reason: `Batas harian ${type} tercapai (${limitInfo.limit}/${limitInfo.limit}). Upgrade atau top up token untuk melanjutkan.`,
    };
  }

  // Check token balance for generation types that cost tokens
  const cost = costOverride ?? costs[type] ?? 0;
  if (cost > 0 && tokenInfo.tokens < cost) {
    return {
      allowed: false,
      reason: `Token tidak cukup. Butuh ${cost} token, saldo kamu ${tokenInfo.tokens}. Top up untuk melanjutkan.`,
    };
  }

  // Deduct tokens and increment daily counter
  const updates: Record<string, unknown> = {};
  if (cost > 0) {
    updates.tokens = tokenInfo.tokens - cost;
  }
  if (limitInfo) {
    updates[limitInfo.field] = limitInfo.count + 1;
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from("profiles").update(updates).eq("id", userId);
  }

  return { allowed: true, tokensToDeduct: cost };
}

// ─── Add tokens (for webhook) ────────────────────────
export async function addTokens(
  userId: string,
  amount: number
): Promise<boolean> {
  const supabase = await getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", userId)
    .single();

  if (!profile) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ tokens: profile.tokens + amount })
    .eq("id", userId);

  return !error;
}
