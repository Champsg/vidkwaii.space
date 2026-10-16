import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import {
  getSiteSettings,
  sanitizeSettings,
  saveSiteSettings,
  SiteSettings,
} from './lib/siteSettings';
import { CouponConfig } from './data/fomoConfig';
import { TRACK_ORDER_SQL } from './lib/trackingSql';
import { STAGE_MESSAGES } from './data/customerMessages';
import { buildWhatsAppLink, fillTemplate, templateValues } from './lib/whatsapp';
import { AdminSecurityCheck } from './components/AdminSecurityCheck';
import {
  AdminSessionInfo,
  getAdminSession,
  isSupabaseConfigured,
  onAdminAuthChange,
  signInAdmin,
  signOutAdmin,
} from './lib/auth';
import {
  Package,
  Users,
  Ticket,
  Megaphone,
  Database,
  RefreshCw,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Eye,
  Clock,
  Sparkles,
  Info,
  Star,
  Video,
  Image,
  Edit2,
  Link2,
  MessageSquare,
  MessageCircle,
  BarChart3,
} from 'lucide-react';
import { Review } from './types';
import { AdminAnalytics } from './components/AdminAnalytics';

function AdminDashboard({ adminEmail }: { adminEmail: string | null }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'viewers' | 'stock' | 'coupons' | 'banners' | 'reviews' | 'setup'>('orders');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Site Settings State
  const [settings, setSettings] = useState<SiteSettings>(getSiteSettings());
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState<boolean | null>(null);

  // New Coupon Form State
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    label: string;
    note: string;
    discountType: 'fixed' | 'percent';
    amountOffInr: number;
    percentOff: number;
    minSubtotalInr: number;
  }>({
    code: '',
    label: '',
    note: '',
    discountType: 'fixed',
    amountOffInr: 50,
    percentOff: 10,
    minSubtotalInr: 0,
  });

  // New Ticker Message State
  const [newTickerText, setNewTickerText] = useState('');

  // Review Management State
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewFilterRating, setReviewFilterRating] = useState<number | 'ALL'>('ALL');
  const [reviewForm, setReviewForm] = useState<{
    author: string;
    rating: number;
    date: string;
    mediaType: 'image' | 'video' | 'none';
    mediaUrl: string;
    postUrl: string;
    title: string;
    content: string;
    skinType: string;
    purchasedPack: string;
    verified: boolean;
  }>({
    author: '',
    rating: 5,
    date: 'Just now',
    mediaType: 'none',
    mediaUrl: '',
    postUrl: '',
    title: '',
    content: '',
    skinType: 'Sensitive Skin',
    purchasedPack: 'Bestseller Duo Set (6-Pack)',
    verified: true,
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { supabase } = await import('./lib/supabase');
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error } = await supabase.storage.from('uploads').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
      setReviewForm((prev) => ({ ...prev, mediaUrl: publicUrlData.publicUrl }));
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders();
    fetchRemoteSettings();
  }, []);

  const fetchRemoteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'fomo_config')
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find')) {
          setTableExists(false);
        }
      } else {
        setTableExists(true);
        if (data && data.value) {
          setSettings(sanitizeSettings(data.value));
        }
      }
    } catch {
      setTableExists(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setOrdersError(err.message || 'Failed to fetch orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  /** Builds the buyer-facing WhatsApp update for an order's current stage. */
  const customerMessageFor = (order: any) => {
    const status = String(order?.status ?? 'Confirmed').toLowerCase();
    const template = STAGE_MESSAGES.find((m) => m.key.toLowerCase() === status) ?? STAGE_MESSAGES[0];
    const total =
      order?.total_amount === null || order?.total_amount === undefined
        ? ''
        : `${order?.currency === 'USD' ? '$' : '₹'}${Math.round(Number(order.total_amount))}`;
    return fillTemplate(
      template.template,
      templateValues({
        name: order?.customer_name,
        orderId: order?.order_id,
        tracking: order?.tracking_number,
        total,
        storeName: 'Vidkwaii',
      })
    );
  };

  const copyCustomerMessage = async (order: any) => {
    try {
      await navigator.clipboard.writeText(customerMessageFor(order));
      alert('Update copied — paste it into WhatsApp, SMS or email.');
    } catch {
      alert('Could not access the clipboard. Use the WhatsApp button instead.');
    }
  };

  const handleUpdateOrderStatus = async (order: any, newBaseStatus: string) => {
    try {
      const isPaid = order.status?.includes('Paid') || order.payment_status === 'paid';
      const finalStatus = isPaid && !newBaseStatus.includes('Paid') ? `${newBaseStatus} · Paid` : newBaseStatus;

      const { error } = await supabase
        .from('orders')
        .update({ status: finalStatus })
        .eq('order_id', order.order_id);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((ord) => (ord.order_id === order.order_id ? { ...ord, status: finalStatus } : ord))
      );
    } catch (err: any) {
      alert(`Could not update order status: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('order_id', orderId);

      if (error) throw error;

      setOrders((prev) => prev.filter((ord) => ord.order_id !== orderId));
    } catch (err: any) {
      alert(`Could not delete order: ${err.message}`);
    }
  };

  /** Manual reconciliation — used until the Razorpay keys are live. */
  const handleMarkPaid = async (order: any) => {
    try {
      // Try updating payment_status
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('order_id', order.order_id);

      if (error && (error.code === 'PGRST204' || error.message?.includes('payment_status'))) {
        // Column payment_status not yet in table, update status to indicate paid
        const currentStatus = order.status || 'Confirmed';
        const updatedStatus = currentStatus.includes('Paid') ? currentStatus : `${currentStatus} · Paid`;
        await supabase
          .from('orders')
          .update({ status: updatedStatus })
          .eq('order_id', order.order_id);
      } else if (error) {
        throw error;
      }

      setOrders((prev) =>
        prev.map((o) => (o.order_id === order.order_id ? { ...o, payment_status: 'paid', status: o.status?.includes('Paid') ? o.status : `${o.status || 'Confirmed'} · Paid` } : o))
      );
    } catch (err: any) {
      alert(`Could not mark as paid: ${err.message}`);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSaveSuccess(false);
    setSaveError(null);

    const res = await saveSiteSettings(settings);
    setSavingSettings(false);

    if (res.success) {
      setSaveSuccess(true);
      setTableExists(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(res.error || 'Failed to sync to Supabase table');
      // If table doesn't exist, prompt user
      if (res.error?.includes('site_settings')) {
        setTableExists(false);
      }
    }
  };

  // Coupon Handlers
  const handleAddCoupon = () => {
    if (!newCoupon.code.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    const code = newCoupon.code.trim().toUpperCase();
    const created: CouponConfig = {
      code,
      label: newCoupon.label || (newCoupon.discountType === 'percent' ? `${newCoupon.percentOff}% off` : `₹${newCoupon.amountOffInr} off`),
      note: newCoupon.note || (newCoupon.minSubtotalInr > 0 ? `orders above ₹${newCoupon.minSubtotalInr}` : 'site-wide'),
      grabbed: 100,
      ...(newCoupon.discountType === 'percent'
        ? { percentOff: Number(newCoupon.percentOff) }
        : { amountOffInr: Number(newCoupon.amountOffInr), amountOffUsd: Number((newCoupon.amountOffInr / 80).toFixed(2)) }),
      minSubtotalInr: Number(newCoupon.minSubtotalInr) || 0,
      minSubtotalUsd: Number(((newCoupon.minSubtotalInr || 0) / 80).toFixed(2)),
    };

    setSettings((prev) => ({
      ...prev,
      coupons: [...prev.coupons.filter((c) => c.code.toUpperCase() !== code), created],
    }));

    setNewCoupon({
      code: '',
      label: '',
      note: '',
      discountType: 'fixed',
      amountOffInr: 50,
      percentOff: 10,
      minSubtotalInr: 0,
    });
  };

  const handleRemoveCoupon = (code: string) => {
    setSettings((prev) => ({
      ...prev,
      coupons: prev.coupons.filter((c) => c.code !== code),
    }));
  };

  // Ticker Handlers
  const handleAddTicker = () => {
    if (!newTickerText.trim()) return;
    setSettings((prev) => ({
      ...prev,
      ticker: [...prev.ticker, newTickerText.trim()],
    }));
    setNewTickerText('');
  };

  const handleRemoveTicker = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      ticker: prev.ticker.filter((_, i) => i !== index),
    }));
  };

  // Review Handlers
  const handleSaveReview = () => {
    if (!reviewForm.author.trim() || !reviewForm.content.trim()) {
      alert('Please fill in both the reviewer name and the review content.');
      return;
    }

    const initials = reviewForm.author.trim().slice(0, 2).toUpperCase();
    const isVideo = reviewForm.mediaType === 'video';
    const isImage = reviewForm.mediaType === 'image';

    const reviewData: Review = {
      id: editingReviewId || `rev-${Date.now()}`,
      author: reviewForm.author.trim(),
      avatarInitials: initials,
      rating: Number(reviewForm.rating) || 5,
      date: reviewForm.date.trim() || 'Recently',
      skinType: reviewForm.skinType.trim() || 'Verified Purchase',
      title: reviewForm.title.trim() || 'Loved the results',
      content: reviewForm.content.trim(),
      verified: reviewForm.verified,
      helpfulCount: editingReviewId
        ? (settings.reviews?.find((r) => r.id === editingReviewId)?.helpfulCount || 0)
        : Math.floor(10 + Math.random() * 25),
      purchasedPack: reviewForm.purchasedPack,
      imageUrl: isImage && reviewForm.mediaUrl.trim() ? reviewForm.mediaUrl.trim() : undefined,
      videoUrl: isVideo && reviewForm.mediaUrl.trim() ? reviewForm.mediaUrl.trim() : undefined,
      postUrl: reviewForm.postUrl.trim() ? reviewForm.postUrl.trim() : undefined,
    };

    if (editingReviewId) {
      setSettings((prev) => ({
        ...prev,
        reviews: (prev.reviews || []).map((r) => (r.id === editingReviewId ? reviewData : r)),
      }));
      setEditingReviewId(null);
    } else {
      setSettings((prev) => ({
        ...prev,
        reviews: [reviewData, ...(prev.reviews || [])],
      }));
    }

    // Reset form
    setReviewForm({
      author: '',
      rating: 5,
      date: 'Just now',
      mediaType: 'none',
      mediaUrl: '',
      postUrl: '',
      title: '',
      content: '',
      skinType: 'Sensitive Skin',
      purchasedPack: 'Bestseller Duo Set (6-Pack)',
      verified: true,
    });
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setReviewForm({
      author: review.author,
      rating: review.rating,
      date: review.date,
      mediaType: review.videoUrl ? 'video' : review.imageUrl ? 'image' : 'none',
      mediaUrl: review.videoUrl || review.imageUrl || '',
      postUrl: review.postUrl || '',
      title: review.title,
      content: review.content,
      skinType: review.skinType,
      purchasedPack: review.purchasedPack,
      verified: review.verified,
    });
    const el = document.getElementById('review-editor-card');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteReview = (id: string) => {
    if (window.confirm('Delete this customer review?')) {
      setSettings((prev) => ({
        ...prev,
        reviews: (prev.reviews || []).filter((r) => r.id !== id),
      }));
      if (editingReviewId === id) {
        setEditingReviewId(null);
      }
    }
  };

  const handleCancelReviewEdit = () => {
    setEditingReviewId(null);
    setReviewForm({
      author: '',
      rating: 5,
      date: 'Just now',
      mediaType: 'none',
      mediaUrl: '',
      postUrl: '',
      title: '',
      content: '',
      skinType: 'Sensitive Skin',
      purchasedPack: 'Bestseller Duo Set (6-Pack)',
      verified: true,
    });
  };

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesQuery =
      !searchQuery ||
      order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || (order.status?.replace(' · Paid', '') || 'Confirmed').toUpperCase() === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const sqlSetupScript = [
    '-- Vidkwaii security + sync setup. Run once in Supabase → SQL Editor.',
    '-- Step 1: create your admin login in Authentication → Users first,',
    '-- and turn OFF "Allow new users to sign up" so nobody can self-register.',
    '',
    '-- 1) Admin allow-list -------------------------------------------------------',
    'create table if not exists public.admins (',
    '  email text primary key,',
    '  created_at timestamptz default now()',
    ');',
    'alter table public.admins enable row level security;',
    '',
    'drop policy if exists "admins read own" on public.admins;',
    'create policy "admins read own" on public.admins',
    "  for select using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));",
    '',
    '-- Replace with the email you created in Authentication → Users.',
    "insert into public.admins (email) values ('support@vidkwaii.space')",
    '  on conflict (email) do nothing;',
    '',
    'create or replace function public.is_admin() returns boolean',
    'language sql stable security definer set search_path = public as $$',
    '  select exists (',
    '    select 1 from public.admins a',
    "    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))",
    '  );',
    '$$;',
    '',
    '-- 2) Storefront settings ----------------------------------------------------',
    'create table if not exists public.site_settings (',
    '  id text primary key,',
    '  value jsonb not null,',
    '  updated_at timestamptz default now() not null',
    ');',
    'alter table public.site_settings enable row level security;',
    '',
    '-- Drop EVERY policy on site_settings, whatever it is called — otherwise a',
    '-- leftover "allow all" policy keeps the store writable by anyone.',
    'do $$',
    'declare pol record;',
    'begin',
    "  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'site_settings' loop",
    "    execute format('drop policy %I on public.site_settings', pol.policyname);",
    '  end loop;',
    'end $$;',
    '',
    'create policy "settings public read" on public.site_settings',
    '  for select using (true);',
    '',
    'create policy "settings admin write" on public.site_settings',
    '  for all using (public.is_admin()) with check (public.is_admin());',
    '',
    '-- 3) Orders -----------------------------------------------------------------',
    'create table if not exists public.orders (',
    '  id bigint generated by default as identity primary key,',
    '  created_at timestamptz default now() not null,',
    '  order_id text unique not null,',
    '  customer_name text,',
    '  phone text,',
    '  address text,',
    '  pincode text,',
    '  city text,',
    '  bundle_name text,',
    '  pack_count int default 1,',
    '  quantity int default 1,',
    '  currency text default ' + "'INR'" + ',',
    '  subtotal numeric default 0,',
    '  discount numeric default 0,',
    '  shipping numeric default 0,',
    '  total_amount numeric default 0,',
    '  payment_method text,',
    "  payment_status text default 'pending',",
    '  payment_reference text,',
    '  tracking_number text,',
    "  status text default 'Confirmed'",
    ');',
    '',
    '-- If your orders table already existed, make sure every column the app uses is present:',
    'alter table public.orders add column if not exists customer_name text;',
    'alter table public.orders add column if not exists phone text;',
    'alter table public.orders add column if not exists address text;',
    'alter table public.orders add column if not exists pincode text;',
    'alter table public.orders add column if not exists city text;',
    'alter table public.orders add column if not exists bundle_name text;',
    'alter table public.orders add column if not exists pack_count int default 1;',
    'alter table public.orders add column if not exists quantity int default 1;',
    "alter table public.orders add column if not exists currency text default 'INR';",
    'alter table public.orders add column if not exists subtotal numeric default 0;',
    'alter table public.orders add column if not exists discount numeric default 0;',
    'alter table public.orders add column if not exists shipping numeric default 0;',
    'alter table public.orders add column if not exists total_amount numeric default 0;',
    'alter table public.orders add column if not exists payment_method text;',
    "alter table public.orders add column if not exists payment_status text default 'pending';",
    'alter table public.orders add column if not exists payment_reference text;',
    'alter table public.orders add column if not exists tracking_number text;',
    "alter table public.orders add column if not exists status text default 'Confirmed';",
    '',
    'alter table public.orders enable row level security;',
    '',
    '-- Drop EVERY existing policy on orders, whatever it is called. Anything that',
    '-- lets anonymous visitors read this table leaks names, phones and addresses.',
    'do $$',
    'declare pol record;',
    'begin',
    "  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'orders' loop",
    "    execute format('drop policy %I on public.orders', pol.policyname);",
    '  end loop;',
    'end $$;',
    '',
    '-- customers may place an order...',
    'create policy "orders public insert" on public.orders',
    '  for insert with check (true);',
    '',
    '-- ...but only a signed-in admin can ever read one back',
    'create policy "orders admin read" on public.orders',
    '  for select using (public.is_admin());',
    '',
    'create policy "orders admin update" on public.orders',
    '  for update using (public.is_admin()) with check (public.is_admin());',
    '',
    'create policy "orders admin delete" on public.orders',
    '  for delete using (public.is_admin());',
    '',
    '-- 4) Customer order tracking (limited fields only) ---------------------------',
    TRACK_ORDER_SQL,
    '',
    '-- 5) Analytics Events (funnel & traffic tracking) --------------------------',
    'create table if not exists public.analytics_events (',
    '  id bigint generated by default as identity primary key,',
    '  event text not null,',
    '  session_id text,',
    '  properties jsonb,',
    '  url text,',
    '  referrer text,',
    '  utm_source text,',
    '  utm_medium text,',
    '  utm_campaign text,',
    '  created_at timestamptz default now()',
    ');',
    'alter table public.analytics_events enable row level security;',
    'drop policy if exists "analytics public insert" on public.analytics_events;',
    'create policy "analytics public insert" on public.analytics_events',
    '  for insert with check (true);',
    'drop policy if exists "analytics admin read" on public.analytics_events;',
    'create policy "analytics admin read" on public.analytics_events',
    '  for select using (public.is_admin());',
  ].join('\n');

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#9B2C13] to-[#FF6B4A] flex items-center justify-center text-white font-black text-lg shadow-sm">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-stone-900">Vidkwaii Control Center</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Admin
                </span>
              </div>
              <p className="text-xs text-stone-500">Live inventory, urgency metrics, coupons & promo manager</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Storefront Preview
            </a>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#9B2C13] hover:bg-[#80240F] text-white'
              }`}
            >
              {savingSettings ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {savingSettings ? 'Saving...' : saveSuccess ? 'Saved Live!' : 'Save All Settings'}
            </button>

            {adminEmail && (
              <div className="flex items-center gap-2 pl-2 ml-1 border-l border-stone-200">
                <span className="hidden sm:flex flex-col leading-tight text-right">
                  <span className="text-[10px] font-bold text-stone-800">{adminEmail}</span>
                  <span className="text-[9px] text-emerald-600 font-semibold">Signed in</span>
                </span>
                <button
                  onClick={() => void signOutAdmin()}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {/* Alerts / Sync status */}
        {tableExists === false && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">Database Table Needed for Full Sync: </span>
              Your settings are currently cached in your browser storage. To persist changes permanently across all visitor devices, click the{' '}
              <button
                onClick={() => setActiveTab('setup')}
                className="underline font-bold text-amber-950 hover:text-black"
              >
                Database Setup
              </button>{' '}
              tab and run the 1-click SQL script in Supabase!
            </div>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">Sync Notice: </span> {saveError} (Settings saved to local cache)
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-stone-200 pb-px mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-[#9B2C13] text-[#9B2C13] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Package className="w-4 h-4" />
            Orders & Shipments ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-[#9B2C13] text-[#9B2C13] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Funnel & Analytics
          </button>

          <button
            onClick={() => setActiveTab('viewers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'viewers'
                ? 'border-[#9B2C13] text-[#9B2C13] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Live Viewers & Urgency
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'stock'
                ? 'border-[#9B2C13] text-[#9B2C13] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Stock & Inventory
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'border-[#9B2C13] text-[#9B2C13] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Active Coupons ({settings.coupons.length})
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'banners'
                ? 'border-[#9B2C13] text-[#9B2C13] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Promo Banners & Ticker
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-[#9B2C13] text-[#9B2C13] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Star className="w-4 h-4" />
            Customer Reviews ({settings.reviews?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'setup'
                ? 'border-[#9B2C13] text-[#9B2C13] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Database className="w-4 h-4" />
            Database Setup
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB: ANALYTICS & FUNNEL */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && <AdminAnalytics />}

        {/* ========================================================================= */}
        {/* TAB 1: ORDERS */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Load failure — without this the table just looks empty */}
            {ordersError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Could not load orders</p>
                  <p className="text-rose-800">{ordersError}</p>
                  <p className="text-rose-800">
                    Most likely the <code>orders</code> table or its read policy is missing — open{' '}
                    <button
                      onClick={() => setActiveTab('setup')}
                      className="underline font-bold text-rose-950"
                    >
                      Database Setup
                    </button>{' '}
                    and run the SQL script, then hit Refresh.
                  </p>
                </div>
              </div>
            )}

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-stone-500">Total Confirmed Orders</p>
                  <p className="text-2xl font-black text-stone-900 mt-1">{orders.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#9B2C13] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-stone-500">Total Gross Revenue</p>
                  <p className="text-2xl font-black text-stone-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-stone-500">Average Order Value</p>
                  <p className="text-2xl font-black text-stone-900 mt-1">
                    ₹{orders.length ? Math.round(totalRevenue / orders.length) : 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, phone, order ID, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-[#9B2C13]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PACKED">Packed</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="OUT FOR DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <button
                  onClick={fetchOrders}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors border border-stone-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Order ID & Date</th>
                      <th className="px-4 py-3.5">Customer & Phone</th>
                      <th className="px-4 py-3.5">Shipping Address</th>
                      <th className="px-4 py-3.5">Bundle Ordered</th>
                      <th className="px-4 py-3.5">Total & Payment</th>
                      <th className="px-4 py-3.5">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-stone-500">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                          Loading orders from database...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-stone-500">
                          No matching orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id || order.order_id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="px-4 py-3.5 align-top">
                            <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                              {order.order_id}
                            </span>
                            <div className="text-[10px] text-stone-500 mt-1">
                              {new Date(order.created_at).toLocaleString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            {order.tracking_number && (
                              <div className="text-[9px] font-mono text-stone-400 mt-0.5">
                                Trk: {order.tracking_number}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 align-top">
                            <div className="font-bold text-stone-900">{order.customer_name}</div>
                            <div className="font-mono text-[11px] text-[#9B2C13] mt-0.5 font-medium">
                              📞 {order.phone}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 align-top max-w-xs">
                            <div className="text-stone-700 leading-snug line-clamp-2">
                              {order.address}
                            </div>
                            {order.city && (
                              <div className="text-[10px] text-stone-500 mt-0.5">
                                {order.city} {order.pincode ? `(${order.pincode})` : ''}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 align-top">
                            <div className="font-semibold text-stone-800">
                              {order.bundle_name}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              Qty: <span className="font-bold text-stone-900">{order.quantity}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 align-top">
                            <div className="font-extrabold text-stone-900 text-sm">
                              ₹{order.total_amount || order.total}
                            </div>
                            <div className="text-[10px] uppercase font-semibold text-stone-500 mt-0.5">
                              Online prepaid
                            </div>
                            <span
                              className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                order.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {order.payment_status === 'paid' ? 'Paid' : 'Payment pending'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 align-top">
                            <div className="flex flex-col gap-2">
                              <select
                                value={order.status?.replace(' · Paid', '') || 'Confirmed'}
                                onChange={(e) => handleUpdateOrderStatus(order, e.target.value)}
                                className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border transition-colors max-w-max ${
                                  order.status?.includes('Delivered')
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : order.status?.includes('Shipped')
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : order.status?.includes('Cancelled')
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <option value="Confirmed">Confirmed</option>
                                <option value="Packed">Packed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>

                              <div className="flex flex-wrap items-center gap-1">
                                <a
                                  href={buildWhatsAppLink(order.phone, customerMessageFor(order))}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Send this stage's update on WhatsApp"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyCustomerMessage(order)}
                                  title="Copy the update text"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold border border-stone-200 transition-colors"
                                >
                                  Copy
                                </button>
                                {order.payment_status !== 'paid' && !order.status?.includes('Paid') && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkPaid(order)}
                                    title="Confirm this payment was received"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-stone-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition-colors"
                                  >
                                    Mark paid
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrder(order.order_id)}
                                  title="Delete this order"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold border border-rose-200 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE VIEWERS & URGENCY */}
        {/* ========================================================================= */}
        {activeTab === 'viewers' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between pb-5 border-b border-stone-100">
                <div>
                  <h2 className="text-base font-bold text-stone-900">Urgency & Live Traffic Settings</h2>
                  <p className="text-xs text-stone-500">
                    Controls live viewers counter, items in carts, and 24h sold counts shown on product page.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-stone-700">Urgency Badges:</span>
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="w-4 h-4 accent-[#9B2C13] rounded"
                  />
                  <span className={`text-xs font-bold ${settings.enabled ? 'text-emerald-700' : 'text-stone-400'}`}>
                    {settings.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                {/* Live Viewers Range */}
                <div className="space-y-2 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                    <Eye className="w-4 h-4 text-[#9B2C13]" />
                    Live Viewers Range (Pill on Hero)
                  </div>
                  <p className="text-[11px] text-stone-500">The page randomly fluctuates between these two numbers.</p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">Min Viewers</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.liveViewers.min}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            liveViewers: { ...settings.liveViewers, min: parseInt(e.target.value) || 1 },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">Max Viewers</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.liveViewers.max}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            liveViewers: { ...settings.liveViewers, max: parseInt(e.target.value) || 1 },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                      />
                    </div>
                  </div>
                </div>

                {/* Sold in Last 24h */}
                <div className="space-y-2 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                    <TrendingUp className="w-4 h-4 text-[#9B2C13]" />
                    Sold in Last 24 Hours
                  </div>
                  <p className="text-[11px] text-stone-500">Displayed in scarcity badge under bundle selection.</p>
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Units Sold</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.soldLast24h}
                      onChange={(e) => setSettings({ ...settings, soldLast24h: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                    />
                  </div>
                </div>

                {/* Items in Carts */}
                <div className="space-y-2 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                    <ShoppingBag className="w-4 h-4 text-[#9B2C13]" />
                    People with Items in Carts
                  </div>
                  <p className="text-[11px] text-stone-500">Shown in "X in carts right now" micro-pill.</p>
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Cart Count</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.inCarts}
                      onChange={(e) => setSettings({ ...settings, inCarts: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                    />
                  </div>
                </div>

                {/* Live Shopping Bar Viewers */}
                <div className="space-y-2 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                    <Users className="w-4 h-4 text-[#9B2C13]" />
                    Live Stream Shopping Bar
                  </div>
                  <p className="text-[11px] text-stone-500">Viewers count displayed on the floating live comments bar.</p>
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Floating Bar Viewers</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.live.viewers}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          live: { ...settings.live, viewers: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                    />
                  </div>
                </div>

                {/* Per-Customer Purchase Limit */}
                <div className="space-y-2 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                    <Sliders className="w-4 h-4 text-[#9B2C13]" />
                    Per-Customer Purchase Limit
                  </div>
                  <p className="text-[11px] text-stone-500">"Limit X packs per customer" badge text.</p>
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Max Packs Per Customer</label>
                    <input
                      type="number"
                      min="1"
                      value={settings.purchaseLimit}
                      onChange={(e) => setSettings({ ...settings, purchaseLimit: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="mt-8 p-4 rounded-xl bg-orange-50/60 border border-orange-200">
                <p className="text-xs font-bold text-[#9B2C13] flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4" /> Live Frontend Preview
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-800 shadow-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {settings.liveViewers.min}–{settings.liveViewers.max} people viewing right now
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-800 shadow-xs font-medium">
                    🔥 {settings.soldLast24h} sold in 24 hrs
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-800 shadow-xs font-medium">
                    🛒 {settings.inCarts} in carts right now
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-800 shadow-xs font-medium">
                    Limit {settings.purchaseLimit} packs per customer
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: STOCK & INVENTORY */}
        {/* ========================================================================= */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="pb-5 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900">Inventory & Available Stock</h2>
                <p className="text-xs text-stone-500">
                  Update units remaining for each bundle package. The low-stock progress bar will adjust automatically on the store.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {[
                  { id: 'pack-3', title: 'Starter Glow Set (3-Pack)' },
                  { id: 'pack-6', title: 'Bestseller Duo Set (6-Pack)' },
                  { id: 'pack-9', title: 'Year-Round Vanity Vault (9-Pack)' },
                ].map((bundle) => {
                  const currentStock = settings.stock[bundle.id] || { unitsLeft: 10, totalUnits: 100 };
                  const percentLeft = Math.round((currentStock.unitsLeft / currentStock.totalUnits) * 100);

                  return (
                    <div key={bundle.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900">{bundle.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            currentStock.unitsLeft <= 10
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {currentStock.unitsLeft <= 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>

                      {/* Stock Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-stone-600 mb-1">
                          <span>{currentStock.unitsLeft} units left</span>
                          <span>of {currentStock.totalUnits} batch</span>
                        </div>
                        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percentLeft < 20 ? 'bg-rose-500' : 'bg-[#9B2C13]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, percentLeft))}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[10px] font-bold text-stone-600 block mb-1">Units Left</label>
                          <input
                            type="number"
                            min="0"
                            value={currentStock.unitsLeft}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                stock: {
                                  ...settings.stock,
                                  [bundle.id]: {
                                    ...currentStock,
                                    unitsLeft: parseInt(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-stone-600 block mb-1">Total Batch Units</label>
                          <input
                            type="number"
                            min="1"
                            value={currentStock.totalUnits}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                stock: {
                                  ...settings.stock,
                                  [bundle.id]: {
                                    ...currentStock,
                                    totalUnits: parseInt(e.target.value) || 1,
                                  },
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ACTIVE COUPONS */}
        {/* ========================================================================= */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Add Coupon Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 mb-1">Create New Discount Coupon</h2>
              <p className="text-xs text-stone-500 mb-5">
                New coupons are immediately applicable at checkout and will show on the coupon strip.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. FESTIVE50"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs uppercase font-mono font-bold bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Discount Type</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  >
                    <option value="fixed">Fixed ₹ Off</option>
                    <option value="percent">Percentage % Off</option>
                  </select>
                </div>

                {newCoupon.discountType === 'fixed' ? (
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Discount Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      value={newCoupon.amountOffInr}
                      onChange={(e) => setNewCoupon({ ...newCoupon, amountOffInr: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Percent Off (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCoupon.percentOff}
                      onChange={(e) => setNewCoupon({ ...newCoupon, percentOff: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for no minimum"
                    value={newCoupon.minSubtotalInr}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minSubtotalInr: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Display Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50 off or 15% off"
                    value={newCoupon.label}
                    onChange={(e) => setNewCoupon({ ...newCoupon, label: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Badge Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. orders above ₹399"
                    value={newCoupon.note}
                    onChange={(e) => setNewCoupon({ ...newCoupon, note: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddCoupon}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#9B2C13] hover:bg-[#80240F] rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Coupon Code
                </button>
              </div>
            </div>

            {/* Existing Coupons List */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 mb-4">Currently Configured Coupons ({settings.coupons.length})</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {settings.coupons.map((coupon) => (
                  <div
                    key={coupon.code}
                    className="p-4 rounded-xl border border-dashed border-[#E9A98F] bg-gradient-to-br from-[#FFF8F5] to-white relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-black uppercase text-[#9B2C13] bg-orange-100/70 px-2 py-0.5 rounded">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleRemoveCoupon(coupon.code)}
                          className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2">
                        <p className="text-base font-extrabold text-[#C4381F]">{coupon.label}</p>
                        <p className="text-xs text-stone-600 mt-0.5">{coupon.note}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                      <span>
                        {coupon.percentOff
                          ? `${coupon.percentOff}% off`
                          : coupon.freeShipping
                          ? 'Free Shipping'
                          : `₹${coupon.amountOffInr} off`}
                      </span>
                      <span>Min: ₹{coupon.minSubtotalInr || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PROMO BANNERS & TICKER */}
        {/* ========================================================================= */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            {/* Announcement Ticker */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-stone-900">Scrolling Marquee Ticker Messages</h2>
                <p className="text-xs text-stone-500">
                  These announcements scroll smoothly across the top banner of the storefront.
                </p>
              </div>

              <div className="space-y-2">
                {settings.ticker.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs"
                  >
                    <span className="text-stone-800 font-medium">{item}</span>
                    <button
                      onClick={() => handleRemoveTicker(index)}
                      className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="e.g. 🎁 Free shipping on all prepaid orders today!"
                  value={newTickerText}
                  onChange={(e) => setNewTickerText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTicker()}
                  className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                />
                <button
                  type="button"
                  onClick={handleAddTicker}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#9B2C13] hover:bg-[#80240F] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Message
                </button>
              </div>
            </div>

            {/* Countdown Banner */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-stone-900">Countdown Banner Settings</h2>
                <p className="text-xs text-stone-500">
                  Customizes the top urgency bar with countdown timer and bonus offer text.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Timer Mode</label>
                  <select
                    value={settings.countdown.mode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        countdown: { ...settings.countdown, mode: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  >
                    <option value="daily-reset">Daily Reset (Ends at midnight IST)</option>
                    <option value="fixed">Fixed Deadline Date</option>
                    <option value="off">Turn Off (Hide)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Banner Label</label>
                  <input
                    type="text"
                    value={settings.countdown.label}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        countdown: { ...settings.countdown, label: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Bonus Incentive</label>
                  <input
                    type="text"
                    value={settings.countdown.bonus}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        countdown: { ...settings.countdown, bonus: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>
              </div>

              {settings.countdown.mode === 'fixed' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Fixed Deadline (ISO format or date string)
                  </label>
                  <input
                    type="text"
                    value={settings.countdown.fixedDeadline}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        countdown: { ...settings.countdown, fixedDeadline: e.target.value },
                      })
                    }
                    placeholder="2026-10-31T23:59:00+05:30"
                    className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: CUSTOMER REVIEWS */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Review Form Card */}
            <div id="review-editor-card" className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-start justify-between pb-4 border-b border-stone-100">
                <div>
                  <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    {editingReviewId ? 'Edit Customer Review' : 'Add New Customer Review'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {editingReviewId
                      ? 'Update the review details below and click Update Review.'
                      : 'Create a customer review with author name, image/video link, social post URL, and custom timestamp.'}
                  </p>
                </div>

                {editingReviewId && (
                  <button
                    type="button"
                    onClick={handleCancelReviewEdit}
                    className="px-3 py-1 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {/* Form inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Author Name */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Riya Verma"
                    value={reviewForm.author}
                    onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>

                {/* Rating (Stars) */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Star Rating</label>
                  <div className="flex items-center gap-1 py-1.5 px-3 bg-stone-50 border border-stone-300 rounded-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= reviewForm.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-stone-700 ml-2">{reviewForm.rating} Stars</span>
                  </div>
                </div>

                {/* Date / Time Display (Editable!) */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Display Time / Date *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 days ago or Oct 8, 2026"
                    value={reviewForm.date}
                    onChange={(e) => setReviewForm({ ...reviewForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {['Just now', 'Yesterday', '2 days ago', '1 week ago', '2 weeks ago'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, date: preset })}
                        className="text-[9px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors font-medium"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Media Section: Image or Video Link */}
              <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#9B2C13]" /> Media Attachment (Image or Video)
                  </span>
                  {/* Type Selector */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        checked={reviewForm.mediaType === 'none'}
                        onChange={() => setReviewForm({ ...reviewForm, mediaType: 'none', mediaUrl: '' })}
                        className="accent-[#9B2C13]"
                      />
                      <span>None</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        checked={reviewForm.mediaType === 'image'}
                        onChange={() => setReviewForm({ ...reviewForm, mediaType: 'image' })}
                        className="accent-[#9B2C13]"
                      />
                      <span>Photo Image</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        checked={reviewForm.mediaType === 'video'}
                        onChange={() => setReviewForm({ ...reviewForm, mediaType: 'video' })}
                        className="accent-[#9B2C13]"
                      />
                      <span>Video Clip</span>
                    </label>
                  </div>
                </div>

                {reviewForm.mediaType !== 'none' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start pt-1">
                    <div className="md:col-span-2 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700 block">
                          Upload {reviewForm.mediaType === 'video' ? 'Video' : 'Image'}
                        </label>
                        <input
                          type="file"
                          accept={reviewForm.mediaType === 'video' ? 'video/*' : 'image/*'}
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13] file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer disabled:opacity-50"
                        />
                        {isUploading && <p className="text-[10px] text-[#9B2C13] font-medium animate-pulse">Uploading file to Supabase...</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700 block">
                          {reviewForm.mediaType === 'video' ? 'Or Paste Direct Video URL (.mp4)' : 'Or Paste Image URL'}
                        </label>
                        <input
                          type="url"
                          placeholder={
                            reviewForm.mediaType === 'video'
                              ? 'https://example.com/review-video.mp4'
                              : 'https://example.com/customer-photo.jpg or /media/whatsapp-proof.webp'
                          }
                          value={reviewForm.mediaUrl}
                          onChange={(e) => setReviewForm({ ...reviewForm, mediaUrl: e.target.value })}
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                        />
                        <p className="text-[10px] text-stone-500">
                          {reviewForm.mediaType === 'video'
                            ? 'Supports direct video links (MP4, WebM) that will play directly inside the customer review card.'
                            : 'Paste a direct link to any JPG, PNG, or WebP photo.'}
                        </p>
                      </div>
                    </div>

                    {/* Live Media Thumbnail Preview */}
                    {reviewForm.mediaUrl.trim() && (
                      <div className="p-2 bg-white rounded-lg border border-stone-200">
                        <span className="text-[10px] font-bold text-stone-500 block mb-1">Preview:</span>
                        {reviewForm.mediaType === 'video' ? (
                          <video
                            src={reviewForm.mediaUrl}
                            controls
                            className="w-full h-24 object-contain bg-black rounded"
                          />
                        ) : (
                          <img
                            src={reviewForm.mediaUrl}
                            alt="Preview"
                            className="w-full h-24 object-cover rounded"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Post URL Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Social Post / Reel URL (Optional)
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="e.g. https://www.instagram.com/reel/... or https://tiktok.com/..."
                      value={reviewForm.postUrl}
                      onChange={(e) => setReviewForm({ ...reviewForm, postUrl: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Adds a clickable "View Original Post" button that directs customers to the original post.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Purchased Bundle</label>
                  <select
                    value={reviewForm.purchasedPack}
                    onChange={(e) => setReviewForm({ ...reviewForm, purchasedPack: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  >
                    <option value="Bestseller Duo Set (6-Pack)">Bestseller Duo Set (6-Pack)</option>
                    <option value="Starter Glow Set (3-Pack)">Starter Glow Set (3-Pack)</option>
                    <option value="Year-Round Vanity Vault (9-Pack)">Year-Round Vanity Vault (9-Pack)</option>
                  </select>
                </div>
              </div>

              {/* Review Headline & Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Review Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Literally transformed my makeup routine"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Skin Type / Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Sensitive Skin or Acne-Prone"
                    value={reviewForm.skinType}
                    onChange={(e) => setReviewForm({ ...reviewForm, skinType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">Review Content *</label>
                <textarea
                  rows={3}
                  placeholder="Share detailed customer feedback, real skin results, and compliments..."
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                />
              </div>

              {/* Verified Buyer Checkbox & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewForm.verified}
                    onChange={(e) => setReviewForm({ ...reviewForm, verified: e.target.checked })}
                    className="w-4 h-4 accent-[#9B2C13] rounded"
                  />
                  <span className="text-xs font-semibold text-stone-800">Verified Buyer Badge</span>
                </label>

                <div className="flex items-center gap-2">
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={handleCancelReviewEdit}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveReview}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#9B2C13] hover:bg-[#80240F] rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    {editingReviewId ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {editingReviewId ? 'Update Review' : 'Add Review to Store'}
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Reviews List */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Live Reviews ({settings.reviews?.length || 0})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Reviews display in real-time under the "Community Love" section on your storefront.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#9B2C13]"
                    />
                  </div>

                  <select
                    value={reviewFilterRating}
                    onChange={(e) => setReviewFilterRating(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#9B2C13]"
                  >
                    <option value="ALL">All Ratings</option>
                    <option value="5">5 Stars only</option>
                    <option value="4">4 Stars</option>
                  </select>
                </div>
              </div>

              {/* Reviews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(settings.reviews || [])
                  .filter((rev) => {
                    const matchesSearch =
                      !reviewSearch ||
                      rev.author.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                      rev.content.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                      rev.title.toLowerCase().includes(reviewSearch.toLowerCase());
                    const matchesRating =
                      reviewFilterRating === 'ALL' || rev.rating === reviewFilterRating;
                    return matchesSearch && matchesRating;
                  })
                  .map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-3 relative flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Header: Author, Rating, Actions */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {rev.avatarInitials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-stone-900">{rev.author}</span>
                                {rev.verified && (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-500 flex items-center gap-1.5">
                                <span>{rev.skinType}</span>
                                <span>·</span>
                                <span className="font-medium text-stone-600">🕒 {rev.date}</span>
                              </div>
                            </div>
                          </div>

                          {/* Stars */}
                          <div className="flex text-amber-400">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                            ))}
                          </div>
                        </div>

                        {/* Title & Content */}
                        <h4 className="text-xs font-bold text-stone-900">{rev.title}</h4>
                        <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                          {rev.content}
                        </p>

                        {/* Video Preview */}
                        {rev.videoUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-stone-300/80 bg-black max-w-[200px]">
                            <video
                              src={rev.videoUrl}
                              controls
                              className="w-full max-h-32 object-contain"
                            />
                          </div>
                        )}

                        {/* Image Preview */}
                        {rev.imageUrl && !rev.videoUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-stone-200/80 max-w-[150px]">
                            <img
                              src={rev.imageUrl}
                              alt="Review attachment"
                              className="w-full h-24 object-cover"
                            />
                          </div>
                        )}

                        {/* Post URL Link */}
                        {rev.postUrl && (
                          <div className="pt-1">
                            <a
                              href={rev.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9B2C13] hover:underline bg-orange-50 px-2 py-0.5 rounded border border-orange-200"
                            >
                              <Link2 className="w-3 h-3" />
                              View Post Link
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Footer: Purchased pack & Edit/Delete actions */}
                      <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                        <span className="text-[10px] truncate max-w-[180px]">
                          {rev.purchasedPack}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditReview(rev)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-900 p-1"
                            title="Edit Review"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                            title="Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: DATABASE SETUP */}
        {/* ========================================================================= */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            {/* Live audit of the database rules */}
            <AdminSecurityCheck />

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#9B2C13]" /> Supabase Database Synchronization
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    To make admin changes persist across all devices and live customers, run this SQL script in your Supabase SQL Editor.
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    tableExists
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {tableExists ? 'Connected & Synced' : 'Action Required: Run SQL'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto relative">
                <pre>{sqlSetupScript}</pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(sqlSetupScript);
                    alert('SQL setup copied to clipboard! Paste it into your Supabase SQL editor.');
                  }}
                  className="absolute top-3 right-3 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] font-sans font-semibold border border-stone-700 transition-colors"
                >
                  Copy SQL Script
                </button>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" /> Easy 30-Second Setup:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-blue-800">
                  <li>
                    Supabase → <strong>Authentication → Users → Add user</strong>: create your admin login
                    (email + password). Turn <strong>off</strong> “Allow new users to sign up”.
                  </li>
                  <li>
                    Supabase → <strong>SQL Editor → New query</strong>: paste the script above and Run it.
                    Replace the seeded admin email with the one you just created.
                  </li>
                  <li>
                    Supabase → <strong>Table Editor → orders → Policies</strong>: delete any policy that
                    allows <code>select</code> with <code>true</code> — those expose customer addresses.
                  </li>
                  <li>
                    Reload <code>/admin</code>, sign in, then click “Save All Settings” to publish.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Auth gate
 * The dashboard above renders only behind a verified Supabase session, so the
 * order list (names, phones, addresses) is never exposed to the public.
 * ------------------------------------------------------------------------ */

const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-stone-100 flex items-center justify-center p-5 font-sans">
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9B2C13] to-[#FF6B4A] flex items-center justify-center text-white font-black text-lg">
          V
        </div>
        <div>
          <h1 className="text-base font-bold text-stone-900">Vidkwaii Control Center</h1>
          <p className="text-[11px] text-stone-500">Staff access only</p>
        </div>
      </div>
      {children}
    </div>
  </div>
);

const AdminSplash: React.FC = () => (
  <AuthShell>
    <div className="bg-white rounded-2xl border border-stone-200 p-6 flex items-center gap-3 text-sm text-stone-600">
      <RefreshCw className="w-4 h-4 animate-spin" />
      Checking your session…
    </div>
  </AuthShell>
);

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    const result = await signInAdmin(email, password);
    setBusy(false);
    if (result.error) setError(result.error);
    // On success the auth listener in AdminApp swaps in the dashboard.
  };

  const handleReset = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError('Enter your email first, then tap “Forgot password”.');
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin`,
    });
    if (resetError) setError(resetError.message);
    else setNotice('If that email has an account, a reset link is on its way.');
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="admin-email" className="text-[11px] font-bold text-stone-700">
            Work email
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C13]"
            placeholder="you@vidkwaii.space"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="admin-password" className="text-[11px] font-bold text-stone-700">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C13]"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[44px] rounded-xl bg-[#9B2C13] hover:bg-[#80240F] text-white text-sm font-bold disabled:opacity-70"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="w-full text-[11px] font-semibold text-stone-500 hover:text-stone-800"
        >
          Forgot password?
        </button>

        {error && (
          <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800">{error}</p>
        )}
        {notice && (
          <p className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-800">
            {notice}
          </p>
        )}

        <p className="text-[10px] text-stone-400 leading-relaxed">
          Access is limited to the admin emails listed in your Supabase <code>admins</code> table and in
          <code> VITE_ADMIN_EMAILS</code>. Orders are returned to signed-in admins only.
        </p>
      </form>
    </AuthShell>
  );
};

const LocalModeNotice: React.FC = () => (
  <div className="bg-rose-700 text-white text-[11px] font-semibold px-4 py-2 text-center">
    Local preview mode — Supabase keys are missing, so nothing here is saved or protected. Add
    VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before going live.
  </div>
);

export default function AdminApp() {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<AdminSessionInfo | null>(null);
  const [checking, setChecking] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setChecking(false);
      return;
    }
    let active = true;
    getAdminSession().then((found) => {
      if (!active) return;
      setSession(found);
      setChecking(false);
    });
    const listener = onAdminAuthChange((next) => {
      if (active) setSession(next);
    });
    return () => {
      active = false;
      listener?.data?.subscription?.unsubscribe();
    };
  }, [configured]);

  if (!configured) {
    return (
      <>
        <LocalModeNotice />
        <AdminDashboard adminEmail={null} />
      </>
    );
  }
  if (checking) return <AdminSplash />;
  if (!session) return <AdminLogin />;
  return <AdminDashboard adminEmail={session.email} />;
}
