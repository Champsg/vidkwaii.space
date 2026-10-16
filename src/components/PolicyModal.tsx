import React from 'react';
import { X } from 'lucide-react';

export type PolicyType = 'cancellation' | 'contact' | 'privacy' | 'refund' | 'shipping' | 'terms' | null;

interface PolicyModalProps {
  policy: PolicyType;
  onClose: () => void;
}

const POLICY_CONTENT: Record<NonNullable<PolicyType>, { title: string; content: React.ReactNode }> = {
  cancellation: {
    title: 'Cancellation Policy',
    content: (
      <div className="space-y-4">
        <p>We start preparing orders straight away, so they can't be cancelled once placed. If there's a problem with your order, contact us — see our return and refund policy.</p>
        <h4 className="font-bold text-stone-900">If we cancel</h4>
        <p>Occasionally we may have to cancel an order — for example, if an item is out of stock or its price was shown wrongly. We'll tell you straight away and refund any payment in full.</p>
      </div>
    )
  },
  contact: {
    title: 'Contact Us',
    content: (
      <div className="space-y-4">
        <p>We're happy to help with orders, returns, bulk enquiries or anything else.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Email:</strong> support@vidkwaii.space</li>
          <li><strong>WhatsApp:</strong> +91 9797078387</li>
          <li><strong>Hours:</strong> 10 am — 5 pm, Monday to Friday</li>
          <li><strong>Address:</strong> SHUJAAT (Vidkwaii), Pulwama, Kashmir,Jammu & Kashmir 192301</li>
        </ul>
        <h4 className="font-bold text-stone-900">Grievance officer</h4>
        <p>For complaints about an order or about your personal data, contact our grievance officer, Shujaat, at support@vidkwaii.space or +91 9797078387. We acknowledge complaints within 48 hours and resolve them within one month.</p>
      </div>
    )
  },
  privacy: {
    title: 'Privacy Policy',
    content: (
      <div className="space-y-4">
        <p className="text-stone-500 text-xs">Last updated: 9 October 2026</p>
        <p>This policy explains how SHUJAAT ("Vidkwaii") collects and uses your personal data when you visit www.vidkwaii.space or buy from us. We follow the Digital Personal Data Protection Act, 2023 and the other Indian laws that apply.</p>
        <h4 className="font-bold text-stone-900">What we collect</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Details you give us:</strong> your name, phone number, email, delivery and billing address.</li>
          <li><strong>Order details:</strong> what you bought, when, and how you paid.</li>
          <li><strong>Messages you send us</strong> by email, phone or WhatsApp.</li>
          <li><strong>Website data:</strong> basic technical information such as your device, browser and the pages you visit, collected through cookies.</li>
        </ul>
        <p>We don't see or store your card details, UPI PIN or bank passwords — payments are handled by our payment partners.</p>
        
        <h4 className="font-bold text-stone-900">Why we use it</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>To process, deliver and support your orders, including returns and refunds.</li>
          <li>To reply to your messages.</li>
          <li>To keep the records that tax and other laws require.</li>
          <li>To prevent fraud and keep our website secure.</li>
          <li>To send you offers and updates — only if you agree, and you can stop them at any time.</li>
        </ul>

        <h4 className="font-bold text-stone-900">Who we share it with</h4>
        <p>Only with those who help us run the business, and only what they need: courier and logistics partners to deliver your order, payment gateways, and the services that host our website and email. We share data with government authorities when the law requires it. We never sell your personal data.</p>

        <h4 className="font-bold text-stone-900">How long we keep it</h4>
        <p>As long as we need it for these purposes, and as long as the law requires — for example, invoices and tax records. After that we delete it.</p>

        <h4 className="font-bold text-stone-900">Your rights</h4>
        <p>You can ask us to show you the personal data we hold about you, correct or update it, delete it when we no longer need to keep it, and stop using it for marketing. You can also nominate someone to exercise these rights for you. Write to our grievance officer (below) — we'll respond within the time the law allows.</p>

        <h4 className="font-bold text-stone-900">Cookies</h4>
        <p>Our website uses cookies to keep your cart, remember your preferences and understand how visitors use the site. You can block or delete cookies in your browser; some features may then not work.</p>

        <h4 className="font-bold text-stone-900">Children</h4>
        <p>Our website is meant for adults. We don't knowingly collect personal data of anyone under 18 without a parent's or guardian's consent.</p>

        <h4 className="font-bold text-stone-900">Security</h4>
        <p>We take reasonable steps to protect your data. If a breach ever affects you, we'll tell you and the authorities as the law requires.</p>

        <h4 className="font-bold text-stone-900">Grievance officer</h4>
        <p>Shujaat<br/>SHUJAAT, Pulwama, Kashmir,Jammu & Kashmir 192301<br/>Email: support@vidkwaii.space | Phone: +91 9797078387</p>

        <h4 className="font-bold text-stone-900">Changes to this policy</h4>
        <p>We may update this policy; the date at the top shows the latest version.</p>
      </div>
    )
  },
  refund: {
    title: 'Return & Refund Policy',
    content: (
      <div className="space-y-4">
        <p className="text-stone-500 text-xs">Last updated: 9 October 2026</p>
        <p>We want you to love what you buy from Vidkwaii. If something isn't right, here's how we'll put it right.</p>
        
        <h4 className="font-bold text-stone-900">Damaged, defective or wrong items</h4>
        <p>We don't accept returns if you simply change your mind. But if your item arrives <strong>damaged, defective or different from what you ordered</strong>, tell us within <strong>7 days of delivery</strong> and we'll replace it or refund you in full, including shipping.</p>
        <p>For damaged or wrong items, please share photos and an <strong>unboxing video</strong> recorded from the moment you open the sealed parcel. It helps us settle the claim quickly.</p>

        <h4 className="font-bold text-stone-900">Items we can't take back</h4>
        <p>No Return For all Product unless damaged.</p>

        <h4 className="font-bold text-stone-900">How to ask for a return</h4>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Email support@vidkwaii.space or message us on +91 9797078387 with your order number and photos of the item.</li>
          <li>We'll reply within 2 working days with the next steps.</li>
          <li>Please send the item to the address we give you. Return shipping is paid by you, except for damaged, defective or wrong items, where we pay.</li>
        </ol>

        <h4 className="font-bold text-stone-900">Refunds</h4>
        <p>Once the item reaches us and passes a quick check, we'll send another product.</p>

        <h4 className="font-bold text-stone-900">Questions</h4>
        <p>Contact us at support@vidkwaii.space or +91 9797078387 (10 am — 5 pm, Monday to Friday).</p>
      </div>
    )
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    content: (
      <div className="space-y-4">
        <p className="text-stone-500 text-xs">Last updated: 9 October 2026</p>
        
        <h4 className="font-bold text-stone-900">Dispatch</h4>
        <p>We dispatch orders within <strong>2 working days</strong> of confirming them. We'll tell you on the product page or when you order.</p>

        <h4 className="font-bold text-stone-900">Delivery time</h4>
        <p>Delivery usually takes <strong>7—14 working days</strong> after dispatch, depending on where you are; remote areas can take longer. We'll send you a tracking link by WhatsApp once your order ships.</p>

        <h4 className="font-bold text-stone-900">Shipping charges</h4>
        <p>Free on orders above ₹299; ₹79 below that.</p>

        <h4 className="font-bold text-stone-900">Where we deliver</h4>
        <p>We deliver across India, to every PIN code our courier partners serve. We don't ship outside India at present.</p>

        <h4 className="font-bold text-stone-900">Delays and failed deliveries</h4>
        <p>Weather, holidays and other events outside our control can occasionally delay couriers; we'll keep you informed. If a parcel comes back to us because the address was incomplete or nobody was available after the courier's attempts, we can send it again — the shipping may be charged again — or cancel the order.</p>

        <h4 className="font-bold text-stone-900">Parcel damaged?</h4>
        <p>If the parcel looks tampered with or badly damaged, take photos and record an unboxing video and contact us within 7 days of delivery. See our return and refund policy.</p>
      </div>
    )
  },
  terms: {
    title: 'Terms & Conditions',
    content: (
      <div className="space-y-4">
        <p className="text-stone-500 text-xs">Last updated: 9 October 2026</p>
        <p>These terms apply when you use www.vidkwaii.space and buy from Vidkwaii, a business of SHUJAAT, Pulwama, Kashmir,Jammu & Kashmir 192301. By using the website or placing an order, you agree to them.</p>

        <h4 className="font-bold text-stone-900">Products and prices</h4>
        <p>We describe and photograph our products as accurately as we can. Colours can look slightly different on screens, and natural materials and handmade items may vary a little from piece to piece. Prices are in Indian rupees and include GST unless stated otherwise. If a price is shown wrongly by mistake, we'll contact you before processing the order, and you can cancel it.</p>

        <h4 className="font-bold text-stone-900">Orders</h4>
        <p>Your order is confirmed when we send you a confirmation. We may decline or cancel an order — for example, if an item is out of stock, we can't deliver to the address, or we suspect fraud — and we'll refund any payment in full.</p>

        <h4 className="font-bold text-stone-900">Payment</h4>
        <p>You can pay online through our secure payment partners. We don't store your card or UPI details.</p>

        <h4 className="font-bold text-stone-900">Shipping, returns and cancellations</h4>
        <p>These are covered by our shipping and delivery policy, return and refund policy and cancellation policy, which form part of these terms.</p>

        <h4 className="font-bold text-stone-900">Using the website</h4>
        <p>Please give accurate details and don't misuse the website — for example, by trying to break its security or by copying its content.</p>

        <h4 className="font-bold text-stone-900">Our content</h4>
        <p>The text, photos, designs and logos on this website belong to Vidkwaii or are used with permission. Please don't copy them without our written permission.</p>

        <h4 className="font-bold text-stone-900">Liability</h4>
        <p>Nothing in these terms limits your rights under Indian consumer law. Beyond those rights, our liability for an order is limited to the amount you paid for it, and we aren't responsible for delays or losses caused by events outside our reasonable control.</p>

        <h4 className="font-bold text-stone-900">Law and disputes</h4>
        <p>These terms are governed by the laws of India. Please contact us first — most problems are solved quickly. Disputes are subject to the courts at Pulwama, Kashmir, without affecting your right to approach a consumer commission.</p>

        <h4 className="font-bold text-stone-900">Contact</h4>
        <p>SHUJAAT, Pulwama, Kashmir,Jammu & Kashmir 192301 | support@vidkwaii.space | +91 9797078387</p>
      </div>
    )
  }
};

export const PolicyModal: React.FC<PolicyModalProps> = ({ policy, onClose }) => {
  if (!policy) return null;

  const content = POLICY_CONTENT[policy];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm">
          <h2 className="text-xl font-bold font-serif text-stone-900">{content.title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto text-sm text-stone-700 leading-relaxed">
          {content.content}
        </div>
      </div>
    </div>
  );
};
