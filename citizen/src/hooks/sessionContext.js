import { createContext, useContext } from 'react';
import { getDeviceId, getDeviceSecret } from '../lib/device';
import { OutboxStatus } from '../offline/Outbox';

/**
 * Resolved from the build-time server URL so the client never hardcodes a port
 * that differs between local dev and production hosting.
 */
export const WS_URL =
  typeof __SERVER_URL__ !== 'undefined'
    ? `${String(__SERVER_URL__).replace(/^http/, 'ws')}/ws`
    : 'ws://localhost:8083/ws';

/**
 * Chat-specific WebSocket URL for the separate chatbot service
 */
export const CHAT_WS_URL =
  typeof __SERVER_URL__ !== 'undefined'
    ? `${String(__SERVER_URL__).replace(/^http/, 'ws')}/chat`
    : 'ws://localhost:8083/chat';

export const SessionContext = createContext(null);

/** Device identity is minted once on first run and reused thereafter. */
export function createDeviceRef() {
  return { id: getDeviceId(), secret: getDeviceSecret() };
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

export { OutboxStatus };
