/** API base URL including `/api/v1` */
export function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8080/api/v1';
}

/** Origin for SockJS (no `/api/v1` path). */
export function getBackendOrigin(): string {
  const base = getApiBase();
  const marker = '/api/';
  const idx = base.indexOf(marker);
  if (idx !== -1) return base.slice(0, idx);
  try {
    return new URL(base).origin;
  } catch {
    return 'http://localhost:8080';
  }
}

export function getSockJsUrl(): string {
  return `${getBackendOrigin().replace(/\/$/, '')}/ws-belediye`;
}
