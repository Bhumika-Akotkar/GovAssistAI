// import { useCallback, useEffect, useState } from 'react';
// import { ExternalLink, MessageCircle, Phone, QrCode, RefreshCw } from 'lucide-react';
// import { Button } from '../components/ui/Button';
// import { Card } from '../components/ui/Card';

// const API_URL = '/api/baileys/public-numbers';
// const REFRESH_INTERVAL_MS = 15000;

// function isConnected(instance) {
//   const status = typeof instance.status === 'object'
//     ? instance.status?.connection || instance.status?.status
//     : instance.status;
//   return status === 'connected' || status === 'open';
// }

// function toWhatsAppDigits(phoneNumber) {
//   return String(phoneNumber || '').replace(/\D/g, '');
// }

// export default function WhatsAppContactPage() {
//   const [instances, setInstances] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState('');

//   const loadNumbers = useCallback(async ({ quiet = false } = {}) => {
//     if (quiet) setRefreshing(true);
//     else setLoading(true);

//     try {
//       const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
//       if (!response.ok) throw new Error('Could not load WhatsApp numbers.');
//       const data = await response.json();
//       setInstances(Array.isArray(data) ? data : []);
//       setError('');
//     } catch (loadError) {
//       setError(loadError.message || 'WhatsApp numbers are temporarily unavailable.');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadNumbers();
//     const intervalId = window.setInterval(() => loadNumbers({ quiet: true }), REFRESH_INTERVAL_MS);
//     return () => window.clearInterval(intervalId);
//   }, [loadNumbers]);

//   const connectedNumbers = instances
//     .filter((instance) => isConnected(instance) && toWhatsAppDigits(instance.phoneNumber))
//     .map((instance) => ({
//       ...instance,
//       digits: toWhatsAppDigits(instance.phoneNumber),
//     }));

//   return (
//     <div className="min-h-[60vh] bg-paper px-4 py-10 sm:py-14">
//       <div className="mx-auto max-w-5xl">
//         <header className="mx-auto mb-8 max-w-2xl text-center">
//           <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest">
//             <MessageCircle className="h-7 w-7" aria-hidden="true" />
//           </div>
//           <h1 className="font-display text-3xl text-ink sm:text-4xl">Chat with us on WhatsApp</h1>
//           <p className="mt-3 text-ink-2">
//             Scan a QR code with your phone camera to open a chat, or tap the number to start directly in WhatsApp.
//           </p>
//         </header>

//         <div className="mb-6 flex justify-end">
//           <Button variant="secondary" size="sm" onClick={() => loadNumbers({ quiet: true })} disabled={refreshing}>
//             <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
//             Refresh numbers
//           </Button>
//         </div>

//         {error && (
//           <Card variant="outlined" className="mb-6 flex flex-col items-start gap-3 border-danger/30 p-5 sm:flex-row sm:items-center sm:justify-between">
//             <p className="text-sm text-danger" role="alert">{error}</p>
//             <Button variant="secondary" size="sm" onClick={() => loadNumbers()}>
//               Try again
//             </Button>
//           </Card>
//         )}

//         {loading ? (
//           <Card className="p-8 text-center text-ink-2" role="status">Loading connected WhatsApp numbers…</Card>
//         ) : connectedNumbers.length === 0 ? (
//           <Card variant="outlined" className="mx-auto max-w-2xl p-8 text-center">
//             <Phone className="mx-auto mb-3 h-8 w-8 text-ink-3" aria-hidden="true" />
//             <h2 className="text-lg font-semibold text-ink">No connected WhatsApp number right now</h2>
//             <p className="mt-2 text-sm text-ink-2">
//               Please check back shortly. This page updates automatically when a number is connected.
//             </p>
//           </Card>
//         ) : (
//           <div className="grid gap-5 md:grid-cols-2">
//             {connectedNumbers.map((instance) => {
//               const chatUrl = `https://wa.me/${instance.digits}`;
//               const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(chatUrl)}`;

//               return (
//                 <Card key={instance.instanceId} className="overflow-hidden p-6">
//                   <div className="mb-5 flex items-center gap-3">
//                     <div className="flex h-11 w-11 items-center justify-center rounded-full bg-forest/10 text-forest">
//                       <MessageCircle className="h-5 w-5" aria-hidden="true" />
//                     </div>
//                     <div>
//                       <h2 className="font-semibold text-ink">Sahayak Seva WhatsApp</h2>
//                       <p className="text-xs text-forest">Available to chat</p>
//                     </div>
//                   </div>

//                   <div className="flex flex-col items-center rounded-xl bg-paper px-4 py-5">
//                     <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-2">
//                       <QrCode className="h-4 w-4" aria-hidden="true" /> Scan to open this chat
//                     </div>
//                     <img
//                       src={qrUrl}
//                       alt={`QR code to start a WhatsApp chat with ${instance.phoneNumber}`}
//                       width="240"
//                       height="240"
//                       className="h-60 w-60 rounded-lg border border-line bg-white p-2"
//                       loading="lazy"
//                     />
//                     <p className="mt-3 text-center text-xs text-ink-3">
//                       Point your phone camera at the code, then tap the WhatsApp link.
//                     </p>
//                   </div>

