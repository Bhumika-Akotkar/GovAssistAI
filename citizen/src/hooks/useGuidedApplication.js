import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { applyStepState, resolveGuidedApplication } from '../lib/guidedApplication';
import { getGuidedCopy } from '../lib/guidedCopy';

// The AI says what is happening *before* anything moves, then the split starts.
// The intro lands while the panels are still travelling, so the portal is
// already open by the time the AI introduces it.
const OPEN_DELAY_MS = 340;
const INTRO_DELAY_MS = 900;
// Long enough for the panels to finish collapsing (guided.css uses 560ms).
const EXIT_MS = 560;

/**
 * The whole Guided Application feature is one boolean plus a little state
 * around it. Nothing here renders anything, so the chat screen keeps ownership
 * of its own layout and this can be reused by the voice screen later.
 *
 * `guidedMode` is the switch the rest of the app reads. The panel is kept
 * mounted for the length of the closing transition (see `isClosing`) — that is
 * what stops the browser from vanishing in a single frame on the way out.
 */
export function useGuidedApplication({ scheme = null, languageCode = 'en', onAgentMessage } = {}) {
  const [guidedMode, setGuidedMode] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mobilePane, setMobilePane] = useState('chat');
  const [currentStepId, setCurrentStepId] = useState(null);
  const [workspaceVisible, setWorkspaceVisible] = useState(false);

  const timersRef = useRef([]);

  const copy = getGuidedCopy(languageCode);
  const application = useMemo(
    () => resolveGuidedApplication({ scheme, languageCode }),
    [scheme, languageCode],
  );

  // A new service (or a language change, which re-labels catalog steps) starts
  // again from that service's own first form step rather than a stale index.
  useEffect(() => {
    setCurrentStepId(application.defaultStepId);
  }, [application.defaultStepId]);

  const currentStepIdEffective = application.steps.some((s) => s.id === currentStepId)
    ? currentStepId
    : application.defaultStepId;

  const steps = useMemo(
    () => applyStepState(application.steps, currentStepIdEffective),
    [application.steps, currentStepIdEffective],
  );

  const currentStep = steps.find((s) => s.state === 'current') || steps[0];

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const open = useCallback(() => {
    if (guidedMode || isClosing) return;
    clearTimers();

    onAgentMessage?.(copy.opening);
    timersRef.current.push(
      setTimeout(() => setGuidedMode(true), OPEN_DELAY_MS),
      setTimeout(() => {
        onAgentMessage?.(copy.intro);
        setWorkspaceVisible(true);
      }, INTRO_DELAY_MS),
    );
  }, [clearTimers, copy, guidedMode, isClosing, onAgentMessage]);

  const exit = useCallback(() => {
    if (!guidedMode || isClosing) return;
    clearTimers();
    setMobilePane('chat');
    setWorkspaceVisible(false);
    setIsClosing(true);
    timersRef.current.push(
      setTimeout(() => {
        setGuidedMode(false);
        setIsClosing(false);
      }, EXIT_MS),
    );
  }, [clearTimers, guidedMode, isClosing]);

  return {
    guidedMode,
    isClosing,
    /** True while the panels are open — this is what drives the layout. */
    isSplit: guidedMode && !isClosing,
    open,
    exit,
    application,
    steps,
    currentStep,
    currentStepId: currentStepIdEffective,
    setCurrentStepId,
    workspaceVisible,
    mobilePane,
    setMobilePane,
  };
}

export default useGuidedApplication;
