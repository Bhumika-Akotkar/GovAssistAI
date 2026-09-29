/**
 * The Guided Application workspace is driven by one plain object and two
 * security rules. These tests pin both: a bad URL must never reach the frame,
 * and a service without an embeddable portal must degrade to a link rather
 * than to an empty box.
 */

import { describe, expect, test } from 'vitest';
import {
  DEFAULT_SERVICE,
  DEMO_APPLICATION_URL,
  GUIDED_STEPS,
  applyStepState,
  canEmbed,
  formatAddress,
  normalizeUrl,
  resolveGuidedApplication,
} from '../src/lib/guidedApplication';
import { getGuidedCopy } from '../src/lib/guidedCopy';
import { getScheme } from '../src/lib/catalog';

describe('normalizeUrl', () => {
  test('assumes https for a bare host, which is what a phone keyboard gives', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
  });

  test('keeps an explicit http or https url', () => {
    expect(normalizeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(normalizeUrl('http://example.com/')).toBe('http://example.com/');
  });

  test('refuses every scheme that is not plain web navigation', () => {
    for (const hostile of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'blob:https://example.com/x',
      'file:///etc/passwd',
      'ftp://example.com',
    ]) {
      expect(normalizeUrl(hostile), hostile).toBeNull();
    }
  });

  test('refuses empty input and hosts that cannot exist', () => {
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
    expect(normalizeUrl(null)).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('https://')).toBeNull();
  });
});

describe('formatAddress', () => {
  test('shows a root url the way a browser does, without the trailing slash', () => {
    expect(formatAddress('https://example.com/')).toBe('https://example.com');
  });

  test('keeps the path and query', () => {
    expect(formatAddress('https://example.com/apply?step=2')).toBe('https://example.com/apply?step=2');
  });
});

describe('canEmbed', () => {
  test('is true for the prototype target', () => {
    expect(canEmbed(DEMO_APPLICATION_URL)).toBe(true);
  });

  test('is false for the government portals, which refuse framing themselves', () => {
    // Measured from the live headers, not guessed: mponline.gov.in sends
    // X-Frame-Options: SAMEORIGIN and frame-ancestors 'self'; pmkisan.gov.in
    // sends DENY. No page can put either inside an iframe.
    for (const url of [
      'https://www.mponline.gov.in',
      'https://pmkisan.gov.in',
      'https://services.india.gov.in',
      'https://google.com',
    ]) {
      expect(canEmbed(url), url).toBe(false);
    }
  });

  test('is false for anything that is not a url at all', () => {
    expect(canEmbed('javascript:alert(1)')).toBe(false);
    expect(canEmbed('')).toBe(false);
  });
});

describe('resolveGuidedApplication', () => {
  test('gives the prototype workspace when no service has been chosen', () => {
    const app = resolveGuidedApplication();
    expect(app.serviceName).toBe(DEFAULT_SERVICE.serviceName);
    expect(app.applicationUrl).toBe(DEMO_APPLICATION_URL);
    expect(app.embeddable).toBe(true);
    expect(app.isDemo).toBe(true);
  });

  test('always opens the demo page, never a real government site', () => {
    const app = resolveGuidedApplication({ scheme: getScheme('pm-kisan') });
    expect(app.applicationUrl).toBe(DEMO_APPLICATION_URL);
  });

  test('takes the service name and steps from the catalog when one is chosen', () => {
    const scheme = getScheme('pm-kisan');
    const app = resolveGuidedApplication({ scheme, languageCode: 'hi' });
    expect(app.serviceId).toBe('pm-kisan');
    expect(app.serviceName).toBe('पीएम-किसान');
    expect(app.steps).toHaveLength(scheme.steps.length);
    for (const step of app.steps) {
      expect(step.id).toBeTruthy();
      expect(step.label.trim()).not.toBe('');
    }
  });

  test('every step id is unique, or React would collapse the progress list', () => {
    const app = resolveGuidedApplication({ scheme: getScheme('aadhaar-services') });
    const ids = app.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('the default step is always a step that exists', () => {
    for (const scheme of [null, getScheme('pm-kisan'), getScheme('mgnrega')]) {
      const app = resolveGuidedApplication({ scheme });
      expect(app.steps.some((s) => s.id === app.defaultStepId)).toBe(true);
    }
  });

  test('the prototype list matches the steps the design calls for', () => {
    const app = resolveGuidedApplication();
    expect(app.steps.map((s) => s.label)).toEqual([
      'Understand Service',
      'Open Application',
      'Applicant Details',
      'Address',
      'Documents',
      'Review',
      'Submit',
    ]);
  });
});

describe('applyStepState', () => {
  const steps = GUIDED_STEPS.map((s) => ({ ...s }));

  test('marks what is behind the citizen as done and what is ahead as todo', () => {
    const marked = applyStepState(steps, 'applicant-details');
    expect(marked.map((s) => s.state)).toEqual([
      'done',
      'done',
      'current',
      'todo',
      'todo',
      'todo',
      'todo',
    ]);
  });

  test('falls back to the first step rather than rendering nothing', () => {
    expect(applyStepState(steps, 'no-such-step')[0].state).toBe('current');
    expect(applyStepState([], 'no-such-step')).toEqual([]);
  });
});

describe('getGuidedCopy', () => {
  const KEYS = [
    'cta',
    'opening',
    'intro',
    'title',
    'subtitle',
    'status',
    'exit',
    'progress',
    'currentStep',
    'stepHelp',
    'blockedTitle',
    'companionOpen',
    'companionReopen',
    'companionHint',
  ];

  test('falls back to English for a language that is not authored yet', () => {
    expect(getGuidedCopy('gu').cta).toBe(getGuidedCopy('en').cta);
  });

  test('every authored language is complete, so no label renders blank', () => {
    for (const code of ['en', 'hi', 'mr', 'ta', 'te', 'bn']) {
      const copy = getGuidedCopy(code);
      for (const key of KEYS) {
        expect(copy[key], `${code}.${key}`).toBeTypeOf('string');
        expect(copy[key].trim(), `${code}.${key}`).not.toBe('');
      }
      expect(copy.actions, `${code} actions`).toHaveLength(4);
      for (const action of copy.actions) {
        expect(action.label.trim(), `${code} ${action.id} label`).not.toBe('');
        expect(action.prompt.trim(), `${code} ${action.id} prompt`).not.toBe('');
      }
    }
  });

  test('keeps the assistant introduction on the screen as a readable turn', () => {
    const { intro } = getGuidedCopy('en');
    expect(intro).toContain('application portal');
    expect(intro.split('\n\n').length).toBeGreaterThanOrEqual(3);
  });
});
