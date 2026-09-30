import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";
import { AdminAuthShell } from "../components/layout/AdminAuthShell";

const API = "http://localhost:8083";

export default function AdminRegisterPage() {
  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      // After registering, if the user is not admin, promote them via the make-admin endpoint
      // (First user auto-gets admin, but if others need to be promoted this is where you'd do it)
      navigate("/admin/schemes");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthShell
      eyebrow={step === "phone" ? "Administrator setup" : "Phone verification"}
      title={step === "phone" ? "Create admin account" : "Verify OTP"}
      description={
        step === "phone"
          ? "Register the administrator phone number for this workspace."
          : `We sent a 6-digit code to ${phone}.`
      }
      footer={
        <p className="text-[11px] text-ink-3">
          Already registered?{" "}
          <Link
            to="/admin/login"
            className="font-semibold text-forest hover:underline"
          >
            Admin login
          </Link>
        </p>
      }
    >
      <div className="mb-7 flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full bg-forest" />
        <div
          className={`h-1 flex-1 rounded-full ${step === "otp" ? "bg-forest" : "bg-line"}`}
        />
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-danger/15 text-[11px] font-bold text-danger">
            !
          </span>
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div>
            <label
              htmlFor="admin-name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-3"
            >
              Your name
            </label>
            <input
              id="admin-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper/50 px-4 py-3 text-sm text-ink outline-none transition focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/15"
              placeholder="Your name"
            />
          </div>
          <div>
            <label
              htmlFor="register-phone"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-3"
            >
              Phone number
            </label>
            <input
              id="register-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper/50 px-4 py-3 text-sm text-ink outline-none transition focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/15"
              placeholder="+91 9876543210"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-forest-2 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" /> <span>Sending OTP…</span>
              </>
            ) : (
              <>
                <span>Send OTP</span> <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-xs text-forest">
            OTP sent to <strong>{phone}</strong>. Demo OTP:{" "}
            <strong>123456</strong>.
          </div>
          <div>
            <label
              htmlFor="register-otp"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-3"
            >
              Enter 6-digit code
            </label>
            <input
              id="register-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full rounded-xl border border-line bg-paper/50 px-4 py-3 text-center font-mono text-lg font-semibold tracking-[0.35em] text-ink outline-none transition focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/15"
              placeholder="••••••"
              maxLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-forest-2 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" /> <span>Verifying…</span>
              </>
            ) : (
              <>
                <span>Verify &amp; register</span> <ArrowRight size={15} />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
            }}
            className="w-full text-center text-xs font-medium text-ink-3 transition hover:text-forest"
          >
            ← Change number
          </button>
        </form>
      )}
    </AdminAuthShell>
  );
}
