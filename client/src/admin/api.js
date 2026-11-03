const TOKEN_KEY = 'dos_admin_token';
const USER_KEY = 'dos_admin_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };
export const saveAuth = (token, user) => { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); };
export const clearAuth = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !path.startsWith('/auth/login')) {
    clearAuth();
    window.location.href = '/admin/login';
    throw new Error('Session expired');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Server error');
  return data;
}

// تحميل ملف (النسخة الاحتياطية) مع التوكن
export async function download(path, filename) {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Download failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});
