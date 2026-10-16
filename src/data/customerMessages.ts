/**
 * Everything the buyer is told after paying lives here — the on-screen "what
 * happens next" steps, the "while you wait" prep list, and the WhatsApp
 * templates you send at each stage. Edit the copy in this one file.
 *
 * Placeholders: {name} {firstName} {orderId} {tracking} {eta} {total} {trackUrl} {store}
 */

export const SUPPORT_WHATSAPP = '919797078387'; // country code + number, digits only
export const SUPPORT_HOURS = 'Mon–Sat, 10am–7pm IST';

export interface OrderStep {
  title: string;
  detail: string;
  timing: string;
}

/** The four things that happen after checkout, in order. */
export const ORDER_TIMELINE: OrderStep[] = [
  {
    title: 'Order confirmed',
    detail: 'Payment received and your order is locked in. A confirmation is on its way to you.',
    timing: 'Just now',
  },
  {
    title: 'Packed & dispatched',
    detail: 'We check each blade, seal it with its safety cap and hand the parcel to the courier.',
    timing: 'Within 24 hours',
  },
  {
    title: 'On the way',
    detail: 'You get the tracking number on WhatsApp and can follow it on our tracking page.',
    timing: '7–14 working days',
  },
  {
    title: 'Out for delivery',
    detail: 'The courier calls before arriving. Please keep your phone reachable.',
    timing: 'Delivery day',
  },
];

/** What the buyer should do between paying and using the razor. */
export const WHILE_YOU_WAIT: string[] = [
  'Watch the 45-second how-to on the product page so your first glide feels easy.',
  'Patch test 24 hours before your first use — glide once behind your ear.',
  'Skip retinol, acids and scrubs for 24 hours before and after dermaplaning.',
  'Plan to use it on clean, dry skin with a few drops of facial oil.',
];

/** Shown once the parcel has arrived. */
export const WHEN_IT_ARRIVES: string[] = [
  'Cleanse, pat dry, then apply 2–3 drops of facial oil so the blade glides.',
  'Hold skin taut and use short, light downward strokes at 45°.',
  'Wipe the blade on a tissue between strokes; snap the cap back on after use.',
  'Finish with a hydrating serum, and wear SPF the next morning.',
];

export interface StageMessage {
  key: string;
  label: string;
  template: string;
}

/** WhatsApp updates, matched to the order status in the admin dashboard. */
export const STAGE_MESSAGES: StageMessage[] = [
  {
    key: 'Confirmed',
    label: 'Order confirmed',
    template:
      'Hi {firstName}! 🎉 Your {store} order is confirmed.\n\nOrder: {orderId}\nPaid: {total}\n\nWhat happens next:\n1. We pack it today (within 24 hrs)\n2. You get a tracking number on WhatsApp\n3. Delivery in 7–14 working days\n\nTrack anytime: {trackUrl}\n\nAny questions, just reply here. 💛',
  },
  {
    key: 'Packed',
    label: 'Packed',
    template:
      'Good news {firstName} — order {orderId} is packed and sealed with safety caps. ✅\n\nIt is being handed to the courier now, and I will send your tracking number as soon as it is scanned.',
  },
  {
    key: 'Shipped',
    label: 'Shipped',
    template:
      '{firstName}, your {store} parcel is on the way. 🚚\n\nOrder: {orderId}\nTracking: {tracking}\nExpected: {eta}\n\nFollow it live: {trackUrl}\n\nWhile you wait: patch test 24 hrs before your first use, and skip retinol/scrubs that day so your skin is calm.',
  },
  {
    key: 'Out for Delivery',
    label: 'Out for delivery',
    template:
      '{firstName}, your parcel is out for delivery today. 📦\n\nOrder: {orderId}\nTracking: {tracking}\n\nPlease keep your phone reachable — the delivery partner usually calls before arriving. If you miss it, they will try again the next working day.',
  },
  {
    key: 'Delivered',
    label: 'Delivered + how to use',
    template:
      '{firstName}, your {store} order {orderId} is delivered. 🎉\n\nGetting started:\n1. Cleanse, pat dry, add 2–3 drops of facial oil\n2. Hold skin taut, short light strokes at 45°\n3. Wipe the blade, snap the cap back on\n4. Hydrate, and wear SPF tomorrow\n\nAnything unclear? Reply here and I will walk you through it.',
  },
  {
    key: 'Cancelled',
    label: 'Cancelled',
    template:
      'Hi {firstName}, order {orderId} has been cancelled and any amount paid is being refunded to your original payment method within 5–7 working days.\n\nIf this was not expected, reply here and we will look into it right away.',
  },
];
