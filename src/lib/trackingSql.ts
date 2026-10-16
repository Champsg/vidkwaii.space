/**
 * SQL the store owner runs once in Supabase to switch order tracking on.
 * It returns only shipping fields, and only when the order code AND the phone
 * number (last 4 digits) both match — so the public page can never list orders.
 */
export const TRACK_ORDER_SQL = [
  "create or replace function public.track_order(p_code text, p_phone text)",
  "returns table (",
  "  order_id text, status text, tracking_number text, bundle_name text,",
  "  quantity int, total_amount numeric, currency text, city text,",
  "  created_at timestamptz, payment_method text",
  ")",
  "language sql stable security definer set search_path = public as $$",
  "  select o.order_id, o.status, o.tracking_number, o.bundle_name, o.quantity,",
  "         o.total_amount, o.currency, o.city, o.created_at, o.payment_method",
  "  from public.orders o",
  "  where (o.order_id = upper(p_code) or o.tracking_number = upper(p_code))",
  "    and right(regexp_replace(coalesce(o.phone, ''), '\\D', '', 'g'), 4)",
  "      = right(regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g'), 4)",
  "  limit 1;",
  "$$;",
  "grant execute on function public.track_order(text, text) to anon, authenticated;",
].join('\n');
