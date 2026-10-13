import { defineEventHandler, setResponseHeader } from 'h3';

// Lightweight liveness probe for Zerops readinessCheck (no DB).
export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8');
  return 'ok';
});
