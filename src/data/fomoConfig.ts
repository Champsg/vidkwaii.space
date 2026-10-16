/**
 * ---------------------------------------------------------------------------
 * FOMO / URGENCY SETTINGS  —  edit numbers here only.
 * ---------------------------------------------------------------------------
 * Everything the store shows about urgency, scarcity and live activity is
 * read from this single file. Nothing here is invented at render time: the
 * components simply display what you put below.
 *
 * Before going live, replace the placeholder values with your REAL numbers
 * (stock on hand, orders shipped today, real recent orders). Under India's
 * dark-pattern guidelines, a false countdown or a fake "only 3 left" is
 * treated as misleading advertising, so keep these honest and they will also
 * convert better — real scarcity is more convincing than invented scarcity.
 */

export type CountdownMode = 'daily-reset' | 'fixed' | 'off';

export interface CouponConfig {
  code: string;
  label: string;
  note: string;
  grabbed: number;
  /** Any one of these three defines how the coupon actually discounts the order. */
  percentOff?: number;
  amountOffInr?: number;
  amountOffUsd?: number;
  freeShipping?: boolean;
  minSubtotalInr?: number;
  minSubtotalUsd?: number;
}

export const FOMO_CONFIG = {
  /** Master switch — set false to remove every urgency element at once. */
  enabled: true,

  countdown: {
    /**
     * 'daily-reset' — offer window closes at midnight IST and reopens next day.
     *                 Use this only if the price genuinely is today's price.
     * 'fixed'       — countdown runs to `fixedDeadline` (best for a real sale).
     * 'off'         — hide the countdown strip completely.
     */
    mode: 'daily-reset' as CountdownMode,
    /** ISO date used when mode is 'fixed', e.g. '2026-10-31T23:59:00+05:30'. */
    fixedDeadline: '2026-10-31T23:59:00+05:30',
    label: 'Launch price ends in',
    bonus: 'Free travel pouch + express delivery on 6-packs',
  },

  /** Live stock per bundle. Update these from your inventory. */
  stock: {
    'pack-3': { unitsLeft: 24, totalUnits: 150 },
    'pack-6': { unitsLeft: 11, totalUnits: 150 },
    'pack-9': { unitsLeft: 6, totalUnits: 100 },
  } as Record<string, { unitsLeft: number; totalUnits: number }>,

  /** Units sold in the last 24 hours — show your real order count. */
  soldLast24h: 47,

  /** "People have this in their carts right now" — pull from your live cart data. */
  inCarts: 38,

  /** Viewer range for the "people viewing" pill. */
  liveViewers: { min: 18, max: 34 },

  /** Same-day dispatch promise: orders before this hour (IST) ship today. */
  dispatchCutoffHourIst: 17,

  /**
   * Live "sold" counter. `base` is your real lifetime/today order count and it
   * ticks up as the page is open — only enable the ticking if orders really are
   * coming in, otherwise leave incrementEveryMs at 0 for a static number.
   */
  soldCounter: { base: 1248, incrementEveryMs: 45000, incrementBy: 1 },

  /** Group-buy module (拼团). Members join to unlock the bundle price. */
  groupBuy: {
    enabled: true,
    joined: 5,
    spotsLeft: 2,
    note: 'Join the group and unlock the launch price for everyone',
    cta: 'Join group & save',
  },

  /** Coupon strip (优惠券). Codes are shown so visitors can actually use them. */
  coupons: [
    {
      code: 'GLOW50',
      label: '₹50 off',
      note: 'orders above ₹399',
      grabbed: 12480,
      amountOffInr: 50,
      amountOffUsd: 1.5,
      minSubtotalInr: 299,
      minSubtotalUsd: 9.99,
    },
    {
      code: 'GLOW20',
      label: '₹20 off',
      note: 'site-wide',
      grabbed: 8231,
      amountOffInr: 20,
      amountOffUsd: 0.75,
    },
    { code: 'FREESHIP', label: 'Free shipping', note: 'no minimum', grabbed: 6120, freeShipping: true },
  ] as CouponConfig[],

  /** Scrolling announcement bar (跑马灯). */
  ticker: [
    '🔥 47 people bought in the last hour',
    '🎁 Free cotton pouch with every 6-pack',
    '⚡ Launch price ends at midnight',
    '🚚 Free express delivery on orders over ₹299',
    '💖 12,000+ happy customers across India',
  ],

  /** Spin-to-win wheel (转盘抽奖). Prizes are real coupon codes from the list above. */
  luckyDraw: {
    enabled: true,
    headline: 'Spin to win a coupon',
    subline: 'One spin per visitor · instant code',
    prizes: [
      { label: '₹50 OFF', code: 'GLOW50' },
      { label: '₹20 OFF', code: 'GLOW20' },
      { label: 'Free ship', code: 'FREESHIP' },
      { label: '₹50 OFF', code: 'GLOW50' },
      { label: '₹20 OFF', code: 'GLOW20' },
      { label: 'Try again', code: '' },
    ],
  },

  /**
   * Spend-more-save-more ladder (满减). These tiers are applied automatically at
   * checkout on top of any coupon, which is what actually drives bigger baskets.
   */
  spendTiers: [
    { spendInr: 399, saveInr: 50, spendUsd: 12, saveUsd: 1.5 },
    { spendInr: 599, saveInr: 100, spendUsd: 18, saveUsd: 3 },
    { spendInr: 899, saveInr: 180, spendUsd: 27, saveUsd: 5 },
  ],

  /** Live shopping bar (直播间 / 弹幕) — viewers plus a scrolling comment feed. */
  live: {
    enabled: true,
    viewers: 42,
    messages: [
      'Priya M: just ordered the 6-pack 🔥',
      'Ananya: razor arrived in 2 days, so sharp',
      'Ritika: my foundation finally sits smooth',
      'Meera: grabbed 2 with the ₹50 coupon',
      'Sneha: no bumps at all, unlike threading',
      'Kavya: worth every rupee, ordering again',
    ],
  },

  /** Red-envelope drop (红包雨) — one tap opens a real coupon. */
  redEnvelopes: {
    enabled: true,
    /** How long after load the drop starts. */
    delayMs: 3500,
    /** How long the drop stays on screen if untouched. */
    durationMs: 10000,
    count: 7,
    heading: 'Red envelope drop',
    subheading: 'Tap an envelope to grab a coupon',
  },

  /** Per-customer purchase cap (限购). */
  purchaseLimit: 3,

  /** Hourly flash-sale sessions (整点秒杀场次) — IST hours, 24h clock. */
  flashSessions: {
    enabled: true,
    hours: [10, 14, 20],
    liveLabel: 'On now',
    upcomingLabel: 'Next',
  },

  /**
   * Daily check-in (签到领金币). Coins are per-visitor: they live in the
   * browser and unlock the coupon below once the target is reached.
   */
  checkIn: {
    enabled: true,
    coinName: 'Glow Coins',
    coinsPerDay: [10, 10, 15, 15, 20, 20, 50],
    rewardCoins: 100,
    rewardCoupon: 'GLOW50',
    rewardLabel: '₹50 coupon',
  },

  /** Bestseller ranking (爆款榜). */
  hotRanking: {
    enabled: true,
    title: 'Top sellers this week',
    items: [
      { name: 'Bestseller Duo Set (6-Pack)', sold: 812, tag: 'Most reordered' },
      { name: 'Year-Round Vanity Vault (9-Pack)', sold: 604, tag: 'Best value' },
      { name: 'Starter Glow Set (3-Pack)', sold: 517, tag: 'First-timers pick' },
    ],
  },

  /** Guarantee strip (正品保证 · 假一赔十 style assurances). */
  guarantees: [
    { icon: 'shield', title: '100% authentic', note: 'Fake = 10× refund' },
    { icon: 'refresh', title: '7-day replacement', note: 'Damaged or wrong item' },
    { icon: 'truck', title: 'Free express', note: 'Orders over ₹299' },
    { icon: 'lock', title: 'Secure prepaid', note: 'No cash on delivery' },
  ] as { icon: 'shield' | 'refresh' | 'truck' | 'lock'; title: string; note: string }[],

  /**
   * Recent order pop-ups. Use real, recent orders (first name + city only).
   * `minutesAgo` is how long ago the order happened when the page loads.
   */
  recentOrders: [
    { name: 'Priya', city: 'Mumbai', bundleName: 'Bestseller Duo Set (6-Pack)', minutesAgo: 3 },
    { name: 'Ananya', city: 'Bengaluru', bundleName: 'Starter Glow Set (3-Pack)', minutesAgo: 11 },
    { name: 'Meera', city: 'Delhi', bundleName: 'Bestseller Duo Set (6-Pack)', minutesAgo: 19 },
    { name: 'Sneha', city: 'Pune', bundleName: 'Year-Round Vanity Vault (9-Pack)', minutesAgo: 27 },
    { name: 'Ritika', city: 'Hyderabad', bundleName: 'Bestseller Duo Set (6-Pack)', minutesAgo: 41 },
  ],
};

export type FomoConfig = typeof FOMO_CONFIG;
