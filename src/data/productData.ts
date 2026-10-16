import { BundleOption, FaqItem, Review } from '../types';

export const STORE_NAME = 'Vidkwaii';
export const TAGLINE = 'Painless Dermaplaning & Precision Brow Sculpting';

export const BUNDLE_OPTIONS: BundleOption[] = [
  {
    id: 'pack-3',
    name: 'Starter Glow Set (3-Pack)',
    packCount: 3,
    priceInr: 199,
    originalPriceInr: 299,
    priceUsd: 5.99,
    originalPriceUsd: 8.99,
    savingsLabel: 'Save 33%',
    includedColors: ['Sakura Blush Pink', 'Glacier Mint Blue', 'Butter Yellow'],
    perks: ['3 Precision Razors', 'Snap-on Safety Caps', 'Free Dermaplane Digital Guide'],
    imageUrl: '/media/slide1.webp',
  },
];

export const PRODUCT_SPECIFICATIONS = [
  { label: 'Blade Material', value: 'High-Grade Micro-Grooved Stainless Steel' },
  { label: 'Handle Material', value: 'Lightweight BPA-Free Ergonomic Resin' },
  { label: 'Safety Feature', value: 'Fine Micro-Guard Teeth + Protective Snap Cap' },
  { label: 'Razor Length', value: '15 cm (5.9 inches) · Pocket-Friendly' },
  { label: 'Blade Angle', value: 'Optimal 45° Facial Contouring Edge' },
  { label: 'Recommended Use', value: 'Eyebrows, Upper Lip, Cheeks, Forehead, Chin' },
  { label: 'Blade Life', value: '3 to 5 Uses per Blade' },
  { label: 'Skin Compatibility', value: 'Suitable for All Skin Types including Sensitive' },
];

export const DERMAPLANING_STEPS = [
  {
    step: '01',
    title: 'Cleanse & Apply Slip',
    description:
      'Wash your face with a gentle cleanser. Pat dry, then apply 2-3 drops of lightweight facial oil or squalane so the blade glides like silk without friction.',
    tip: 'Never dermaplane over dry skin or active inflammatory acne.',
  },
  {
    step: '02',
    title: 'Hold Skin Taut at 45°',
    description:
      'Hold the skin gently pulled taut with one hand. Place the Vidkwaii razor blade flat against skin at a precise 45-degree angle.',
    tip: 'Use short, light downward strokes with feather-light pressure.',
  },
  {
    step: '03',
    title: 'Soothe & Lock Moisture',
    description:
      'Wipe the blade clean on a tissue between strokes. Rinse face with cool water and follow with a hydrating serum and gentle ceramide moisturizer.',
    tip: 'Skip active retinol and exfoliants for 24 hours. Always wear SPF next day.',
  },
];

