import { FOMO_CONFIG, CouponConfig } from '../data/fomoConfig';
import { Review } from '../types';
import { INITIAL_REVIEWS } from '../data/productData';

/**
 * supabase-js is ~60 KB gzipped, so it is loaded on demand instead of riding
 * along in the storefront's first paint. Cached settings still apply instantly.
 */
async function getSupabase() {
  const { supabase } = await import('./supabase');
  return supabase;
}

export interface SiteSettings {
  enabled: boolean;
  liveViewers: { min: number; max: number };
  stock: Record<string, { unitsLeft: number; totalUnits: number }>;
  soldLast24h: number;
  inCarts: number;
  coupons: CouponConfig[];
  ticker: string[];
  countdown: {
    mode: 'daily-reset' | 'fixed' | 'off';
    fixedDeadline: string;
    label: string;
    bonus: string;
  };
  live: {
    enabled: boolean;
    viewers: number;
    messages: string[];
  };
  groupBuy: {
    enabled: boolean;
    joined: number;
    spotsLeft: number;
    note: string;
    cta: string;
  };
  purchaseLimit: number;
  reviews: Review[];
}

const STORAGE_KEY = 'vidkwaii_site_settings';
const SETTINGS_EVENT = 'vidkwaii_settings_updated';
const MAX_LIST_ITEMS = 20;
const MAX_TEXT_LENGTH = 160;

function asNumber(value: unknown, fallback: number, min = 0, max = 1_000_000): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function asText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_TEXT_LENGTH) : fallback;
}

function asTextList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, MAX_TEXT_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
  return cleaned.length ? cleaned : fallback;
}

let inMemoryReviews: Review[] = [...INITIAL_REVIEWS];

/**
 * Never trust settings coming back from the database, localStorage or the admin
 * form: merge them onto safe defaults and drop anything of the wrong shape so a
 * bad row can never crash the storefront.
 */
