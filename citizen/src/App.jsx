import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { SessionProvider } from "./hooks/SessionProvider";
import { useSession } from "./hooks/useSession";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { useFontScale } from "./hooks/useFontScale";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ConnectionBadge } from "./components/layout/ConnectionBadge";

import HomePage from "./pages/HomePage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import AdminSchemesPage from "./pages/AdminSchemesPage";
import AdminBaileysPage from "./pages/AdminBaileysPage";
// The chat and voice pages pull in the session hook, the outbox, and the whole
// audio pipeline. None of that is needed to read the home page, which is the
// one a returning citizen hits first — so keep it out of the initial bundle.
const ChatPage = lazy(() => import("./pages/ChatPage"));
const VoicePage = lazy(() => import("./pages/VoicePage"));
const SyncStatusPage = lazy(() => import("./pages/SyncStatusPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const WhatsAppContactPage = lazy(() => import("./pages/WhatsAppContactPage"));

function RouteFallback() {
  return (
    <div
      className="flex items-center justify-center py-32"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-ink-3">
        <svg
          className="animate-spin w-5 h-5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>Loading…</span>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AccessibilityControls() {
  const { scale, cycleScale } = useFontScale();

  useEffect(() => {
    const root = document.documentElement;
    if (scale === "normal") delete root.dataset.fs;
    else root.dataset.fs = scale;
  }, [scale]);

  return (
    <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-2 focus-within:right-2 focus-within:z-50 focus-within:flex focus-within:gap-2 focus-within:bg-white focus-within:p-2 focus-within:rounded-lg focus-within:shadow-lg">
      <button
        type="button"
        onClick={cycleScale}
        className="px-3 py-2 min-h-[44px] rounded-lg border border-line text-sm text-ink"
      >
        Text size: {scale}
      </button>
      <button
        type="button"
        onClick={() => {
          const root = document.documentElement;
          root.dataset.contrast =
            root.dataset.contrast === "high" ? "" : "high";
        }}
        className="px-3 py-2 min-h-[44px] rounded-lg border border-line text-sm text-ink"
      >
        High contrast
      </button>
    </div>
  );
}

function Layout({ children, hideFooter = false, hideTopBar = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-forest focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>
      <Navbar hideTopBar={hideTopBar} />
      <main id="main" className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <ConnectionBadge />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SessionProvider>
        <ScrollToTop />
        <AccessibilityControls />
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/login"
            element={
              <Layout>
                <Suspense fallback={<RouteFallback />}>
                  <LoginPage />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/chat"
            element={
              <Layout hideFooter hideTopBar>
                <Suspense fallback={<RouteFallback />}>
                  <ChatPage />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <Layout hideFooter hideTopBar>
                <Suspense fallback={<RouteFallback />}>
                  <ChatPage />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/voice"
            element={
              <Layout hideFooter hideTopBar>
                <Suspense fallback={<RouteFallback />}>
                  <VoicePage />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/sync"
            element={
              <Layout>
                <Suspense fallback={<RouteFallback />}>
                  <SyncStatusPage />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/help"
            element={
              <Layout>
                <Suspense fallback={<RouteFallback />}>
                  <HelpPage />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="/whatsapp"
            element={
              <Layout>
                <Suspense fallback={<RouteFallback />}>
                  <WhatsAppContactPage />
                </Suspense>
              </Layout>
            }
          />
          {/* Old paths from the mockup's DOM-based nav; keep them working. */}
          <Route
            path="/applications"
            element={<Navigate to="/sync" replace />}
          />

          {/* Admin Routes */}
          <Route path="/admin/register" element={<AdminRegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/schemes" element={<AdminSchemesPage />} />
          <Route path="/admin/baileys" element={<AdminBaileysPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SessionProvider>
    </LanguageProvider>
  );
}