export const COMPARISON_TABLE = [
  {
    feature: 'Pain Level',
    Vidkwaii: '100% Painless (Gentle glide)',
    threading: 'High (Stinging tears)',
    waxing: 'High (Hot pulling & pain)',
  },
  {
    feature: 'Skin Redness & Bumps',
    Vidkwaii: 'Zero to minimal (Soothes quickly)',
    threading: 'Redness & irritation common',
    waxing: 'Frequent folliculitis & bumps',
  },
  {
    feature: 'Dead Skin Exfoliation',
    Vidkwaii: 'Yes — instant glass skin exfoliation',
    threading: 'No — only pulls hair follicle',
    waxing: 'Tears skin surface layer harshly',
  },
  {
    feature: 'Makeup Application',
    Vidkwaii: 'Airbrushed finish with zero cakeyness',
    threading: 'Irritated uneven pores',
    waxing: 'Wait 24h+ before applying makeup',
  },
  {
    feature: 'Cost per Session',
    Vidkwaii: 'Under ₹55 at home whenever needed',
    threading: '₹150 - ₹300 per salon visit',
    waxing: '₹400 - ₹800 per appointment',
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Ananya Sharma',
    avatarInitials: 'AS',
    rating: 5,
    date: '2 days ago',
    skinType: 'Sensitive & Dry',
    title: 'Literally transformed my makeup routine',
    content:
      'I was so terrified of shaving my face thinking it would grow back thick. That is a total myth! The micro-guards on these Vidkwaii razors prevent any nicks. Foundation glides on like melted butter now. Ordered the 6-pack and already gifted one to my sister.',
    verified: true,
    helpfulCount: 38,
    purchasedPack: 'Bestseller Duo Set (6-Pack)',
    imageUrl: '/media/whatsapp-proof.webp',
  },
  {
    id: 'rev-2',
    author: 'Pooja Iyer',
    avatarInitials: 'PI',
    rating: 5,
    date: '1 week ago',
    skinType: 'Combination / Acne-Prone',
    title: 'Painless and much better than salon threading',
    content:
      'Threading upper lip used to give me tiny white bumps every single month. Switched to Vidkwaii razors with a dab of aloe gel and it took literally 2 minutes. No bumps, no crying, zero redness. The safety cap is also great for travel.',
    verified: true,
    helpfulCount: 24,
    purchasedPack: 'Starter Glow Set (3-Pack)',
  },
  {
    id: 'rev-3',
    author: 'Sneha Roy',
    avatarInitials: 'SR',
    rating: 5,
    date: '2 weeks ago',
    skinType: 'Normal / Glass Skin Seeker',
    title: 'The micro-grooves make it super safe for beginners',
    content:
      'I have unsteady hands so I was hesitant, but the handle grip has these textured ridges that don’t slip even with damp fingers. Removed all the fine peach fuzz and dead skin flakes. My skin feels like a peeled boiled egg!',
    verified: true,
    helpfulCount: 19,
    purchasedPack: 'Year-Round Vanity Vault (9-Pack)',
  },
  {
    id: 'rev-4',
    author: 'Meera Patel',
    avatarInitials: 'MP',
    rating: 5,
    date: '3 weeks ago',
    skinType: 'Sensitive Skin',
    title: 'Worth every single rupee!',
    content:
      'Delivered in 3 days with instant UPI payment. Pastel colors are super cute aesthetic for the vanity table. Each razor lasts me about 4 uses before needing replacement. 10/10 recommendation.',
    verified: true,
    helpfulCount: 15,
    purchasedPack: 'Bestseller Duo Set (6-Pack)',
  },
  {
    "id": "rev-imported-1",
    "author": "Avani akbari",
    "avatarInitials": "AV",
    "rating": 5,
    "date": "2 September 2026",
    "skinType": "Verified Purchase",
    "title": "Very very good",
    "content": "Love the product, blade is good, grip is good, please buy, you want regret it, lasts long, this one I have used so many time loved it, I will purchase again",
    "verified": true,
    "helpfulCount": 6,
    "purchasedPack": "Bestseller Duo Set (6-Pack)",
    "imageUrl": "/media/reviews/review-1.webp"
  },
  {
    "id": "rev-imported-2",
    "author": "Ria",
    "avatarInitials": "RI",
    "rating": 5,
    "date": "8 June 2024",
    "skinType": "Verified Purchase",
    "title": "Nice product",
    "content": "Gentle on skin. will buy again.",
    "verified": true,
    "helpfulCount": 13,
    "purchasedPack": "Bestseller Duo Set (6-Pack)",
    "videoUrl": "/media/reviews/review-2.mp4"
  },
  {
    "id": "rev-imported-3",
    "author": "Vaishnavi singh",
    "avatarInitials": "VA",
    "rating": 5,
    "date": "25 December 2024",
    "skinType": "Verified Purchase",
    "title": "Worth buying the product",
    "content": "It gently cleaned my face without any cuts. The product was amazing",
    "verified": true,
    "helpfulCount": 9,
    "purchasedPack": "Bestseller Duo Set (6-Pack)",
    "imageUrl": "/media/reviews/review-3.webp"
  },
  {
    "id": "rev-imported-4",
    "author": "Payal Mishra",
    "avatarInitials": "PA",
    "rating": 5,
    "date": "29 June 2023",
    "skinType": "Verified Purchase",
    "title": "Recommended",
    "content": "Easy to use..just wipe it with a tissue after use, dont clean it with water and dont wipe with cloth",
    "verified": true,
    "helpfulCount": 15,
    "purchasedPack": "Bestseller Duo Set (6-Pack)",
    "imageUrl": "/media/reviews/review-4.webp"
  },
  {
    "id": "rev-imported-5",
    "author": "Akanksha Gokulpure",
    "avatarInitials": "AK",
    "rating": 5,
    "date": "14 September 2024",
    "skinType": "Verified Purchase",
    "title": "Absolutely nice product",
    "content": "Loved it!",
    "verified": true,
    "helpfulCount": 13,
    "purchasedPack": "Bestseller Duo Set (6-Pack)",
    "imageUrl": "/media/reviews/review-5.webp"
  },
  {
    "id": "rev-imported-6",
    "author": "Parvathy",
    "avatarInitials": "PA",
    "rating": 4,
    "date": "28 September 2022",
    "skinType": "Verified Purchase",
    "title": "Awesome product",
    "content": "Good product",
    "verified": true,
    "helpfulCount": 4,
    "purchasedPack": "Bestseller Duo Set (6-Pack)",
    "imageUrl": "/media/reviews/review-6.webp"
  },
  {
    "id": "rev-imported-7",
    "author": "Prince Patel",
    "avatarInitials": "PR",
    "rating": 5,
    "date": "23 May 2024",
    "skinType": "Verified Purchase",
    "title": "Good",
    "content": "Worth it",
    "verified": true,
    "helpfulCount": 5,
    "purchasedPack": "Bestseller Duo Set (6-Pack)",
    "imageUrl": "/media/reviews/review-7.webp"
  },
  {
    "id": "rev-imported-8",
    "author": "Anjitha C S",
    "avatarInitials": "AN",
    "rating": 4,
    "date": "5 July 2022",
    "skinType": "Verified Purchase",
    "title": "Good",
    "content": "Loved it!",
    "verified": true,
    "helpfulCount": 6,
    "purchasedPack": "Bestseller Duo Set (6-Pack)",
    "imageUrl": "/media/reviews/review-8.webp"
  }
];

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'safety',
    question: 'Will facial hair grow back thicker, darker, or coarser?',
    answer:
      'No, that is a proven scientific myth! Dermaplaning cuts hair bluntly at the surface of the skin. It does not affect the hair follicle underneath, which controls thickness, texture, and color. When peach fuzz regrows, it returns with the exact same soft texture as before.',
  },
  {
    id: 'faq-2',
    category: 'safety',
    question: 'Is it safe for beginners? Can I cut myself?',
    answer:
      'The Vidkwaii razor features precision stainless steel blades embedded with delicate micro-guard teeth. These safety micro-ridges create a physical barrier between the sharp edge and your skin, allowing peach fuzz to pass through while preventing nicks, scrapes, and cuts.',
  },
  {
    id: 'faq-3',
    category: 'usage',
    question: 'How often should I dermaplane?',
    answer:
      'We recommend using the razor once every 2 to 3 weeks. This aligns with your skin’s natural cellular renewal cycle and prevents over-exfoliation.',
  },
  {
    id: 'faq-4',
    category: 'usage',
    question: 'How do I clean and store the razor?',
    answer:
      'Wipe the blade on a clean paper towel after each stroke. When finished, rinse under warm running water or spray with 70% isopropyl alcohol, let air-dry completely, and snap on the included protective transparent safety cap.',
  },
  {
    id: 'faq-5',
    category: 'orders',
    question: 'What payment methods do you accept?',
    answer:
      'We accept 100% secure prepaid payments via UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, and Net Banking. All transactions are 256-bit encrypted with instant payment confirmation. We do not accept Cash on Delivery to guarantee prioritized fast dispatch.',
  },
  {
    id: 'faq-6',
    category: 'orders',
    question: 'How fast is delivery?',
    answer:
      'Orders are dispatched within 24 hours. Deliveries typically arrive in 7–14 business days with full SMS tracking.',
  },
];
