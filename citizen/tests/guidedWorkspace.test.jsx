/**
 * Render smoke tests for the guided workspace.
 *
 * These components hold no state of their own worth testing here — the hook
 * owns the state machine — but a typo in a class name or a missing import only
 * shows up when React actually walks the tree. Rendering to a string catches
 * that without needing a DOM.
 */

import { describe, expect, test } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { BrowserPanel } from '../src/components/guided/BrowserPanel';
import { GuidedHeader } from '../src/components/guided/GuidedHeader';
import { GuidedAssist } from '../src/components/guided/GuidedAssist';
import { GuidedLauncher } from '../src/components/guided/GuidedLauncher';
import { resolveGuidedApplication, applyStepState } from '../src/lib/guidedApplication';

const application = resolveGuidedApplication();
const steps = applyStepState(application.steps, application.defaultStepId);

describe('BrowserPanel', () => {
  const html = renderToStaticMarkup(<BrowserPanel application={application} languageCode="en" />);

  test('frames the application portal and names it for screen readers', () => {
    expect(html).toContain('src="https://example.com"');
    expect(html).toContain('title="Application portal"');
  });

  test('offers the full toolbar the design calls for', () => {
    expect(html).toContain('aria-label="Go back"');
    expect(html).toContain('aria-label="Go forward"');
    expect(html).toContain('aria-label="Reload the page"');
    expect(html).toContain('aria-label="Open in a new tab"');
    expect(html).toContain('id="guided-address"');
  });

  test('shows the real address in the bar, not a placeholder', () => {
    expect(html).toContain('value="https://example.com"');
  });

  test('back and forward are inert until there is somewhere to go', () => {
    expect(html).toContain('title="Go back" aria-label="Go back"');
    expect(html).toMatch(/title="Go back"[^>]*disabled/);
    expect(html).toMatch(/title="Go forward"[^>]*disabled/);
  });

  test('falls back to a link, not a frame, for a portal that may not be embedded', () => {
    const blocked = renderToStaticMarkup(
      <BrowserPanel application={{ ...application, applicationUrl: 'https://www.mponline.gov.in' }} />,
    );
    expect(blocked).not.toContain('<iframe');
    expect(blocked).toContain('This website cannot be opened here');
    // noopener: the opened page must not get a handle on this window.
    expect(blocked).toContain('href="https://www.mponline.gov.in"');
    expect(blocked).toContain('rel="noopener noreferrer"');
  });

  test('offers a companion window, so the copilot stays on screen beside the form', () => {
    const blocked = renderToStaticMarkup(
      <BrowserPanel application={{ ...application, applicationUrl: 'https://www.mponline.gov.in' }} />,
    );
    expect(blocked).toContain('Open in a window beside the assistant');
    expect(blocked).toContain('The assistant stays open here');
  });
});

describe('GuidedHeader', () => {
  const html = renderToStaticMarkup(
    <GuidedHeader application={application} languageCode="en" pane="chat" onPaneChange={() => {}} onExit={() => {}} />,
  );

  test('states the mode, the assistance and the service being applied for', () => {
    expect(html).toContain('Guided Application');
    expect(html).toContain('AI Assistance Active');
    expect(html).toContain('Income Certificate Application');
  });

  test('offers a clearly worded way out', () => {
    expect(html).toContain('Exit Guided Mode');
  });

  test('is honest that the target is a placeholder', () => {
    expect(html).toContain('no real government portal is connected');
  });
});

describe('GuidedAssist', () => {
  const html = renderToStaticMarkup(
    <GuidedAssist steps={steps} currentStep={steps[2]} languageCode="en" visible />,
  );

  test('lists the whole application journey', () => {
    for (const step of application.steps) expect(html).toContain(step.label);
    expect(html).toContain('Applicant Details');
  });

  test('offers the four things people ask while filling a form', () => {
    expect(html).toContain('Explain this field');
    expect(html).toContain('What documents do I need?');
    expect(html).toContain('Translate to Hindi');
    expect(html).toContain('What&#x27;s next?');
  });

  test('stays collapsed and inert while the workspace is closed', () => {
    const hidden = renderToStaticMarkup(
      <GuidedAssist steps={steps} currentStep={steps[2]} languageCode="en" visible={false} />,
    );
    expect(hidden).toContain('data-visible="false"');
    expect(hidden).toContain('disabled');
  });
});

describe('GuidedLauncher', () => {
  test('is the single, plainly named control that opens the workspace', () => {
    const html = renderToStaticMarkup(<GuidedLauncher languageCode="en" onOpen={() => {}} visible />);
    expect(html).toContain('Open Application Workspace');
    expect(html).toContain('data-visible="true"');
  });

  test('hides itself once the workspace is open', () => {
    const html = renderToStaticMarkup(<GuidedLauncher languageCode="en" onOpen={() => {}} visible={false} />);
    expect(html).toContain('data-visible="false"');
  });
});
