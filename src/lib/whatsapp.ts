import { SUPPORT_WHATSAPP } from '../data/customerMessages';

/** Turns any typed phone number into wa.me digits (Indian numbers get 91). */
export function toWhatsAppNumber(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const number = toWhatsAppNumber(phone) || SUPPORT_WHATSAPP;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Values available to every template. */
export function templateValues(input: {
  name?: string;
  orderId?: string;
  tracking?: string;
  eta?: string;
  total?: string;
  storeName?: string;
}): Record<string, string> {
  const fullName = (input.name ?? '').trim();
  const firstName = fullName.split(' ')[0] ?? '';
  const orderId = input.orderId ?? '';
  return {
    name: fullName || 'there',
    firstName: firstName || 'there',
    orderId: orderId || '—',
    tracking: input.tracking || 'will be shared shortly',
    eta: input.eta || 'in 2–5 working days',
    total: input.total || '',
    store: input.storeName ?? 'Vidkwaii',
    trackUrl: `${window.location.origin}/track?order=${encodeURIComponent(orderId)}`,
  };
}
