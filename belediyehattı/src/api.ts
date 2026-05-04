// ============================================
// BelediyeApp API Service — Backend Integration
// ============================================

const API_BASE = 'http://localhost:8080/api/v1';

// ── Token Management ───────────────────────
export function getToken(): string | null {
  return localStorage.getItem('belediye_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('belediye_refresh_token');
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('belediye_token', accessToken);
  localStorage.setItem('belediye_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('belediye_token');
  localStorage.removeItem('belediye_refresh_token');
  localStorage.removeItem('belediye_user');
}

export function getSavedUser(): AuthUser | null {
  const raw = localStorage.getItem('belediye_user');
  return raw ? JSON.parse(raw) : null;
}

export function saveUser(user: AuthUser) {
  localStorage.setItem('belediye_user', JSON.stringify(user));
}

// ── Types ──────────────────────────────────
export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  district: string | null;
}

export interface ApiCategory {
  id: string;
  name: string;
  description: string | null;
  iconCode: string | null;
}

export interface ApiReportList {
  id: string;
  title: string;
  status: string;
  categoryName: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  district?: string | null;
}

export interface ApiReportDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  categoryName: string;
  reporterFullName: string;
  assigneeFullName: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
  mediaUrls: string[];
  district?: string | null;
  aiPriority?: string | null;
  aiSummary?: string | null;
  aiSuggestedCategory?: string | null;
}

export interface ReportTimelineEntry {
  at: string;
  oldStatus: string | null;
  newStatus: string | null;
  actorName: string;
  note: string | null;
}

export interface ApiNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  reportId: string | null;
  createdAt: string;
}

export interface ApiUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  roles: string[];
}

// ── API Helper ─────────────────────────────
async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  if (res.status === 401) {
    // Try refresh
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      const retry = await fetch(`${API_BASE}${path}`, { ...opts, headers });
      const retryJson = await retry.json();
      if (!retry.ok || !retryJson.success) throw new Error(retryJson.message || 'Hata oluştu');
      return retryJson.data as T;
    }
    clearTokens();
    window.location.reload();
    throw new Error('Oturum süresi doldu');
  }

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Hata oluştu');
  return json.data as T;
}

async function tryRefreshToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

// ── Auth API ───────────────────────────────
export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<AuthUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(data.accessToken, data.refreshToken);
  saveUser(data);
  return data;
}

export async function register(firstName: string, lastName: string, email: string, password: string, phoneNumber?: string): Promise<AuthUser> {
  const data = await apiFetch<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, email, password, phoneNumber: phoneNumber || null }),
  });
  setTokens(data.accessToken, data.refreshToken);
  saveUser(data);
  return data;
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch { /* ignore */ }
  clearTokens();
}

// ── Categories ─────────────────────────────
export async function getCategories(): Promise<ApiCategory[]> {
  return apiFetch<ApiCategory[]>('/categories');
}

// ── Reports ────────────────────────────────
export async function createReport(title: string, description: string, categoryId: string, latitude: number, longitude: number, district?: string) {
  return apiFetch<ApiReportDetail>('/reports', {
    method: 'POST',
    body: JSON.stringify({ title, description, categoryId, latitude, longitude, district: district || null }),
  });
}

export async function getMyReports(page = 0, size = 20): Promise<{ content: ApiReportList[]; totalElements: number; totalPages: number }> {
  return apiFetch(`/reports/my?page=${page}&size=${size}&sort=createdAt,desc`);
}

export async function getReportDetail(id: string): Promise<ApiReportDetail> {
  return apiFetch(`/reports/${id}`);
}

export async function getReportTimeline(id: string): Promise<ReportTimelineEntry[]> {
  return apiFetch(`/reports/${id}/timeline`);
}

// ── Notifications ──────────────────────────
export async function getNotifications(page = 0, size = 20): Promise<{ content: ApiNotification[]; totalElements: number }> {
  return apiFetch(`/notifications?page=${page}&size=${size}`);
}

export async function getUnreadCount(): Promise<number> {
  return apiFetch<number>('/notifications/unread-count');
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch('/notifications/mark-all-read', { method: 'POST' });
}

// ── User ───────────────────────────────────
export async function getMyProfile(): Promise<ApiUserProfile> {
  return apiFetch('/users/me');
}
