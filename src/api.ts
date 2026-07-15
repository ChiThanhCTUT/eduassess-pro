/**
 * Shared API utilities - separated from App.tsx to avoid circular imports.
 * Components should import authFetch from here, not from App.tsx.
 */

export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('userToken');
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
}
