import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneCall, X, ShieldCheck } from "lucide-react";

export default function CallContactPage({ onClose, returnFocusRef }) {
  const navigate = useNavigate();
  const closeButtonRef = useRef(null);
  
  const helplineNumber = "+18389664013";
  const formattedNumber = "+1 (838) 966-4013";

  const close = useCallback(() => {
    if (onClose) onClose();
    else navigate("/");
  }, [navigate, onClose]);

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
        aria-labelledby="call-dialog-title"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white px-6 py-8 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          aria-label="Close Call dialog"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          {/* Header */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B3A2C]/10 text-[#1B3A2C]">
            <PhoneCall className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1
            id="call-dialog-title"
            className="font-display text-2xl text-ink sm:text-3xl"
          >
            Call our Helpline
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            Speak directly with our AI assistant for step-by-step guidance on government schemes.
          </p>

          <div className="mt-8 rounded-xl border border-line bg-white p-6 shadow-sm w-full">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Toll-Free Number
            </p>
            <a
              href={`tel:${helplineNumber}`}
              className="mt-2 inline-flex items-center gap-2 text-2xl font-bold text-[#1B3A2C] hover:underline sm:text-3xl"
            >
              <Phone className="h-6 w-6" aria-hidden="true" />
              {formattedNumber}
            </a>
          </div>

          {/* Call Button */}
          <a
            href={`tel:${helplineNumber}`}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B3A2C] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#24523E] hover:shadow-md active:scale-[.98]"
          >
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            Call Now
          </a>

          {/* Guidelines */}
          <div className="mt-8 w-full border-t border-line pt-6 text-left">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-3">
              How it works
            </h3>
            <ol className="space-y-2.5">
              {[
                "Tap the Call Now button or dial the number.",
                "Speak in your preferred language.",
                "Ask about schemes like PM-KISAN, Ration Card, etc.",
                "Get instant, accurate responses from our AI.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1B3A2C]/10 text-[10px] font-bold text-[#1B3A2C]">
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
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1B3A2C]"
              aria-hidden="true"
            />
            <p className="text-[11px] leading-relaxed text-ink-3">
              Standard calling rates may apply depending on your network provider. 
              Your call is securely handled by our AI assistant.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
