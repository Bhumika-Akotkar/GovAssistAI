import {
  ArrowLeft,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../ui/Logo";

const ADMIN_FEATURES = [
  { icon: ShieldCheck, label: "Protected administrator access" },
  { icon: LockKeyhole, label: "Secure phone verification" },
  { icon: UserRoundCheck, label: "Manage schemes and services" },
];

export function AdminAuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}) {
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-paper px-4 py-6 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(600px 320px at 20% 20%, rgba(34,84,61,0.10), transparent 65%), radial-gradient(500px 260px at 85% 80%, rgba(192,138,42,0.08), transparent 65%)",
        }}
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-white shadow-[0_30px_80px_-30px_rgba(22,19,15,0.25)] lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest p-10 text-white lg:flex">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mustard/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl"
          />

          <Link
            to="/"
            className="relative inline-flex w-fit items-center gap-3 text-white"
          >
            <Logo size={42} className="rounded-[10px]" />
            <span className="font-display text-xl">Sahayak Seva</span>
          </Link>

          <div className="relative mt-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur">
              <ShieldCheck size={12} className="text-mustard" />
              Administrator portal
            </div>
            <h2 className="mt-8 font-display text-4xl leading-tight tracking-tight">
              Manage citizen services with
              <br />
              <span className="italic text-mustard">confidence and care</span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              Access tools for scheme information, citizen support, and service
              operations from one secure workspace.
            </p>
          </div>

          <ul className="relative mt-10 space-y-4">
            {ADMIN_FEATURES.map(({ icon: Icon, label }) => (
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
          <p className="relative mt-10 border-t border-white/10 pt-6 text-[11px] text-white/50">
            Authorized administrators only.
          </p>
        </aside>

        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12">
          <div className="mx-auto w-full max-w-sm">
            <Link
              to="/"
              className="mb-8 flex w-fit items-center gap-2 lg:hidden"
            >
              <Logo size={36} className="rounded-lg" />
              <span className="font-display text-lg text-ink">
                Sahayak Seva
              </span>
            </Link>

            <div className="mb-8">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-terra">
                {eyebrow}
              </span>
              <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
              <p className="mt-1.5 text-sm text-ink-2">{description}</p>
            </div>

            {children}

            <div className="mt-8 flex flex-col items-center gap-3 border-t border-line pt-5 text-center">
              {footer}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-3 transition hover:text-forest"
              >
                <ArrowLeft size={12} /> Back to home
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminAuthShell;
