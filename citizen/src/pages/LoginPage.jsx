// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// export default function LoginPage() {
//   const [phone, setPhone] = useState('');
//   const [otp, setOtp] = useState('');
//   const [step, setStep] = useState(1);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleRequestOtp = async (e) => {
//     e.preventDefault();
//     if (!phone || phone.length < 10) {
//       setError('Please enter a valid phone number');
//       return;
//     }

//     setLoading(true);
//     setError('');
//     try {
//       const res = await fetch('/api/auth/request-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ phone }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Failed to request OTP');

//       setStep(2);
//       // Using an alert here for demo purposes since the user needs to know the OTP is 123456
//       alert(data.message);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     if (!otp) {
//       setError('Please enter the OTP');
//       return;
//     }

//     setLoading(true);
//     setError('');
//     try {
//       const res = await fetch('/api/auth/verify-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ phone, otp }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');

//       // Save token (in a real app, this might be handled by an auth provider context)
//       localStorage.setItem('citizen_token', data.token);

//       // Redirect to home or chat
//       navigate('/');

//       // Force a page reload to pick up the new authentication state if SessionProvider relies on it
//       window.location.reload();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-[70vh] flex flex-col justify-center items-center px-4">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-line p-8">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-forest-light text-forest mb-4">
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//             </svg>
//           </div>
//           <h1 className="text-2xl font-bold text-ink mb-2">Citizen Login</h1>
//           <p className="text-ink-2">Verify your phone number to access your profile.</p>
//         </div>

//         {error && (
//           <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2">
//             <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <p>{error}</p>
//           </div>
//         )}

//         {step === 1 ? (
//           <form onSubmit={handleRequestOtp} className="space-y-6">
//             <div>
//               <label htmlFor="phone" className="block text-sm font-medium text-ink mb-1">
//                 Phone Number
//               </label>
//               <div className="relative">
//                 <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-3">
//                   +91
//                 </span>
//                 <input
//                   id="phone"
//                   type="tel"
//                   required
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                   placeholder="9876543210"
//                   className="w-full pl-12 pr-4 py-3 rounded-xl border border-line focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-shadow"
//                 />
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-forest text-white py-3 rounded-xl font-medium hover:bg-forest-dark focus:ring-2 focus:ring-offset-2 focus:ring-forest transition-colors disabled:opacity-50"
//             >
//               {loading ? 'Sending...' : 'Send OTP'}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleVerifyOtp} className="space-y-6">
//             <div>
//               <label htmlFor="otp" className="block text-sm font-medium text-ink mb-1">
//                 Enter OTP
//               </label>
//               <input
//                 id="otp"
//                 type="text"
//                 required
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//                 placeholder="123456"
//                 className="w-full px-4 py-3 rounded-xl border border-line focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-shadow text-center text-lg tracking-widest font-mono"
//                 maxLength={6}
//               />
//               <p className="text-xs text-ink-3 mt-2 text-center">
//                 A demo OTP "123456" was generated for you.
//               </p>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-forest text-white py-3 rounded-xl font-medium hover:bg-forest-dark focus:ring-2 focus:ring-offset-2 focus:ring-forest transition-colors disabled:opacity-50"
//             >
//               {loading ? 'Verifying...' : 'Verify & Login'}
//             </button>