export function sanitizeSettings(raw: unknown): SiteSettings {
  const fallback = {
    enabled: FOMO_CONFIG.enabled,
    liveViewers: { ...FOMO_CONFIG.liveViewers },
    stock: JSON.parse(JSON.stringify(FOMO_CONFIG.stock)) as SiteSettings['stock'],
    soldLast24h: FOMO_CONFIG.soldLast24h,
    inCarts: FOMO_CONFIG.inCarts,
    coupons: JSON.parse(JSON.stringify(FOMO_CONFIG.coupons)) as CouponConfig[],
    ticker: [...FOMO_CONFIG.ticker],
    countdown: { ...FOMO_CONFIG.countdown },
    live: {
      enabled: FOMO_CONFIG.live.enabled,
      viewers: FOMO_CONFIG.live.viewers,
      messages: [...FOMO_CONFIG.live.messages],
    },
    groupBuy: { ...FOMO_CONFIG.groupBuy },
    purchaseLimit: FOMO_CONFIG.purchaseLimit,
    reviews: [...INITIAL_REVIEWS],
  };

  if (!raw || typeof raw !== 'object') return fallback;
  const input = raw as Partial<SiteSettings>;

  const stock: SiteSettings['stock'] = { ...fallback.stock };
  if (input.stock && typeof input.stock === 'object') {
    Object.entries(input.stock).forEach(([key, value]) => {
      const entry = value as { unitsLeft?: unknown; totalUnits?: unknown };
      const totalUnits = asNumber(entry?.totalUnits, 100, 1);
      stock[key] = {
        totalUnits,
        unitsLeft: asNumber(entry?.unitsLeft, totalUnits, 0, totalUnits),
      };
    });
  }

  const coupons: CouponConfig[] = [];
  if (Array.isArray(input.coupons)) {
    input.coupons.forEach((rawCoupon) => {
      const coupon = rawCoupon as Partial<CouponConfig>;
      const code = typeof coupon?.code === 'string' ? coupon.code.trim().toUpperCase().slice(0, 24) : '';
      if (!code) return;
      coupons.push({
        code,
        label: asText(coupon.label, code),
        note: asText(coupon.note, ''),
        grabbed: asNumber(coupon.grabbed, 0),
        ...(coupon.percentOff !== undefined
          ? { percentOff: asNumber(coupon.percentOff, 0, 0, 90) }
          : {}),
        ...(coupon.amountOffInr !== undefined
          ? { amountOffInr: asNumber(coupon.amountOffInr, 0) }
          : {}),
        ...(coupon.amountOffUsd !== undefined
          ? { amountOffUsd: asNumber(coupon.amountOffUsd, 0) }
          : {}),
        ...(coupon.freeShipping ? { freeShipping: true } : {}),
        ...(coupon.minSubtotalInr !== undefined
          ? { minSubtotalInr: asNumber(coupon.minSubtotalInr, 0) }
          : {}),
        ...(coupon.minSubtotalUsd !== undefined
          ? { minSubtotalUsd: asNumber(coupon.minSubtotalUsd, 0) }
          : {}),
      });
    });
  }

  const countdownMode = input.countdown?.mode;
  const mode: SiteSettings['countdown']['mode'] =
    countdownMode === 'fixed' || countdownMode === 'off' || countdownMode === 'daily-reset'
      ? countdownMode
      : fallback.countdown.mode;

  const viewerMin = asNumber(input.liveViewers?.min, fallback.liveViewers.min, 1);
  const viewerMax = Math.max(viewerMin, asNumber(input.liveViewers?.max, fallback.liveViewers.max, 1));

  const reviewsList = Array.isArray(input.reviews) && input.reviews.length > 0
    ? input.reviews.map((r: any, idx: number) => ({
        id: typeof r.id === 'string' && r.id ? r.id : `rev-${Date.now()}-${idx}`,
        author: asText(r.author, 'Verified Customer'),
        avatarInitials: asText(r.avatarInitials, (r.author || 'VC').slice(0, 2).toUpperCase()),
        rating: asNumber(r.rating, 5, 1, 5),
        date: asText(r.date, 'Recently'),
        skinType: asText(r.skinType, 'Verified Purchase'),
        title: asText(r.title, 'Loved the result'),
        content: typeof r.content === 'string' ? r.content.trim() : '',
        verified: typeof r.verified === 'boolean' ? r.verified : true,
        helpfulCount: asNumber(r.helpfulCount, 0),
        purchasedPack: asText(r.purchasedPack, 'Bestseller Duo Set (6-Pack)'),
        imageUrl: typeof r.imageUrl === 'string' && r.imageUrl.trim() ? r.imageUrl.trim() : undefined,
        videoUrl: typeof r.videoUrl === 'string' && r.videoUrl.trim() ? r.videoUrl.trim() : undefined,
        postUrl: typeof r.postUrl === 'string' && r.postUrl.trim() ? r.postUrl.trim() : undefined,
      }))
    : [...INITIAL_REVIEWS];

  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : fallback.enabled,
    liveViewers: { min: viewerMin, max: viewerMax },
    stock,
    soldLast24h: asNumber(input.soldLast24h, fallback.soldLast24h),
    inCarts: asNumber(input.inCarts, fallback.inCarts),
    coupons: coupons.length ? coupons : fallback.coupons,
    ticker: asTextList(input.ticker, fallback.ticker),
    countdown: {
      mode,
      fixedDeadline: asText(input.countdown?.fixedDeadline, fallback.countdown.fixedDeadline),
      label: asText(input.countdown?.label, fallback.countdown.label),
      bonus: asText(input.countdown?.bonus, fallback.countdown.bonus),
    },
    live: {
      enabled: typeof input.live?.enabled === 'boolean' ? input.live.enabled : fallback.live.enabled,
      viewers: asNumber(input.live?.viewers, fallback.live.viewers, 1),
      messages: asTextList(input.live?.messages, fallback.live.messages),
    },
    groupBuy: {
      enabled:
        typeof input.groupBuy?.enabled === 'boolean' ? input.groupBuy.enabled : fallback.groupBuy.enabled,
      joined: asNumber(input.groupBuy?.joined, fallback.groupBuy.joined, 0, 999),
      spotsLeft: asNumber(input.groupBuy?.spotsLeft, fallback.groupBuy.spotsLeft, 0, 999),
      note: asText(input.groupBuy?.note, fallback.groupBuy.note),
      cta: asText(input.groupBuy?.cta, fallback.groupBuy.cta),
    },
    purchaseLimit: asNumber(input.purchaseLimit, fallback.purchaseLimit, 1, 99),
    reviews: reviewsList,
  };
}

