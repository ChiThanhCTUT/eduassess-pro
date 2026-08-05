/**
 * Shared API utilities - separated from App.tsx to avoid circular imports.
 * Components should import authFetch from here, not from App.tsx.
 */

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('userToken');
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 || (res.status === 403 && url.startsWith('/api/'))) {
    const cloned = res.clone();
    const text = await cloned.text().catch(() => '');
    if (text.includes('Token') || text.includes('Chưa xác thực') || text.includes('hết hạn') || res.status === 401) {
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !options._isRetry) {
        // Attempt to refresh
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('userToken', data.token);
            // Retry the original request with the new token
            return authFetch(url, { ...options, _isRetry: true } as any);
          }
        } catch (e) {
          console.error('Refresh token failed:', e);
        }
      }

      // If refresh fails or no refresh token, logout
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('studentId');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('session-expired'));
    }
  }
  return res;
}
