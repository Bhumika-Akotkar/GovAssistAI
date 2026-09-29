// The session hook itself. Kept free of JSX so it stays a plain .js module;
// the provider component that renders lives in SessionProvider.jsx.
export { SessionContext, WS_URL, createDeviceRef, useSession } from './sessionContext';

export { OutboxStatus } from '../offline/Outbox';
