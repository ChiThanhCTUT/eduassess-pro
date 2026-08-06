/**
 * Shared API utilities - separated from App.tsx to avoid circular imports.
 * Components should import authFetch from here, not from App.tsx.
 */

interface CustomRequestInit extends RequestInit {
  _isRetry?: boolean;
}

/**
 * Gọi API tự động đính kèm Token và xử lý Refresh Token nếu Token hết hạn.
 * 
 * Nếu API trả về lỗi 401 hoặc lỗi hết hạn phiên, hàm sẽ tự động dùng Refresh Token 
 * để xin lại Access Token mới và thử lại (retry) API ban đầu.
 * 
 * @param url - Đường dẫn API cần gọi
 * @param options - Tùy chọn Fetch API
 * @returns Promise<Response>
 */
export async function authFetch(url: string, options: CustomRequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('userToken');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 || (res.status === 403 && url.startsWith('/api/'))) {
    const cloned = res.clone();
    const text = await cloned.text().catch(() => '');
    if (
      text.includes('Token') ||
      text.includes('Chưa xác thực') ||
      text.includes('hết hạn') ||
      res.status === 401
    ) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !options._isRetry) {
        // Attempt to refresh
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
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

/**
 * Xử lý kết quả trả về từ Fetch API. 
 * Nếu có lỗi từ server (status >= 400), hàm sẽ lấy thông báo lỗi và ném ra ngoại lệ.
 * Nếu thành công, hàm sẽ tự động parse JSON và trả về object.
 * 
 * @param res - Đối tượng Response trả về từ fetch
 * @returns Object JSON đã được parse
 * @throws Error kèm theo thông báo lỗi từ phía server
 */
export async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  throw new Error('Server returned non-JSON response');
}