//                   <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                     <div>
//                       <p className="text-xs text-ink-3">WhatsApp number</p>
//                       <a
//                         href={chatUrl}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="mt-1 inline-flex min-h-11 items-center gap-2 font-semibold text-forest underline-offset-4 hover:underline"
//                       >
//                         <Phone className="h-4 w-4" aria-hidden="true" />
//                         {instance.phoneNumber}
//                       </a>
//                     </div>
//                     <a
//                       href={chatUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest/90"
//                     >
//                       Chat now <ExternalLink className="h-4 w-4" aria-hidden="true" />
//                     </a>
//                   </div>
//                 </Card>
//               );
//             })}
//           </div>
//         )}

//         <p className="mt-8 text-center text-xs text-ink-3">
//           WhatsApp opens outside this website. Your messages are handled through WhatsApp.
//         </p>
//       </div>
//     </div>
//   );
// }

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ExternalLink,
  MessageCircle,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "../components/ui/Button";

const API_URL = "/api/baileys/public-numbers";
const REFRESH_INTERVAL_MS = 15000;

function isConnected(instance) {
  const status =
    typeof instance.status === "object"
      ? instance.status?.connection || instance.status?.status
      : instance.status;
  return status === "connected" || status === "open";
}

function toWhatsAppDigits(phoneNumber) {
  return String(phoneNumber || "").replace(/\D/g, "");
}

export default function WhatsAppContactPage({ onClose, returnFocusRef }) {
  const navigate = useNavigate();
  const closeButtonRef = useRef(null);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const close = useCallback(() => {
    if (onClose) onClose();
    else navigate("/");
  }, [navigate, onClose]);

  const loadNumbers = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(API_URL, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Could not load WhatsApp numbers.");
      const data = await response.json();
      setInstances(Array.isArray(data) ? data : []);
      setError("");
    } catch (loadError) {
      setError(
        loadError.message || "WhatsApp numbers are temporarily unavailable.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNumbers();
    const intervalId = window.setInterval(
      () => loadNumbers({ quiet: true }),
      REFRESH_INTERVAL_MS,
    );
    return () => window.clearInterval(intervalId);
  }, [loadNumbers]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") close();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusRef?.current?.focus();
    };
  }, [close, returnFocusRef]);

  const connectedNumbers = instances
    .filter(
      (instance) =>
        isConnected(instance) && toWhatsAppDigits(instance.phoneNumber),
    )
    .map((instance) => ({
      ...instance,
      digits: toWhatsAppDigits(instance.phoneNumber),
    }));

  const primary = connectedNumbers[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-dialog-title"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white px-6 py-8 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          aria-label="Close WhatsApp dialog"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          {/* Header */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]/10">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-[#25D366]"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </div>
          <h1
            id="whatsapp-dialog-title"
            className="font-display text-2xl text-ink sm:text-3xl"
          >
            Get scheme assistance on WhatsApp
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            Scan the QR code or tap the number to get step-by-step guidance for
            government schemes.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-5 flex w-full items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
              <p className="text-left text-xs text-danger" role="alert">
                {error}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => loadNumbers()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <p className="mt-8 text-sm text-ink-2" role="status">
              Loading connected WhatsApp number…
            </p>
          ) : connectedNumbers.length === 0 ? (
            <div className="mt-8 flex flex-col items-center">
              <Phone className="mb-2 h-6 w-6 text-ink-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">
                No connected number right now
              </p>
              <p className="mt-1 text-xs text-ink-3">
                This page updates automatically when a number connects.
              </p>
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="mt-7 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                Scan to get started
              </div>
              <div className="mt-3 rounded-xl border border-line bg-white p-2 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(`https://wa.me/${primary.digits}`)}`}
                  alt={`QR code to get government scheme assistance on WhatsApp with ${primary.phoneNumber}`}
                  width="200"
                  height="200"
                  className="h-48 w-48 rounded-lg sm:h-52 sm:w-52"
                  loading="lazy"
                />
              </div>

              {/* Number */}
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                WhatsApp Number
              </p>
              <a
                href={`https://wa.me/${primary.digits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-2 text-lg font-bold text-forest underline-offset-4 hover:underline sm:text-xl"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {primary.phoneNumber}
              </a>

              {/* Chat Button */}
              <a
                href={`https://wa.me/${primary.digits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#20BD5A] hover:shadow-md active:scale-[.98]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Ask about a scheme
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              {/* Guidelines */}
              <div className="mt-8 w-full border-t border-line pt-6 text-left">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-3">
                  How to get scheme help
                </h3>
                <ol className="space-y-2.5">
                  {[
                    "Open your phone camera or WhatsApp scanner.",
                    "Point it at the QR code above.",
                    "Tap the link to open the chat.",
                    "Ask about PM-KISAN, Ration Card, Ayushman Bharat or any scheme.",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10 text-[10px] font-bold text-forest">
                        {i + 1}
                      </span>
                      <span className="text-xs text-ink-2">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Security note */}
              <div className="mt-6 flex w-full items-start gap-2 border-t border-line pt-5 text-left">
                <ShieldCheck
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest"
                  aria-hidden="true"
                />
                <p className="text-[11px] leading-relaxed text-ink-3">
                  WhatsApp opens outside this website. Messages are handled
                  securely through WhatsApp.
                </p>
              </div>
            </>
          )}

          {/* Refresh */}
          <button
            onClick={() => loadNumbers({ quiet: true })}
            disabled={refreshing}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-ink-3 transition-colors hover:text-forest disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
