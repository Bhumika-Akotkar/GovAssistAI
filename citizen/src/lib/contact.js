// Contact details are configuration, not copy. The mockup's `1800-11-XXXX` and
// `+91 98XXX XXXXX` are placeholders; shipping them as if they were real
// government numbers is worse than showing nothing. Anything left blank here
// renders as an "unavailable" state instead of a fake number.
export const CONTACT = {
  tollFree: {
    label: { en: 'Toll-free helpline', hi: 'टोल फ्री हेल्पलाइन' },
    value: import.meta.env.VITE_CONTACT_TOLLFREE || '',
  },
  whatsapp: {
    label: { en: 'WhatsApp', hi: 'व्हाट्सएप' },
    value: import.meta.env.VITE_CONTACT_WHATSAPP || '',
    // wa.me expects a digits-only number, no + or spaces.
    digits: (import.meta.env.VITE_CONTACT_WHATSAPP || '').replace(/[^\d]/g, ''),
  },
  csc: {
    label: { en: 'Common Service Centre', hi: 'कॉमन सर्विस सेंटर' },
    value: import.meta.env.VITE_CONTACT_CSC || '',
  },
};