//             <div className="text-center">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setStep(1);
//                   setOtp('');
//                   setError('');
//                 }}
//                 className="text-forest hover:text-forest-dark text-sm font-medium"
//               >
//                 Change Phone Number
//               </button>
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  X,
  Lock,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [demoOtp, setDemoOtp] = useState("");
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = window.setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => window.clearInterval(id);
  }, [resendTimer]);

  // Auto-focus first OTP box when entering step 2
  useEffect(() => {
    if (step === 2) otpRefs.current[0]?.focus();
  }, [step]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request OTP");

      setDemoOtp(data.otp || "123456");
      setStep(2);
      setResendTimer(30);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify OTP");

      localStorage.setItem("citizen_token", data.token);
      navigate("/");
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((digit, i) => {
      next[i] = digit;
    });
    setOtp(next);
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setResendTimer(30);
    setError("");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP");
      setDemoOtp(data.otp || "123456");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/50 px-4 py-6 backdrop-blur-sm sm:py-10"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) navigate(-1);
      }}
    >
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(600px 320px at 20% 20%, rgba(34,84,61,0.10), transparent 65%), radial-gradient(500px 260px at 85% 80%, rgba(192,138,42,0.08), transparent 65%)",
        }}
      />

      <div
        className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-white shadow-[0_30px_80px_-30px_rgba(22,19,15,0.25)] lg:grid-cols-[1.05fr_1fr]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink-3 shadow-sm transition hover:bg-white hover:text-ink"
          aria-label="Close login"
        >
          <X size={18} />
        </button>
        {/* ── Left / Brand panel ─────────────────────────────── */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest p-10 text-white lg:flex">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mustard/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl"
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur">
              <ShieldCheck size={12} className="text-mustard" />
              Secure citizen access
            </div>

            <h2 className="mt-8 font-display text-4xl leading-tight tracking-tight">
              Your gateway to
              <br />
              <span className="italic text-mustard">government schemes</span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              Sign in to save your progress, track applications, and get
              personalised scheme recommendations — in your language.
            </p>
          </div>

          <ul className="relative mt-10 space-y-4">
            {[
              { icon: Shield, label: "OTP-verified phone login" },
              { icon: Lock, label: "Your data stays private" },
              { icon: ShieldCheck, label: "Works offline once verified" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-sm text-white/85"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-mustard">
                  <Icon size={15} strokeWidth={2.2} />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="relative mt-10 border-t border-white/10 pt-6 text-[11px] text-white/50">
            By continuing you agree to our Terms of Service & Privacy Policy.
          </div>
        </aside>

        {/* ── Right / Form panel ─────────────────────────────── */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12">
          <div className="mx-auto w-full max-w-sm">
            {/* Mobile brand mark */}
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-mustard">
                <ShieldCheck size={18} />
              </span>
              <span className="font-display text-lg text-ink">
                Sahayak Seva
              </span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-terra">
                {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
              </span>
              <h1
                id="login-title"
                className="mt-2 font-display text-3xl text-ink"
              >
                {step === 1 ? "Sign in" : "Verify OTP"}
              </h1>
              <p className="mt-1.5 text-sm text-ink-2">
                {step === 1
                  ? "Enter your mobile number to receive a one-time password."
                  : `We sent a 6-digit code to +91 ${phone}.`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="mb-7 flex items-center gap-2">
              <div
                className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-forest" : "bg-line"}`}
              />
              <div
                className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-forest" : "bg-line"}`}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-danger/15 text-[11px] font-bold text-danger">
                  !
                </span>
                <p className="text-xs text-danger" role="alert">
                  {error}
                </p>
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-3"
                  >
                    Mobile number
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-ink-3">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="98765 43210"
                      className="w-full rounded-xl border border-line bg-paper/50 py-3 pl-14 pr-4 text-sm text-ink outline-none transition focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/15"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-forest-2 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Sending OTP…</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-ink-3">
                  We'll never share your number with anyone.
                </p>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="otp-0"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-3"
                  >
                    Enter 6-digit code
                  </label>
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        aria-label={`OTP digit ${i + 1}`}
                        className="h-12 w-full rounded-xl border border-line bg-paper/50 text-center font-mono text-lg font-semibold text-ink outline-none transition focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/15"
                      />
                    ))}
                  </div>

                  {demoOtp && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-mustard/30 bg-mustard/10 px-3 py-2 text-[11px] text-mustard-2">
                      <span className="font-semibold">Demo OTP:</span>
                      <span className="font-mono font-bold tracking-widest">
                        {demoOtp}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-forest-2 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & continue</span>
                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp(["", "", "", "", "", ""]);
                      setError("");
                    }}
                    className="inline-flex items-center gap-1 font-medium text-ink-3 transition hover:text-forest"
                  >
                    <Phone size={11} />
                    Change number
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || loading}
                    className="font-medium text-forest transition hover:underline disabled:cursor-not-allowed disabled:text-ink-3 disabled:no-underline"
                  >
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 border-t border-line pt-5 text-center">
              <p className="text-[11px] text-ink-3">
                Need help?{" "}
                <button
                  type="button"
                  className="font-semibold text-forest hover:underline"
                >
                  Contact support
                </button>
              </p>
              <Link
                to="/admin/login"
                className="mt-3 inline-flex text-[11px] font-semibold text-forest transition hover:underline"
              >
                Admin login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