/**
 * Returns current snapshot of settings.
 */
export function getSiteSettings(): SiteSettings {
  return {
    enabled: FOMO_CONFIG.enabled,
    liveViewers: { ...FOMO_CONFIG.liveViewers },
    stock: JSON.parse(JSON.stringify(FOMO_CONFIG.stock)),
    soldLast24h: FOMO_CONFIG.soldLast24h,
    inCarts: FOMO_CONFIG.inCarts,
    coupons: JSON.parse(JSON.stringify(FOMO_CONFIG.coupons)),
    ticker: [...FOMO_CONFIG.ticker],
    countdown: { ...FOMO_CONFIG.countdown },
    live: {
      enabled: FOMO_CONFIG.live.enabled,
      viewers: FOMO_CONFIG.live.viewers,
      messages: [...FOMO_CONFIG.live.messages],
    },
    groupBuy: { ...FOMO_CONFIG.groupBuy },
    purchaseLimit: FOMO_CONFIG.purchaseLimit,
    reviews: [...inMemoryReviews],
  };
}

/**
 * Apply settings into in-memory FOMO_CONFIG and dispatch update event.
 */
export function applySettings(settings: Partial<SiteSettings>) {
  const safe = sanitizeSettings({ ...getSiteSettings(), ...settings });

  FOMO_CONFIG.enabled = safe.enabled;
  FOMO_CONFIG.liveViewers = safe.liveViewers;
  FOMO_CONFIG.stock = safe.stock;
  FOMO_CONFIG.soldLast24h = safe.soldLast24h;
  FOMO_CONFIG.inCarts = safe.inCarts;
  FOMO_CONFIG.coupons = safe.coupons;
  FOMO_CONFIG.ticker = safe.ticker;
  FOMO_CONFIG.countdown = safe.countdown;
  FOMO_CONFIG.live = safe.live;
  FOMO_CONFIG.groupBuy = safe.groupBuy;
  FOMO_CONFIG.purchaseLimit = safe.purchaseLimit;
  if (safe.reviews) inMemoryReviews = [...safe.reviews];

  // Persist locally for immediate caching
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getSiteSettings()));
  } catch (e) {
    console.warn('Could not persist settings to localStorage', e);
  }

  // Notify listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
  }
}

/**
 * Initialize settings: checks localStorage cache first, then Supabase.
 */
export async function initSiteSettings(onUpdate?: (settings: SiteSettings) => void): Promise<SiteSettings> {
  // 1. Try local cache
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      applySettings(parsed);
      if (onUpdate) onUpdate(getSiteSettings());
    }
  } catch (err) {
    console.warn('Failed reading cached site settings:', err);
  }

  // 2. Fetch from Supabase
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('id', 'fomo_config')
      .maybeSingle();

    if (!error && data && data.value) {
      applySettings(data.value);
      if (onUpdate) onUpdate(getSiteSettings());
    }
  } catch (err) {
    console.warn('Could not fetch site settings from Supabase:', err);
  }

  return getSiteSettings();
}

/**
 * Save settings both locally and to Supabase database.
 */
export async function saveSiteSettings(newSettings: SiteSettings): Promise<{ success: boolean; error?: string }> {
  const safe = sanitizeSettings(newSettings);
  // Apply locally first so admin and storefront see changes immediately
  applySettings(safe);

  try {
    const supabase = await getSupabase();

    // Try update first (matching existing row fomo_config and bypassing upsert-only RLS restrictions)
    const { data: updated, error: updateError } = await supabase
      .from('site_settings')
      .update({
        value: safe,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'fomo_config')
      .select();

    if (updateError || !updated || updated.length === 0) {
      // Row may not exist yet, try upsert
      const { error: upsertError } = await supabase.from('site_settings').upsert({
        id: 'fomo_config',
        value: safe,
        updated_at: new Date().toISOString(),
      });
      if (upsertError) {
        console.error('Supabase error saving settings:', upsertError);
        return { success: false, error: upsertError.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving site settings:', err);
    return { success: false, error: err?.message || 'Database error' };
  }
}
