/**
 * Guided Application / Form Copilot model.
 *
 * Everything the workspace needs to render is derived here, from a plain
 * object, so the UI never hardcodes a URL, a service name or a step list.
 * Today the object is a static prototype; when the service database grows an
 * `applicationUrl` / `steps[]` per service this module is the only file that
 * has to change — `resolveGuidedApplication` is the seam.
 *
 * The one rule that must not bend: a website is only framed when it is on the
 * embed allowlist. Government portals routinely send `X-Frame-Options` /
 * `frame-ancestors`, and the honest response to a blocked frame is a link to
 * the real site, not an attempt to get around the browser's protection.
 */

import { translate } from './i18n';

/** Prototype target. Deliberately a page that is meant to be embedded. */
export const DEMO_APPLICATION_URL = 'https://example.com';

/**
 * Hosts we are willing to render inside the panel. Default-deny on purpose:
 * a URL that is not listed here gets the "open in a new tab" fallback instead
 * of a blank frame the citizen cannot explain.
 */
const EMBEDDABLE_HOSTS = new Set(['example.com', 'www.example.com']);

/** The service shown when the citizen has not picked one from the catalog. */
export const DEFAULT_SERVICE = {
  serviceId: 'income-certificate',
  serviceName: 'Income Certificate Application',
};

/** Prototype step list. Mirrors the shape a real service will provide. */
export const GUIDED_STEPS = [
  { id: 'understand-service', label: 'Understand Service' },
  { id: 'open-application', label: 'Open Application' },
  { id: 'applicant-details', label: 'Applicant Details' },
  { id: 'address', label: 'Address' },
  { id: 'documents', label: 'Documents' },
  { id: 'review', label: 'Review' },
  { id: 'submit', label: 'Submit' },
];

/** The step a citizen is looking at when the workspace opens. */
const DEFAULT_STEP_INDEX = 2;

/**
 * Accepts what a person might type in the address bar and returns a URL that
 * is safe to put in an iframe `src`, or null. Anything that is not plain
 * http(s) — `javascript:`, `data:`, `blob:` — is rejected outright.
 */
export function normalizeUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  // A bare host typed into the bar is the common case on a phone keyboard.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;

  let url;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!url.hostname || (!url.hostname.includes('.') && url.hostname !== 'localhost')) return null;

  return url.href;
}

/** `https://example.com/` -> `https://example.com`, the way a browser shows it. */
export function formatAddress(value) {
  try {
    const url = new URL(value);
    const path = url.pathname === '/' ? '' : url.pathname;
    return `${url.origin}${path}${url.search}${url.hash}`;
  } catch {
    return String(value ?? '');
  }
}

/** True when the panel may frame this URL; false means "use the fallback". */
export function canEmbed(value) {
  const safe = normalizeUrl(value);
  if (!safe) return false;
  try {
    return EMBEDDABLE_HOSTS.has(new URL(safe).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Catalog steps already say what to do, in the citizen's language. Reuse them
 * rather than authoring a parallel list, so the guide and the form agree.
 */
function stepsFromScheme(scheme, languageCode) {
  const steps = (scheme?.steps || []).map((step) => ({
    id: `${scheme.slug}-${step.n}`,
    label: translate(step.title, languageCode),
    hint: translate(step.detail, languageCode),
  }));
  return steps.length > 0 ? steps : GUIDED_STEPS.map((step) => ({ ...step }));
}

/**
 * Builds the workspace model. Pass a catalog scheme to get that service's real
 * name and steps; pass nothing to get the prototype workspace.
 */
export function resolveGuidedApplication({ scheme = null, languageCode = 'en' } = {}) {
  const steps = stepsFromScheme(scheme, languageCode);
  const defaultStepId = steps[Math.min(DEFAULT_STEP_INDEX, steps.length - 1)].id;

  return {
    serviceId: scheme?.slug || DEFAULT_SERVICE.serviceId,
    serviceName: scheme ? translate(scheme.title, languageCode) : DEFAULT_SERVICE.serviceName,
    // A real deployment swaps this for the service record's portal URL. Until
    // then the prototype always opens the demo page, never a government site.
    applicationUrl: DEMO_APPLICATION_URL,
    embeddable: canEmbed(DEMO_APPLICATION_URL),
    // True while the target is the placeholder page, so the UI can say so.
    isDemo: true,
    steps,
    defaultStepId,
  };
}

/** `done` before the current step, `current` on it, `todo` after it. */
export function applyStepState(steps, currentId) {
  const found = steps.findIndex((step) => step.id === currentId);
  const currentIndex = found >= 0 ? found : 0;
  return steps.map((step, index) => ({
    ...step,
    state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo',
  }));
}
