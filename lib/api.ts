import type {
  ActivateSubscriptionResponse,
  AuthResponse,
  AvailabilityDayDto,
  AvailabilityResponse,
  Booking,
  BucketListItem,
  BulkAvailabilityRequest,
  ChatMessage,
  Conversation,
  CoTraveler,
  SavedPaymentMethod,
  CreateBookingRequest,
  Experience,
  Hospital,
  HostSubscription,
  Listing,
  MediaItem,
  MedicalStayPackage,
  MilesBalance,
  MilesHistoryResponse,
  NomadComment,
  NomadPost,
  PaymentOrder,
  PgPackage,
  QuickReplyTemplate,
  Review,
  ReviewStats,
  HostReviewStats,
  ICalFeed,
  OccupancyReport,
  PricingRule,
  RoomType,
  RoomTypeInclusion,
  SearchResponse,
  SubscriptionTier,
  UserProfile,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Singleton refresh guard — prevents concurrent refresh requests.
 * With refresh token rotation, only one refresh can succeed at a time.
 */
let refreshPromise: Promise<boolean> | null = null;

async function doRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log('[AUTH] Refresh response keys:', Object.keys(data), 'hasAccessToken:', !!data.accessToken, 'tokenLen:', data.accessToken?.length);
      localStorage.setItem('access_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
      if (data.user?.role) localStorage.setItem('user_role', data.user.role);
      document.cookie = `access_token=${data.accessToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      return true;
    } else {
      console.log('[AUTH] Refresh failed:', res.status);
    }
  } catch { /* network error */ }
  return false;
}

async function refreshTokenOnce(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefreshToken().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

/**
 * Check if JWT token is about to expire (within 2 minutes) and proactively refresh.
 */
async function ensureFreshToken(options?: RequestInit): Promise<RequestInit | undefined> {
  if (typeof window === 'undefined') return options;
  const headers = options?.headers as Record<string, string> | undefined;
  if (!headers?.Authorization) return options;

  const token = headers.Authorization.replace('Bearer ', '');
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    if (expiresAt - Date.now() < 120000) {
      const ok = await refreshTokenOnce();
      if (ok) {
        const newToken = localStorage.getItem('access_token') || token;
        return {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
        };
      }
    }
  } catch { /* token decode failed */ }
  return options;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // Auto-inject auth token from localStorage if not already provided
  let opts = options;
  if (typeof window !== 'undefined') {
    const headers = opts?.headers as Record<string, string> | undefined;
    if (!headers?.Authorization) {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        opts = {
          ...opts,
          headers: { ...headers, Authorization: `Bearer ${storedToken}` },
        };
      }
    }
  }

  // Proactively refresh token if about to expire
  const freshOptions = await ensureFreshToken(opts);

  const res = await fetch(`${API_URL}${path}`, {
    ...freshOptions,
    headers: {
      'Content-Type': 'application/json',
      ...freshOptions?.headers,
    },
    credentials: 'include',
    cache: 'no-store',
  });

  // Auto-refresh token on 401 for any non-auth endpoint
  if (res.status === 401 && typeof window !== 'undefined' && !path.includes('/auth/')) {
    console.log('[AUTH] 401 on', path, '- attempting refresh. localStorage token:', !!localStorage.getItem('access_token'));
    const ok = await refreshTokenOnce();
    console.log('[AUTH] Refresh result:', ok, 'new token:', !!localStorage.getItem('access_token'), 'len:', localStorage.getItem('access_token')?.length);
    if (ok) {
      const newToken = localStorage.getItem('access_token') || '';
      if (newToken) {
        const retryRes = await fetch(`${API_URL}${path}`, {
          ...freshOptions,
          headers: { 'Content-Type': 'application/json', ...freshOptions?.headers as Record<string, string>, Authorization: `Bearer ${newToken}` },
          credentials: 'include',
        });
        if (!retryRes.ok) {
          const text = await retryRes.text().catch(() => '');
          let message = text || `HTTP ${retryRes.status}`;
          if (text) {
            try {
              const j = JSON.parse(text);
              message = j.detail || j.message || j.title || text;
            } catch { /* not JSON */ }
          }
          const err: any = new Error(message);
          err.status = retryRes.status;
          throw err;
        }
        const text = await retryRes.text();
        return text ? JSON.parse(text) : (undefined as T);
      }
    }
    // Refresh failed — clear and redirect to login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    document.cookie = 'access_token=; path=/; max-age=0';
    window.location.href = '/auth';
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Unwrap Spring ProblemDetail so callers (and alert()) see the human message,
    // not the raw {"type":"about:blank","detail":"..."} JSON.
    let message = text || `HTTP ${res.status}`;
    if (text) {
      try {
        const j = JSON.parse(text);
        message = j.detail || j.message || j.title || text;
      } catch { /* not JSON — keep raw text */ }
    }
    const err: any = new Error(message);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

/** Like apiFetch but for FormData uploads — does NOT set Content-Type (browser sets multipart boundary). */
async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '';
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  // Proactively refresh if token is about to expire
  const freshOpts = await ensureFreshToken({ headers });
  const finalHeaders = (freshOpts?.headers as Record<string, string>) || headers;

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: finalHeaders,
    body: formData,
    credentials: 'include',
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    const ok = await refreshTokenOnce();
    if (ok) {
      const newToken = localStorage.getItem('access_token') || '';
      const retryRes = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${newToken}` },
        body: formData,
        credentials: 'include',
      });
      if (!retryRes.ok) throw new Error(`Upload failed (${retryRes.status})`);
      const text = await retryRes.text();
      return text ? JSON.parse(text) : (undefined as T);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    document.cookie = 'access_token=; path=/; max-age=0';
    window.location.href = '/auth';
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export const api = {
  /* ── Search ───────────────────────────────────────────────── */
  search: async (params: Record<string, string>): Promise<SearchResponse> => {
    try {
      const raw = await apiFetch<any>(
        `/api/v1/search/listings?${new URLSearchParams(params)}`
      );
      // Normalise search-service response to SearchResponse shape
      return {
        content: raw.content ?? raw.listings ?? [],
        totalElements: raw.totalElements ?? raw.totalHits ?? 0,
        totalPages: raw.totalPages ?? Math.ceil((raw.totalHits ?? 0) / (Number(params.size) || 20)),
        number: raw.number ?? raw.page ?? 0,
        size: raw.size ?? (Number(params.size) || 20),
        aggregations: raw.aggregations ?? undefined,
      };
    } catch {
      // If geo search (lat/lng), try /nearby endpoint as backup
      if (params.lat && params.lng) {
        console.warn('ES search failed for geo query — trying /nearby endpoint');
        try {
          const nearbyParams = new URLSearchParams();
          nearbyParams.set('lat', params.lat);
          nearbyParams.set('lng', params.lng);
          if (params.radiusKm) nearbyParams.set('radiusKm', params.radiusKm);
          if (params.type) nearbyParams.set('type', params.type);
          nearbyParams.set('limit', params.size || '20');
          const nearby = await apiFetch<any[]>(`/api/v1/search/nearby?${nearbyParams}`);
          return {
            content: nearby ?? [],
            totalElements: nearby?.length ?? 0,
            totalPages: 1,
            number: 0,
            size: Number(params.size) || 20,
          };
        } catch {
          console.warn('Nearby endpoint also failed — returning empty');
          return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
        }
      }
      // Fallback to listing-service when search-service/Elasticsearch is unavailable
      console.warn('ES search failed — falling back to listing-service DB query');
      const listingParams = new URLSearchParams();
      if (params.city) listingParams.set('city', params.city);
      if (params.query) listingParams.set('city', params.query); // text search → city filter fallback
      if (params.size) listingParams.set('size', params.size);
      if (params.page) listingParams.set('page', params.page);
      if (params.type) listingParams.set('type', params.type);
      const minP = params.minPricePaise || params.priceMin;
      const maxP = params.maxPricePaise || params.priceMax;
      if (minP) listingParams.set('minPricePaise', minP);
      if (maxP) listingParams.set('maxPricePaise', maxP);
      return apiFetch<SearchResponse>(
        `/api/v1/listings?${listingParams}`
      );
    }
  },

  autocomplete: (q: string) =>
    apiFetch<string[]>(`/api/v1/search/autocomplete?q=${encodeURIComponent(q)}`),

  locationSuggest: (q: string) =>
    apiFetch<Record<string, import('@/types').LocationSuggestion[]>>(`/api/v1/locations/suggest?q=${encodeURIComponent(q)}`),

  /* ── Listings ─────────────────────────────────────────────── */
  getListing: (id: string) =>
    apiFetch<Listing>(`/api/v1/listings/${id}`),

  getListingMedia: (id: string) =>
    apiFetch<MediaItem[]>(
      `/api/v1/listings/${id}/media`
    ),

  getListingAvailability: (id: string, from: string, to: string) =>
    apiFetch<{ date: string; isAvailable: boolean }[]>(
      `/api/v1/listings/${id}/availability?from=${from}&to=${to}`
    ),

  getRoomTypes: (listingId: string) =>
    apiFetch<RoomType[]>(`/api/v1/listings/${listingId}/room-types`),

  getAvailableRoomTypes: (listingId: string, checkIn: string, checkOut: string) =>
    apiFetch<RoomType[]>(
      `/api/v1/listings/${listingId}/room-types/available?checkIn=${checkIn}&checkOut=${checkOut}`
    ),

  /* ── Auth ─────────────────────────────────────────────────── */
  sendOtp: (phone: string) =>
    apiFetch<void>('/api/v1/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (phone: string, otp: string, name?: string, email?: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, email }),
    }),

  googleSignIn: (idToken: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/google/signin', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  appleSignIn: (identityToken: string, name?: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/apple/signin', {
      method: 'POST',
      body: JSON.stringify({ identityToken, name }),
    }),

  sendWhatsAppOtp: (phone: string) =>
    apiFetch<void>('/api/v1/auth/otp/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  trustDevice: (deviceFingerprint: string, deviceName: string, token: string) =>
    apiFetch<{ status: string }>('/api/v1/auth/device/trust', {
      method: 'POST',
      body: JSON.stringify({ deviceFingerprint, deviceName }),
      headers: { Authorization: `Bearer ${token}`, 'X-User-Id': localStorage.getItem('user_id') || '' },
    }),

  checkTrustedDevice: (deviceFingerprint: string, phone?: string, email?: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/device/check', {
      method: 'POST',
      body: JSON.stringify({ deviceFingerprint, phone, email }),
    }),

  removeTrustedDevice: (deviceFingerprint: string, token: string) =>
    apiFetch<void>('/api/v1/auth/device/trust', {
      method: 'DELETE',
      body: JSON.stringify({ deviceFingerprint }),
      headers: { Authorization: `Bearer ${token}`, 'X-User-Id': localStorage.getItem('user_id') || '' },
    }),

  sendEmailOtp: (email: string) =>
    apiFetch<void>('/api/v1/auth/otp/email/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyEmailOtp: (email: string, otp: string, name?: string, phone?: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/otp/email/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp, name, phone }),
    }),

  checkIdentifierExists: (params: { phone?: string; email?: string }) => {
    const qs = new URLSearchParams();
    if (params.phone) qs.set('phone', params.phone);
    if (params.email) qs.set('email', params.email);
    return apiFetch<{ phone?: boolean; email?: boolean }>(
      `/api/v1/auth/identifier/exists?${qs.toString()}`
    );
  },

  checkAuthMethod: (email: string) =>
    apiFetch<{ exists: boolean; hasPassword: boolean; methods: string[] }>(
      `/api/v1/auth/check-method?email=${encodeURIComponent(email)}`
    ),

  passwordSignIn: (email: string, password: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/password/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  setPassword: (password: string, token: string) =>
    apiFetch<{ status: string }>('/api/v1/auth/password/set', {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: { Authorization: `Bearer ${token}`, 'X-User-Id': localStorage.getItem('user_id') || '' },
    }),

  changePassword: (oldPassword: string, newPassword: string, token: string) =>
    apiFetch<{ status: string }>('/api/v1/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
      headers: { Authorization: `Bearer ${token}`, 'X-User-Id': localStorage.getItem('user_id') || '' },
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  // ── PIN-based quick login ──
  checkPinStatus: (phone?: string, email?: string) =>
    apiFetch<{ hasPin: boolean; pinLocked: boolean }>(`/api/v1/auth/pin/check?${phone ? 'phone=' + encodeURIComponent(phone) : 'email=' + encodeURIComponent(email || '')}`),

  getAuthOptions: (phone?: string, email?: string) =>
    apiFetch<{ otp: boolean; password: boolean; pin: boolean; pinLocked: boolean; exists: boolean }>(
      `/api/v1/auth/auth-options?${phone ? 'phone=' + encodeURIComponent(phone) : ''}${email ? (phone ? '&' : '') + 'email=' + encodeURIComponent(email) : ''}`),

  forgotPin: (phone: string, otp: string, newPin: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/pin/forgot', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, newPin }),
    }),

  pinSignIn: (pin: string, phone?: string, email?: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/pin/signin', {
      method: 'POST',
      body: JSON.stringify({ phone, email, pin }),
    }),

  setPin: (pin: string, token: string) =>
    apiFetch<void>('/api/v1/auth/pin/set', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  changePin: (currentPin: string, newPin: string, token: string) =>
    apiFetch<void>('/api/v1/auth/pin/change', {
      method: 'POST',
      body: JSON.stringify({ currentPin, newPin }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  resetPin: (pin: string, token: string) =>
    apiFetch<void>('/api/v1/auth/pin/reset', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  removePin: (token: string) =>
    apiFetch<void>('/api/v1/auth/pin', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  refreshToken: (refreshToken: string) =>
    apiFetch<AuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  logoutAll: () =>
    apiFetch<void>('/api/v1/auth/logout-all', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: localStorage.getItem('refresh_token') || '' }),
    }),

  /* ── Profile ─────────────────────────────────────────────── */
  getMyProfile: (token: string) =>
    apiFetch<UserProfile>('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateMyProfile: (data: Partial<UserProfile>, token: string) =>
    apiFetch<UserProfile>('/api/v1/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  uploadAvatar: async (file: File, token?: string) => {
    const currentToken = token || localStorage.getItem('access_token') || '';

    // Step 1: Get presigned URL from media-service
    const presignRes = await fetch(`${API_URL}/api/v1/media/upload/avatar-presign?contentType=${encodeURIComponent(file.type)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${currentToken}` },
      credentials: 'include',
    });
    if (!presignRes.ok) {
      throw new Error(`Presign failed (${presignRes.status})`);
    }
    const { uploadUrl, publicUrl } = await presignRes.json();

    // Step 2: Upload directly to S3
    const s3Res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!s3Res.ok) {
      throw new Error(`S3 upload failed (${s3Res.status})`);
    }

    // Step 3: Save S3 URL to user profile
    const saveRes = await fetch(`${API_URL}/api/v1/users/me/avatar-url`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ avatarUrl: publicUrl }),
      credentials: 'include',
    });
    if (!saveRes.ok) {
      throw new Error(`Save avatar URL failed (${saveRes.status})`);
    }
    return { avatarUrl: publicUrl };
  },

  getHostProfile: (hostId: string) =>
    apiFetch<{
      id: string;
      name: string;
      avatarUrl: string;
      bio: string;
      languages: string;
      verificationLevel: string;
      trustScore: number;
      trustBadge: string;
      responseRate: number;
      avgResponseMinutes: number;
      totalHostReviews: number;
      hostType: string;
      selfieVerified: boolean;
      createdAt: string;
      lastActiveAt: string;
    }>(`/api/v1/users/hosts/${hostId}`),

  /* ── Co-Travelers ──────────────────────────────────────────── */
  getCoTravelers: (token: string) =>
    apiFetch<CoTraveler[]>('/api/v1/users/me/co-travelers', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createCoTraveler: (data: { firstName: string; lastName: string; dateOfBirth?: string; gender?: string }, token: string) =>
    apiFetch<CoTraveler>('/api/v1/users/me/co-travelers', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateCoTraveler: (id: string, data: { firstName: string; lastName: string; dateOfBirth?: string; gender?: string }, token: string) =>
    apiFetch<CoTraveler>(`/api/v1/users/me/co-travelers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteCoTraveler: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/users/me/co-travelers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Payment Methods ───────────────────────────────────────── */
  getPaymentMethods: (token: string) =>
    apiFetch<SavedPaymentMethod[]>('/api/v1/users/me/payment-methods', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createPaymentMethod: (data: Partial<SavedPaymentMethod>, token: string) =>
    apiFetch<SavedPaymentMethod>('/api/v1/users/me/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  updatePaymentMethod: (id: string, data: Partial<SavedPaymentMethod>, token: string) =>
    apiFetch<SavedPaymentMethod>(`/api/v1/users/me/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  setDefaultPaymentMethod: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/users/me/payment-methods/${id}/default`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }),

  deletePaymentMethod: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/users/me/payment-methods/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── PG Packages ─────────────────────────────────────────── */
  getPgPackages: (listingId: string) =>
    apiFetch<PgPackage[]>(`/api/v1/listings/${listingId}/packages`),

  createPgPackage: (listingId: string, data: any, token: string) =>
    apiFetch<PgPackage>(`/api/v1/listings/${listingId}/packages`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  updatePgPackage: (listingId: string, packageId: string, data: any, token: string) =>
    apiFetch<PgPackage>(`/api/v1/listings/${listingId}/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  deletePgPackage: (listingId: string, packageId: string, token: string) =>
    apiFetch<void>(`/api/v1/listings/${listingId}/packages/${packageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Bookings ─────────────────────────────────────────────── */
  createBooking: (data: CreateBookingRequest, token: string) =>
    apiFetch<Booking>('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMyBookings: (token: string) =>
    apiFetch<Booking[]>('/api/v1/bookings/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getBooking: (id: string, token: string) =>
    apiFetch<Booking>(`/api/v1/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  cancelBooking: (id: string, reason: string, token: string) =>
    apiFetch<Booking>(`/api/v1/bookings/${id}/cancel?reason=${encodeURIComponent(reason)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ── Booking Guest Management ──────────────────────────────
  getBookingGuests: (bookingId: string, token: string) =>
    apiFetch<any[]>(`/api/v1/bookings/${bookingId}/guests`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addBookingGuest: (bookingId: string, guest: {
    fullName: string; email?: string; phone?: string; age?: number;
    idType?: string; idNumber?: string; roomAssignment?: string; isPrimary?: boolean;
  }, token: string) =>
    apiFetch<any>(`/api/v1/bookings/${bookingId}/guests`, {
      method: 'POST',
      body: JSON.stringify(guest),
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateBookingGuest: (bookingId: string, guestId: string, guest: {
    fullName: string; email?: string; phone?: string; age?: number;
    idType?: string; idNumber?: string; roomAssignment?: string; isPrimary?: boolean;
  }, token: string) =>
    apiFetch<any>(`/api/v1/bookings/${bookingId}/guests/${guestId}`, {
      method: 'PUT',
      body: JSON.stringify(guest),
      headers: { Authorization: `Bearer ${token}` },
    }),

  removeBookingGuest: (bookingId: string, guestId: string, token: string) =>
    apiFetch<void>(`/api/v1/bookings/${bookingId}/guests/${guestId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ── Service Requests (Hotel/Apartment) ──────────────────────────────
  createServiceRequest: (bookingId: string, data: {
    category: string; title: string; description?: string; photoUrls?: string; priority?: string;
  }, token: string) =>
    apiFetch<any>(`/api/v1/bookings/${bookingId}/service-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getServiceRequests: (bookingId: string, token: string, status?: string) =>
    apiFetch<any>(`/api/v1/bookings/${bookingId}/service-requests${status ? '?status=' + status : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getServiceRequest: (bookingId: string, requestId: string, token: string) =>
    apiFetch<any>(`/api/v1/bookings/${bookingId}/service-requests/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  rateServiceRequest: (bookingId: string, requestId: string, rating: number, feedback: string, token: string) =>
    apiFetch<any>(`/api/v1/bookings/${bookingId}/service-requests/${requestId}/rate?rating=${rating}&feedback=${encodeURIComponent(feedback)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  addServiceRequestComment: (bookingId: string, requestId: string, commentText: string, token: string) =>
    apiFetch<any>(`/api/v1/bookings/${bookingId}/service-requests/${requestId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ commentText }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  confirmBooking: (id: string, token: string) =>
    apiFetch<Booking>(`/api/v1/bookings/${id}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Host Bookings ─────────────────────────────────────── */
  getHostBookings: (token: string) =>
    apiFetch<Booking[]>('/api/v1/bookings/host', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  checkInBooking: (id: string, token: string) =>
    apiFetch<Booking>(`/api/v1/bookings/${id}/check-in`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  completeBooking: (id: string, token: string) =>
    apiFetch<Booking>(`/api/v1/bookings/${id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  markNoShow: (id: string, token: string) =>
    apiFetch<Booking>(`/api/v1/bookings/${id}/no-show`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Payments ─────────────────────────────────────────────── */
  createPaymentOrder: (bookingId: string, amountPaise: number, token: string) =>
    apiFetch<PaymentOrder>(
      `/api/v1/payments/order?bookingId=${bookingId}&amountPaise=${amountPaise}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  verifyPayment: (
    data: {
      bookingId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
    token: string
  ) =>
    apiFetch<void>('/api/v1/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Donations (Aashray) ──────────────────────────────────── */
  createDonation: (data: {
    amountPaise: number;
    frequency?: string;
    donorName?: string;
    donorEmail?: string;
    donorPhone?: string;
    donorPan?: string;
    dedicatedTo?: string;
    dedicationMessage?: string;
    campaignCode?: string;
  }, token?: string) =>
    apiFetch<{
      donationRef: string;
      razorpayOrderId: string | null;
      razorpaySubscriptionId: string | null;
      amountPaise: number;
      currency: string;
      razorpayKeyId: string;
      frequency: string;
    }>('/api/v1/donations', {
      method: 'POST',
      body: JSON.stringify(data),
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    }),

  verifyDonation: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }, token?: string) =>
    apiFetch<any>('/api/v1/donations/verify', {
      method: 'POST',
      body: JSON.stringify(data),
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    }),

  getDonationStats: () =>
    apiFetch<{
      totalRaisedPaise: number;
      goalPaise: number;
      totalDonors: number;
      familiesHoused: number;
      monthlyDonors: number;
      progressPercent: number;
      activeCampaign: string | null;
      campaignTagline: string | null;
      recentDonors: { name: string; amountPaise: number; city: string | null; minutesAgo: number }[];
    }>('/api/v1/donations/stats'),

  getDonationLeaderboard: () =>
    apiFetch<{
      topDonors: { name: string; totalPaise: number; donationCount: number; tier: string }[];
      topCities: { city: string; totalPaise: number; donors: number }[];
      period: string;
    }>('/api/v1/donations/leaderboard'),

  getMyDonations: (token: string, page = 0, size = 20) =>
    apiFetch<any>(`/api/v1/donations/my?page=${page}&size=${size}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Reviews ──────────────────────────────────────────────── */
  getListingReviews: async (listingId: string): Promise<Review[]> => {
    const raw = await apiFetch<any>(`/api/v1/reviews/listing/${listingId}?size=50&sort=createdAt,desc`);
    return Array.isArray(raw) ? raw : (raw?.content ?? []);
  },

  getListingReviewStats: (listingId: string): Promise<ReviewStats> =>
    apiFetch<ReviewStats>(`/api/v1/reviews/listing/${listingId}/stats`),

  createReview: (
    data: {
      bookingId: string; rating: number; comment?: string;
      guestPhotoUrls?: string[];
      ratingCleanliness?: number; ratingLocation?: number; ratingValue?: number;
      ratingCommunication?: number; ratingCheckIn?: number; ratingAccuracy?: number;
      ratingStaff?: number; ratingFacilities?: number; ratingComfort?: number; ratingFreeWifi?: number;
      categoryComments?: string;
    },
    token: string
  ) =>
    apiFetch<Review>('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateReview: (reviewId: string, data: { rating?: number; comment?: string }, token: string) =>
    apiFetch<Review>(`/api/v1/reviews/${reviewId}?${new URLSearchParams(
      Object.entries(data).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    )}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteReview: (reviewId: string, token: string) =>
    apiFetch<void>(`/api/v1/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Host review management
  getHostReviews: async (token: string, filter = 'all', page = 0, size = 10): Promise<any> =>
    apiFetch<any>(`/api/v1/reviews/host/me?filter=${filter}&page=${page}&size=${size}&sort=createdAt,desc`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getHostReviewStats: (token: string): Promise<HostReviewStats> =>
    apiFetch<HostReviewStats>('/api/v1/reviews/host/me/stats', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addHostReply: (reviewId: string, reply: string, token: string): Promise<Review> =>
    apiFetch<Review>(`/api/v1/reviews/${reviewId}/reply?reply=${encodeURIComponent(reply)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteHostReply: (reviewId: string, token: string): Promise<void> =>
    apiFetch<void>(`/api/v1/reviews/${reviewId}/reply`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── KYC Document Upload ��─────────────────────────────────── */
  kycPresignUpload: (docType: string, contentType: string, token: string) =>
    apiFetch<{ uploadUrl: string; publicUrl: string; key: string }>(
      `/api/v1/media/upload/kyc-presign?docType=${docType}&contentType=${encodeURIComponent(contentType)}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    ),

  uploadKycDocument: async (file: File, docType: string, token: string): Promise<string> => {
    const { uploadUrl, publicUrl } = await api.kycPresignUpload(docType, file.type, token);
    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    return publicUrl;
  },

  /* ── Media Management ─────────────────────────────────────── */
  presignUpload: (listingId: string, mediaType: string, contentType: string) =>
    apiFetch<{ mediaId: string; uploadUrl: string; s3Key: string; cdnUrl: string }>(
      `/api/v1/media/upload/presign?listingId=${listingId}&mediaType=${encodeURIComponent(mediaType)}&contentType=${encodeURIComponent(contentType)}`,
      { method: 'POST' }
    ),

  confirmUpload: (data: { mediaId: string; listingId: string; s3Key: string; mediaType: string; durationSeconds: number }) =>
    apiFetch<void>(`/api/v1/media/upload/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteMedia: (listingId: string, mediaId: string, token?: string) =>
    apiFetch<void>(`/api/v1/listings/${listingId}/media/${mediaId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  /** Upload a file to S3 via generic presign (for builder projects, sale properties, etc.) */
  uploadGenericFile: async (file: File, folder: string, token: string): Promise<string> => {
    const res = await apiFetch<{ uploadUrl: string; publicUrl: string }>(
      `/api/v1/media/upload/generic-presign?folder=${encodeURIComponent(folder)}&contentType=${encodeURIComponent(file.type)}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    await fetch(res.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    return res.publicUrl;
  },

  reorderMedia: (listingId: string, mediaIds: string[]) =>
    apiFetch<void>(`/api/v1/listings/${listingId}/media/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaIds),
    }),

  updateMediaCategory: (listingId: string, mediaId: string, category: string) =>
    apiFetch<void>(`/api/v1/listings/${listingId}/media/${mediaId}/category?category=${encodeURIComponent(category)}`, {
      method: 'PUT',
    }),

  /* ── Host ─────────────────────────────────────────────────── */
  getMyListings: (token: string) =>
    apiFetch<Listing[]>('/api/v1/listings/mine', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateListing: (id: string, data: any, token: string) =>
    apiFetch<Listing>(`/api/v1/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  submitForVerification: (id: string, token: string) =>
    apiFetch<Listing>(`/api/v1/listings/${id}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  unpublishListing: (id: string, token: string) =>
    apiFetch<Listing>(`/api/v1/listings/${id}/unpublish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  pauseListing: (id: string, token: string) =>
    apiFetch<Listing>(`/api/v1/listings/${id}/pause`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  archiveListing: (id: string, token: string, reason?: string, note?: string) =>
    apiFetch<Listing>(`/api/v1/listings/${id}/archive?${new URLSearchParams({
      ...(reason ? { reason } : {}),
      ...(note ? { note } : {}),
    })}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  restoreListing: (id: string, token: string) =>
    apiFetch<Listing>(`/api/v1/listings/${id}/restore`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleAashray: (id: string, body: { aashrayReady: boolean; aashrayDiscountPercent?: number; longTermMonthlyPaise?: number; minStayDays?: number }, token: string) =>
    apiFetch<Listing>(`/api/v1/listings/${id}/aashray`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token}` },
    }),

  registerNgoOrganization: (data: { name: string; type: string; unhcrPartnerCode?: string | null; contactEmail: string; contactPhone?: string | null; budgetPaise: number }, token: string) =>
    apiFetch<any>(`/api/v1/aashray/organizations`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Host KYC ─────────────────────────────────────────────── */
  getKyc: (token: string) =>
    apiFetch<any>('/api/v1/users/me/kyc', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateKycIdentity: (data: any, token: string) =>
    apiFetch<any>('/api/v1/users/me/kyc/identity', {
      method: 'PUT', body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateKycAddress: (data: any, token: string) =>
    apiFetch<any>('/api/v1/users/me/kyc/address', {
      method: 'PUT', body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateKycBank: (data: any, token: string) =>
    apiFetch<any>('/api/v1/users/me/kyc/bank', {
      method: 'PUT', body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateKycBusiness: (data: any, token: string) =>
    apiFetch<any>('/api/v1/users/me/kyc/business', {
      method: 'PUT', body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateKycDocuments: (data: { aadhaarFrontUrl?: string; aadhaarBackUrl?: string; panUrl?: string; selfieUrl?: string }, token: string) =>
    apiFetch<any>('/api/v1/users/me/kyc/documents', {
      method: 'PUT', body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  submitKyc: (token: string) =>
    apiFetch<any>('/api/v1/users/me/kyc/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Miles ────────────────────────────────────────────────── */
  getMilesBalance: (token: string) =>
    apiFetch<MilesBalance>('/api/v1/miles/balance', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMilesHistory: (token: string, page = 0) =>
    apiFetch<MilesHistoryResponse>(
      `/api/v1/miles/history?page=${page}&size=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  redeemMiles: (bookingId: string, miles: number, token: string) =>
    apiFetch<void>('/api/v1/miles/redeem', {
      method: 'POST',
      body: JSON.stringify({ bookingId, miles }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Experiences ──────────────────────────────────────────── */
  getExperiences: async (params?: { city?: string; category?: string }) => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.category) qs.set('category', params.category);
    const query = qs.toString();
    const page = await apiFetch<{ content: Experience[] }>(
      `/api/v1/experiences${query ? `?${query}` : ''}`
    );
    return page?.content ?? [];
  },

  getExperience: (id: string) =>
    apiFetch<Experience>(`/api/v1/experiences/${id}`),

  getExperienceReviews: (experienceId: string, page = 0, size = 10) =>
    apiFetch<{ content: Review[]; totalElements: number }>(
      `/api/v1/reviews/experience/${experienceId}?page=${page}&size=${size}`
    ),

  getExperienceReviewStats: (experienceId: string) =>
    apiFetch<ReviewStats>(`/api/v1/reviews/experience/${experienceId}/stats`),

  createExperienceReview: (data: {
    experienceBookingId: string;
    experienceId: string;
    hostId: string;
    rating: number;
    comment?: string;
  }) => apiFetch<Review>('/api/v1/reviews/experience', { method: 'POST', body: JSON.stringify(data) }),

  bookExperience: (data: { sessionId?: string; experienceId: string; numGuests: number; propertyBookingId?: string; requestedDate?: string }) =>
    apiFetch('/api/v1/experience-bookings', { method: 'POST', body: JSON.stringify(data) }),

  getMyExperienceBookings: () =>
    apiFetch<any[]>('/api/v1/experience-bookings'),

  getHostExperiences: () =>
    apiFetch<Experience[]>('/api/v1/experiences/host'),

  createExperience: (data: any) =>
    apiFetch<Experience>('/api/v1/experiences', { method: 'POST', body: JSON.stringify(data) }),

  updateExperience: (id: string, data: any) =>
    apiFetch<Experience>(`/api/v1/experiences/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  updateExperienceStatus: (id: string, status: string) =>
    apiFetch<Experience>(`/api/v1/experiences/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  addExperienceSession: (experienceId: string, data: { sessionDate: string; startTime: string; endTime: string; availableSpots: number }) =>
    apiFetch(`/api/v1/experiences/${experienceId}/sessions`, { method: 'POST', body: JSON.stringify(data) }),

  /* ── Medical Tourism ──────────────────────────────────────── */
  getMedicalStaySearch: (params?: { city?: string; specialty?: string }) => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.specialty) qs.set('specialty', params.specialty);
    const query = qs.toString();
    return apiFetch<MedicalStayPackage[]>(
      `/api/v1/medical-stay/search${query ? `?${query}` : ''}`
    );
  },

  getHospitals: async () => {
    const res = await apiFetch<{ content: Hospital[] }>('/api/v1/medical-stay/hospitals?size=100');
    return Array.isArray(res) ? res : res?.content ?? [];
  },

  /* ── Nomad Network ────────────────────────────────────────── */
  getNomadFeed: (city: string, category?: string) => {
    const qs = new URLSearchParams({ city });
    if (category) qs.set('category', category);
    return apiFetch<NomadPost[]>(`/api/v1/nomad/feed?${qs}`);
  },

  createNomadPost: (
    data: { title: string; body: string; category: string; city: string },
    token: string
  ) =>
    apiFetch<NomadPost>('/api/v1/nomad/posts', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getNomadPostComments: (postId: string) =>
    apiFetch<NomadComment[]>(`/api/v1/nomad/posts/${postId}/comments`),

  addComment: (postId: string, body: string, token: string) =>
    apiFetch<NomadComment>(`/api/v1/nomad/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Bucket List ──────────────────────────────────────────── */
  getBucketList: (token: string) =>
    apiFetch<BucketListItem[]>('/api/v1/bucket-list', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addToBucketList: (listingId: string, token: string) =>
    apiFetch<BucketListItem>(`/api/v1/bucket-list/${listingId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  removeFromBucketList: (listingId: string, token: string) =>
    apiFetch<void>(`/api/v1/bucket-list/${listingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Host Subscription ──────────────────────────────────────── */
  getSubscription: (token: string) =>
    apiFetch<HostSubscription>('/api/v1/users/me/subscription', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  startTrial: (tier: SubscriptionTier, token: string) =>
    apiFetch<HostSubscription>(`/api/v1/users/me/subscription/trial?tier=${tier}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  upgradeSubscription: (tier: SubscriptionTier, token: string) =>
    apiFetch<HostSubscription>(`/api/v1/users/me/subscription/upgrade?tier=${tier}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  activateSubscription: (tier: SubscriptionTier, token: string) =>
    apiFetch<ActivateSubscriptionResponse>(`/api/v1/users/me/subscription/activate?tier=${tier}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Room Type Management ─────────────────────────────────────── */
  createRoomType: (listingId: string, data: any, token: string) =>
    apiFetch<RoomType>(`/api/v1/listings/${listingId}/room-types`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateRoomType: (listingId: string, roomTypeId: string, data: any, token: string) =>
    apiFetch<RoomType>(`/api/v1/listings/${listingId}/room-types/${roomTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteRoomType: (listingId: string, roomTypeId: string, token: string) =>
    apiFetch<void>(`/api/v1/listings/${listingId}/room-types/${roomTypeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateRoomTypePhotos: (listingId: string, roomTypeId: string, data: { primaryPhotoUrl?: string; photoUrls?: string[] }, token: string) =>
    apiFetch<RoomType>(`/api/v1/listings/${listingId}/room-types/${roomTypeId}/photos`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Room Type Inclusions & Perks ────────────────────────────── */
  getRoomTypeInclusions: (listingId: string, roomTypeId: string) =>
    apiFetch<RoomTypeInclusion[]>(`/api/v1/listings/${listingId}/room-types/${roomTypeId}/inclusions`),

  createRoomTypeInclusion: (listingId: string, roomTypeId: string, data: any, token: string) =>
    apiFetch<RoomTypeInclusion>(`/api/v1/listings/${listingId}/room-types/${roomTypeId}/inclusions`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateRoomTypeInclusion: (listingId: string, roomTypeId: string, inclusionId: string, data: any, token: string) =>
    apiFetch<RoomTypeInclusion>(`/api/v1/listings/${listingId}/room-types/${roomTypeId}/inclusions/${inclusionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteRoomTypeInclusion: (listingId: string, roomTypeId: string, inclusionId: string, token: string) =>
    apiFetch<void>(`/api/v1/listings/${listingId}/room-types/${roomTypeId}/inclusions/${inclusionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  bulkReplaceRoomTypeInclusions: (listingId: string, roomTypeId: string, data: any[], token: string) =>
    apiFetch<RoomTypeInclusion[]>(`/api/v1/listings/${listingId}/room-types/${roomTypeId}/inclusions/bulk`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Host Calendar / Availability ──────────────────────────────── */
  getAvailabilityMonth: (listingId: string, year: number, month: number, token: string) =>
    apiFetch<AvailabilityDayDto[]>(
      `/api/v1/listings/${listingId}/availability/month?year=${year}&month=${month}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  bulkUpdateAvailability: (listingId: string, data: BulkAvailabilityRequest, token: string) =>
    apiFetch<AvailabilityResponse[]>(`/api/v1/listings/${listingId}/availability/bulk`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Host Earnings & Invoices ───────────────────────────────── */
  getGstInvoices: (token: string) =>
    apiFetch<any[]>('/api/v1/host/gst-invoices', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTdsReport: (year: number, quarter: number, token: string) =>
    apiFetch<any>(`/api/v1/host/tds-report?year=${year}&quarter=${quarter}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPnl: (year: number, token: string) =>
    apiFetch<any>(`/api/v1/host/pnl?year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSubscriptionInvoices: (token: string) =>
    apiFetch<any[]>('/api/v1/payments/invoices', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getHostExpenses: (year: number, token: string) =>
    apiFetch<any[]>(`/api/v1/host/expenses?year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Occupancy Report ──────────────────────────────────────── */
  getOccupancyReport: (from: string, to: string, token: string) =>
    apiFetch<OccupancyReport>(`/api/v1/bookings/host/occupancy?from=${from}&to=${to}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── iCal Feeds ────────────────────────────────────────────── */
  getICalFeeds: (listingId: string, token: string) =>
    apiFetch<ICalFeed[]>(`/api/v1/listings/${listingId}/ical/feeds`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addICalFeed: (listingId: string, data: { feedUrl: string; feedName: string }, token: string) =>
    apiFetch<ICalFeed>(`/api/v1/listings/${listingId}/ical/feeds`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  exportICal: (listingId: string, token: string) =>
    apiFetch<string>(`/api/v1/listings/${listingId}/ical/export`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/calendar' },
    }),

  syncICalFeed: (listingId: string, feedId: string, token: string) =>
    apiFetch<{ status: string }>(`/api/v1/listings/${listingId}/ical/feeds/${feedId}/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteICalFeed: (listingId: string, feedId: string, token: string) =>
    apiFetch<void>(`/api/v1/listings/${listingId}/ical/feeds/${feedId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Pricing Rules ─────────────────────────────────────────── */
  getPricingRules: (listingId: string, token: string) =>
    apiFetch<PricingRule[]>(`/api/v1/listings/${listingId}/pricing-rules`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createPricingRule: (listingId: string, data: any, token: string) =>
    apiFetch<PricingRule>(`/api/v1/listings/${listingId}/pricing-rules`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  deletePricingRule: (listingId: string, ruleId: string, token: string) =>
    apiFetch<void>(`/api/v1/listings/${listingId}/pricing-rules/${ruleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  previewPricingRule: (listingId: string, date: string, token: string) =>
    apiFetch<{ date: string; basePricePaise: number; effectivePricePaise: number; rulesApplied: string[] }>(
      `/api/v1/listings/${listingId}/pricing-rules/preview?date=${date}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  /* ── Commission Rate ─────────────────────────────────────── */
  getCommissionRate: (token: string, tier?: string) =>
    apiFetch<{ tier: string; commissionRate: number; commissionPercent: number }>(
      `/api/v1/payments/commission-rate${tier ? `?tier=${tier}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  /* ── Messaging ──────────────────────────────────────────── */
  sendMessage: (data: {
    listingId: string; recipientId: string; bookingId?: string; content: string;
    messageType?: string; attachmentUrl?: string; attachmentName?: string;
    attachmentSize?: number; attachmentType?: string;
    latitude?: number; longitude?: number; locationLabel?: string;
  }, token: string) =>
    apiFetch<ChatMessage>('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  uploadChatAttachment: async (file: File): Promise<{ attachmentUrl: string; fileName: string; fileSize: number; mimeType: string }> => {
    const contentType = file.type || 'application/octet-stream';
    const fileName = file.name || 'file';
    // Step 1: Get presigned URL from media-service
    const { uploadUrl, publicUrl } = await apiFetch<{ uploadUrl: string; publicUrl: string }>(
      `/api/v1/media/upload/chat-presign?contentType=${encodeURIComponent(contentType)}&fileName=${encodeURIComponent(fileName)}`,
      { method: 'POST' }
    );
    // Step 2: Upload directly to S3
    await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
    // Step 3: Return metadata
    return { attachmentUrl: publicUrl, fileName, fileSize: file.size, mimeType: contentType };
  },

  getConversations: (token: string) =>
    apiFetch<Conversation[]>('/api/v1/messages/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMessages: (conversationId: string, token: string, page = 0) =>
    apiFetch<{ content: ChatMessage[]; totalPages: number; number: number }>(
      `/api/v1/messages/conversations/${conversationId}?page=${page}&size=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  markAsRead: (conversationId: string, token: string) =>
    apiFetch<void>(`/api/v1/messages/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getUnreadCount: (token: string) =>
    apiFetch<{ count: number }>('/api/v1/messages/unread-count', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getQuickReplies: (token: string) =>
    apiFetch<QuickReplyTemplate[]>('/api/v1/messages/quick-replies', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createQuickReply: (content: string, token: string) =>
    apiFetch<QuickReplyTemplate>('/api/v1/messages/quick-replies', {
      method: 'POST',
      body: JSON.stringify({ content }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteQuickReply: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/messages/quick-replies/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ──────────────────────────────────────────
  // AI Pricing
  // ──────────────────────────────────────────
  aiPricingSuggest: (listingId: string, basePricePaise: number, city: string, propertyType: string, targetDate: string) =>
    apiFetch<any>(`/api/v1/ai/pricing/suggest?listing_id=${listingId}&base_price_paise=${basePricePaise}&city=${city}&property_type=${propertyType}&target_date=${targetDate}`, {
      method: 'POST',
    }),

  aiPricingCalendar: (listingId: string, basePricePaise: number, city: string, propertyType: string) =>
    apiFetch<any>(`/api/v1/ai/pricing/calendar/${listingId}?base_price_paise=${basePricePaise}&city=${city}&property_type=${propertyType}`),

  aiPricingRules: (rule: any) =>
    apiFetch<any>('/api/v1/ai/pricing/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    }),

  aiPricingAnalytics: (listingId: string, basePricePaise: number, city: string) =>
    apiFetch<any>(`/api/v1/ai/pricing/analytics/${listingId}?base_price_paise=${basePricePaise}&city=${city}`),

  // AI Messaging
  aiMessageTemplate: (templateType: string, language: string, params: Record<string, string>) =>
    apiFetch<any>('/api/v1/ai/messaging/template', {
      method: 'POST',
      body: JSON.stringify({ template_type: templateType, language, params }),
    }),

  aiReplySuggest: (messages: any[], listingContext: Record<string, string>) =>
    apiFetch<any>('/api/v1/ai/messaging/reply-suggest', {
      method: 'POST',
      body: JSON.stringify({ messages, listing_context: listingContext }),
    }),

  aiAutoResponse: (query: string, listingContext: Record<string, string>) =>
    apiFetch<any>('/api/v1/ai/messaging/auto-response', {
      method: 'POST',
      body: JSON.stringify({ query, listing_context: listingContext }),
    }),

  // AI Calendar
  aiCalendarOptimize: (data: any) =>
    apiFetch<any>('/api/v1/ai/calendar/optimize', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  aiCalendarInsights: (listingId: string, basePricePaise: number, city: string) =>
    apiFetch<any>(`/api/v1/ai/calendar/insights/${listingId}?base_price_paise=${basePricePaise}&city=${city}`),

  // ──────────────────────────────────────────
  // Aashray Cases
  // ──────────────────────────────────────────
  createAashrayCase: (data: any, token: string) =>
    apiFetch<any>('/api/v1/aashray/cases', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAashrayCases: (params: string, token: string) =>
    apiFetch<any>(`/api/v1/aashray/cases?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAashrayCase: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/aashray/cases/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  matchAashrayCase: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/aashray/cases/${id}/match`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  assignAashrayCase: (caseId: string, listingId: string, token: string) =>
    apiFetch<any>(`/api/v1/aashray/cases/${caseId}/assign?listingId=${listingId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAashrayStats: (token: string) =>
    apiFetch<any>('/api/v1/aashray/cases/stats', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ──────────────────────────────────────────
  // Channel Manager
  // ──────────────────────────────────────────
  connectChannelManager: (listingId: string, token: string) =>
    apiFetch<any>(`/api/v1/channel-manager/connect/${listingId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  disconnectChannelManager: (listingId: string, token: string) =>
    apiFetch<void>(`/api/v1/channel-manager/disconnect/${listingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  syncChannelRates: (listingId: string, token: string) =>
    apiFetch<any>(`/api/v1/channel-manager/sync/rates/${listingId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  syncChannelAvailability: (listingId: string, token: string) =>
    apiFetch<any>(`/api/v1/channel-manager/sync/availability/${listingId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  pullChannelBookings: (listingId: string, token: string) =>
    apiFetch<any>(`/api/v1/channel-manager/sync/pull-bookings/${listingId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getChannelStatus: (listingId: string, token: string) =>
    apiFetch<any>(`/api/v1/channel-manager/status/${listingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getChannelSyncLogs: (listingId: string, token: string) =>
    apiFetch<any>(`/api/v1/channel-manager/logs/${listingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAvailableChannels: () =>
    apiFetch<string[]>('/api/v1/channel-manager/channels'),

  createChannelMapping: (data: any, token: string) =>
    apiFetch<any>('/api/v1/channel-manager/mappings', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ──────────────────────────────────────────
  // PG Tenancy
  // ──────────────────────────────────────────
  createPgTenancy: (data: any, token: string) =>
    apiFetch<any>('/api/v1/pg-tenancies', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPgTenancies: (params: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPgTenancy: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  giveTenancyNotice: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${id}/notice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  vacateTenancy: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${id}/vacate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTenancyInvoices: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getOverdueInvoices: (token: string) =>
    apiFetch<any>('/api/v1/pg-tenancies/invoices/overdue', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  markInvoicePaid: (invoiceId: string, paymentId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/invoices/${invoiceId}/pay?razorpayPaymentId=${paymentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  updatePenaltyConfig: (tenancyId: string, params: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/penalty-config?${params}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // PG Agreement
  createPgAgreement: (tenancyId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/agreement`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  getAgreement: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/agreement`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  hostSignAgreement: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/agreement/host-sign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  tenantSignAgreement: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/agreement/tenant-sign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  tenantGiveNotice: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/tenant-notice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  getAgreementText: (tenancyId: string, token: string) =>
    apiFetch<string>(`/api/v1/pg-tenancies/${tenancyId}/agreement/text`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  viewAgreementHtml: async (tenancyId: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/v1/pg-tenancies/${tenancyId}/agreement/view`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load agreement');
    const html = await res.text();
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  },
  downloadAgreementPdf: async (tenancyId: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/v1/pg-tenancies/${tenancyId}/agreement/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to download PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Safar-Agreement-${tenancyId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // PG Settlement
  initiateSettlement: (tenancyId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  getSettlement: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  addSettlementDeduction: (tenancyId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/deductions`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  removeSettlementDeduction: (tenancyId: string, deductionId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/deductions/${deductionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
  completeInspection: (tenancyId: string, notes: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/inspection`, {
      method: 'POST',
      body: JSON.stringify({ inspectionNotes: notes }),
      headers: { Authorization: `Bearer ${token}` },
    }),
  approveSettlement: (tenancyId: string, role: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'X-User-Role': role },
    }),
  processSettlementRefund: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/process-refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  markSettled: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/mark-settled`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Utility Readings
  recordUtilityReading: (tenancyId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/utility-readings`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  getUtilityReadings: (tenancyId: string, token: string, type?: string) =>
    apiFetch<any[]>(`/api/v1/pg-tenancies/${tenancyId}/utility-readings${type ? `?utilityType=${type}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getUnbilledUtilities: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/utility-readings/unbilled`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Maintenance Requests
  createMaintenanceRequest: (tenancyId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  getMaintenanceRequests: (tenancyId: string, token: string, status?: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/maintenance${status ? `?status=${status}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateMaintenanceRequest: (tenancyId: string, requestId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/maintenance/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  rateMaintenanceRequest: (tenancyId: string, requestId: string, rating: number, feedback: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/maintenance/${requestId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Ticket enhancements (Zolo-style)
  reopenTicket: (tenancyId: string, requestId: string, reason: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/maintenance/${requestId}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { Authorization: `Bearer ${token}` },
    }),
  closeTicket: (tenancyId: string, requestId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/maintenance/${requestId}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  getTicketComments: (tenancyId: string, requestId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/maintenance/${requestId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  addTicketComment: (tenancyId: string, requestId: string, data: { commentText: string }, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/maintenance/${requestId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Host ticket management
  getListingTickets: (listingId: string, params: { status?: string; priority?: string; category?: string; page?: number }, token: string) =>
    apiFetch<any>(`/api/v1/listings/${listingId}/tickets?${new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    ).toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getTicketStats: (listingId: string, token: string) =>
    apiFetch<any>(`/api/v1/listings/${listingId}/tickets/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateListingTicket: (listingId: string, requestId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/listings/${listingId}/tickets/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  addHostTicketComment: (listingId: string, requestId: string, data: { commentText: string }, token: string) =>
    apiFetch<any>(`/api/v1/listings/${listingId}/tickets/${requestId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Settlement enhancements
  addChecklistItem: (tenancyId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/checklist`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  getChecklist: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/checklist`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  disputeDeduction: (tenancyId: string, deductionId: string, reason: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/deductions/${deductionId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { Authorization: `Bearer ${token}` },
    }),
  disputeSettlement: (tenancyId: string, reason: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { Authorization: `Bearer ${token}` },
    }),
  saveBankDetails: (tenancyId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/bank-details`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),
  getSettlementTimeline: (tenancyId: string, token: string) =>
    apiFetch<any>(`/api/v1/pg-tenancies/${tenancyId}/settlement/timeline`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Tenant Dashboard
  getTenantDashboard: (token: string) =>
    apiFetch<any>('/api/v1/pg-tenancies/my-dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createTenancySubscription: (tenancyId: string, amountPaise: number, tenancyRef: string, token: string) => {
    // Decode JWT to pull tenantId (sub); payment-service endpoint needs it alongside the tenancyId.
    let tenantId = '';
    try { tenantId = JSON.parse(atob(token.split('.')[1] || '')).sub || ''; } catch { /* noop */ }
    return apiFetch<{ shortUrl?: string; razorpaySubscriptionId?: string; status?: string }>(
      `/api/v1/payments/tenancy/${tenancyId}/subscription`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, amountPaise, tenancyRef }),
      }
    );
  },

  // Host Payouts
  getHostPayouts: (hostId: string, token: string) =>
    apiFetch<any>(`/api/v1/payments/host-payouts?hostId=${hostId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getHostPayoutSummary: (hostId: string, month: number, year: number, token: string) =>
    apiFetch<any>(`/api/v1/payments/host-payouts/summary?hostId=${hostId}&month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ──────────────────────────────────────────
  // Seeker Profiles (Reverse Search)
  // ──────────────────────────────────────────
  createSeekerProfile: (data: any, token: string) =>
    apiFetch<any>('/api/v1/seekers', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSeekerProfiles: (params: string) =>
    apiFetch<any>(`/api/v1/seekers?${params}`),

  getSeekerProfile: (id: string) =>
    apiFetch<any>(`/api/v1/seekers/${id}`),

  updateSeekerProfile: (id: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/seekers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteSeekerProfile: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/seekers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSeekerMatches: (seekerId: string) =>
    apiFetch<any>(`/api/v1/seekers/${seekerId}/matches`),

  getSeekersForListing: (listingId: string, token: string) =>
    apiFetch<any>(`/api/v1/seekers/for-listing/${listingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ──────────────────────────────────────────
  // Localities (Polygon Search)
  // ──────────────────────────────────────────
  getLocalities: (city?: string) =>
    apiFetch<any>(`/api/v1/localities${city ? `?city=${city}` : ''}`),

  getLocalityPolygon: (id: string) =>
    apiFetch<any>(`/api/v1/localities/${id}`),

  getLocalitiesByCity: (city: string) =>
    apiFetch<any>(`/api/v1/locations/city/${city}`),

  getLocalityByName: (name: string, city: string) =>
    apiFetch<any>(`/api/v1/localities/by-name?name=${name}&city=${city}`),

  importLocality: (name: string, city: string, token: string) =>
    apiFetch<any>(`/api/v1/localities/import?name=${name}&city=${city}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ──────────────────────────────────────────
  // Sale Properties (Buy/Sell Marketplace)

  searchSaleProperties: (params: Record<string, any>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        if (Array.isArray(v)) v.forEach(item => qs.append(k, String(item)));
        else qs.set(k, String(v));
      }
    });
    return apiFetch<any>(`/api/v1/search/sale-properties?${qs.toString()}`);
  },

  autocompleteSaleProperties: (q: string) =>
    apiFetch<any[]>(`/api/v1/search/sale-properties/autocomplete?q=${encodeURIComponent(q)}`),

  getSaleProperty: (id: string) =>
    apiFetch<any>(`/api/v1/sale-properties/${id}`),

  getSellerContact: (propertyId: string) =>
    apiFetch<{ name: string; phone: string; email: string }>(`/api/v1/sale-properties/${propertyId}/contact`),

  createSaleProperty: (data: object, token: string) =>
    apiFetch<any>('/api/v1/sale-properties', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  updateSaleProperty: (id: string, data: object, token: string) =>
    apiFetch<any>(`/api/v1/sale-properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  updateSalePropertyStatus: (id: string, status: string, token: string) =>
    apiFetch<any>(`/api/v1/sale-properties/${id}/status?status=${status}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSellerSaleProperties: (token: string, status?: string) =>
    apiFetch<any>(`/api/v1/sale-properties/seller${status ? '?status=' + status : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteSaleProperty: (id: string, token: string) =>
    apiFetch<void>(`/api/v1/sale-properties/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSimilarSaleProperties: (id: string) =>
    apiFetch<any[]>(`/api/v1/sale-properties/${id}/similar`),

  salePropertyAutocomplete: (q: string) =>
    apiFetch<any[]>(`/api/v1/search/sale-properties/autocomplete?q=${encodeURIComponent(q)}`),

  getRecentSaleProperties: (city: string, limit?: number) =>
    apiFetch<any[]>(`/api/v1/search/sale-properties/recent?city=${city}&limit=${limit ?? 10}`),

  // Inquiries
  createInquiry: (data: object, token: string) =>
    apiFetch<any>('/api/v1/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  initiateInquiryPayment: (inquiryId: string, token: string) =>
    apiFetch<any>(`/api/v1/inquiries/${inquiryId}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  confirmInquiryPayment: (inquiryId: string, razorpayPaymentId: string, razorpaySignature: string, token: string) =>
    apiFetch<any>(`/api/v1/inquiries/${inquiryId}/confirm-payment?razorpayPaymentId=${razorpayPaymentId}&razorpaySignature=${razorpaySignature}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  refundInquiryToken: (inquiryId: string, token: string) =>
    apiFetch<any>(`/api/v1/inquiries/${inquiryId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getBuyerInquiries: (token: string) =>
    apiFetch<any>('/api/v1/inquiries/buyer', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSellerInquiries: (token: string) =>
    apiFetch<any>('/api/v1/inquiries/seller', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateInquiryStatus: (id: string, status: string, token: string) =>
    apiFetch<any>(`/api/v1/inquiries/${id}/status?status=${status}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Site Visits
  scheduleSiteVisit: (data: object, token: string) =>
    apiFetch<any>('/api/v1/site-visits', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  getBuyerSiteVisits: (token: string) =>
    apiFetch<any>('/api/v1/site-visits/buyer', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSellerSiteVisits: (token: string) =>
    apiFetch<any>('/api/v1/site-visits/seller', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateVisitStatus: (id: string, status: string, token: string) =>
    apiFetch<any>(`/api/v1/site-visits/${id}/status?status=${status}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  addVisitFeedback: (id: string, feedback: string, rating: number | null, token: string) =>
    apiFetch<any>(`/api/v1/site-visits/${id}/feedback?feedback=${encodeURIComponent(feedback)}${rating ? '&rating=' + rating : ''}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Buyer Profile
  saveBuyerProfile: (data: object, token: string) =>
    apiFetch<any>('/api/v1/buyer-profile', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  getBuyerProfile: (token: string) =>
    apiFetch<any>('/api/v1/buyer-profile', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getBuyerRecommendations: (token: string) =>
    apiFetch<any[]>('/api/v1/buyer-profile/recommendations', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Locality Trends
  getLocalityTrends: (city: string, locality: string) =>
    apiFetch<any[]>(`/api/v1/locality-trends?city=${city}&locality=${locality}`),

  getCityLocalityPrices: (city: string) =>
    apiFetch<any[]>(`/api/v1/locality-trends/city?city=${city}`),

  // Admin Sale Properties
  adminListSaleProperties: (token: string, status?: string) =>
    apiFetch<any>(`/api/v1/sale-properties/admin/list${status ? '?status=' + status : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminVerifySaleProperty: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/sale-properties/${id}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminVerifyRera: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/sale-properties/${id}/verify-rera`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminSuspendSaleProperty: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/sale-properties/${id}/suspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ── Safar Cooks ────────────────────────────────────────────────────────
  searchChefs: (params: Record<string, string>) =>
    apiFetch<any>(`/api/v1/chefs/search?${new URLSearchParams(params)}`),

  getChef: (chefId: string) =>
    apiFetch<any>(`/api/v1/chefs/${chefId}`),

  getChefMenus: (chefId: string) =>
    apiFetch<any[]>(`/api/v1/chefs/${chefId}/menus`),

  getMenuItems: (menuId: string) =>
    apiFetch<any[]>(`/api/v1/chefs/menus/${menuId}/items`),

  getMenuItemIngredients: (menuItemId: string) =>
    apiFetch<any[]>(`/api/v1/chefs/menu-items/${menuItemId}/ingredients`),

  getShoppingList: (menuId: string, guests: number) =>
    apiFetch<any>(`/api/v1/chefs/menus/${menuId}/shopping-list?guests=${guests}`),

  // ── Dish Catalog (public) ────────────────────────────────────────────
  getDishCatalog: (category?: string) =>
    apiFetch<any>(`/api/v1/dishes${category ? `?category=${category}` : ''}`),

  matchChefsForDishes: (dishIds: string[]) =>
    apiFetch<any[]>('/api/v1/dishes/match-chefs', {
      method: 'POST',
      body: JSON.stringify({ dishIds }),
    }),

  getChefDishOfferings: (chefId: string) =>
    apiFetch<any[]>(`/api/v1/chefs/${chefId}/dish-offerings`),

  addChefDishOfferings: (chefId: string, dishIds: string[], token: string) =>
    apiFetch<any[]>(`/api/v1/chefs/${chefId}/dish-offerings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dishIds }),
    }),

  getMyChefProfile: (token: string) =>
    apiFetch<any>('/api/v1/chefs/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  registerChef: (data: any, token: string) =>
    apiFetch<any>('/api/v1/chefs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  bookChef: (data: any, token: string) =>
    apiFetch<any>('/api/v1/chef-bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getMyChefBookings: (token: string) =>
    apiFetch<any[]>('/api/v1/chef-bookings/my', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createChefSubscription: (data: any, token: string) =>
    apiFetch<any>('/api/v1/chef-subscriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getMyChefSubscriptions: (token: string) =>
    apiFetch<any[]>('/api/v1/chef-subscriptions/my', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createEventBooking: (data: any, token?: string) =>
    apiFetch<any>('/api/v1/chef-events', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),

  getMyEventBookings: (token: string) =>
    apiFetch<any[]>('/api/v1/chef-events/my', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  cancelChefBooking: (id: string, reason: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${id}/cancel?reason=${encodeURIComponent(reason)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  rateChefBooking: (id: string, rating: number, comment: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${id}/rate?rating=${rating}&comment=${encodeURIComponent(comment)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  rateEventBooking: (id: string, rating: number, comment: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-events/${id}/rate?rating=${rating}&comment=${encodeURIComponent(comment)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getChefReviews: (chefId: string) =>
    apiFetch<any[]>(`/api/v1/chefs/${chefId}/reviews`),

  confirmChefBookingPayment: (id: string, razorpayOrderId: string, razorpayPaymentId: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${id}/confirm-payment?razorpayOrderId=${encodeURIComponent(razorpayOrderId)}&razorpayPaymentId=${encodeURIComponent(razorpayPaymentId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  payChefBookingBalance: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${id}/pay-balance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  payEventBookingBalance: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-events/${id}/pay-balance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getChefBookingById: (id: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${id}`),

  getEventBookingById: (id: string) =>
    apiFetch<any>(`/api/v1/chef-events/${id}`),

  modifyChefBooking: (id: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  modifyEventBooking: (id: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/chef-events/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  modifySubscription: (id: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/chef-subscriptions/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // ── Chef Dashboard (chef-side views) ────────────────────
  getChefIncomingBookings: (token: string) =>
    apiFetch<any[]>('/api/v1/chef-bookings/chef', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getChefIncomingEvents: (token: string) =>
    apiFetch<any[]>('/api/v1/chef-events/chef', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getChefIncomingSubscriptions: (token: string) =>
    apiFetch<any[]>('/api/v1/chef-subscriptions/chef', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateChefProfile: (data: any, token: string) =>
    apiFetch<any>('/api/v1/chefs/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  claimChefProfile: (token: string) =>
    apiFetch<any>('/api/v1/chefs/claim', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleChefAvailability: (token: string) =>
    apiFetch<any>('/api/v1/chefs/me/availability', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }),

  confirmChefBooking: (bookingId: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${bookingId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  completeChefBooking: (bookingId: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${bookingId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  quoteEvent: (eventId: string, totalAmountPaise: number, token: string) =>
    apiFetch<any>(`/api/v1/chef-events/${eventId}/quote?totalAmountPaise=${totalAmountPaise}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  confirmEvent: (eventId: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-events/${eventId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  markEventAdvancePaid: (eventId: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-events/${eventId}/advance-paid`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  cancelEvent: (eventId: string, reason: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-events/${eventId}/cancel?reason=${encodeURIComponent(reason)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  completeEvent: (eventId: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-events/${eventId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ── Chef Calendar / Availability ─────────────────────────
  getChefCalendar: (chefId: string, from: string, to: string) =>
    apiFetch<any>(`/api/v1/chefs/availability/${chefId}/calendar?from=${from}&to=${to}`),

  blockDate: (date: string, reason: string, token: string) =>
    apiFetch<any>(`/api/v1/chefs/availability/block?date=${date}&reason=${encodeURIComponent(reason)}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }),

  unblockDate: (date: string, token: string) =>
    apiFetch<any>(`/api/v1/chefs/availability/unblock?date=${date}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    }),

  bulkBlockDates: (dates: string[], reason: string, token: string) =>
    apiFetch<any>('/api/v1/chefs/availability/block-bulk', {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dates, reason }),
    }),

  // ── Chef Photo Gallery ─────────────────────────────────
  getChefPhotos: (chefId: string) =>
    apiFetch<any[]>(`/api/v1/chefs/photos/${chefId}`),

  addChefPhoto: (url: string, caption: string, photoType: string, token: string, mediaType: string = 'IMAGE') =>
    apiFetch<any>(`/api/v1/chefs/photos?url=${encodeURIComponent(url)}&caption=${encodeURIComponent(caption)}&photoType=${photoType}&mediaType=${mediaType}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }),

  deleteChefPhoto: (photoId: string, token: string) =>
    apiFetch<any>(`/api/v1/chefs/photos/${photoId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    }),

  // ── Cuisine Pricing ────────────────────────────────────
  getChefCuisinePricing: (chefId: string) =>
    apiFetch<any[]>(`/api/v1/chefs/cuisine-pricing/${chefId}`),

  setCuisinePricing: (cuisineType: string, pricePerPlatePaise: number, token: string) =>
    apiFetch<any>(`/api/v1/chefs/cuisine-pricing/${cuisineType}?pricePerPlatePaise=${pricePerPlatePaise}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` },
    }),

  deleteCuisinePricing: (cuisineType: string, token: string) =>
    apiFetch<any>(`/api/v1/chefs/cuisine-pricing/${cuisineType}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    }),

  // ── Chef Referrals ─────────────────────────────────────
  generateReferralCode: (token: string) =>
    apiFetch<{ referralCode: string }>('/api/v1/chefs/referrals/generate-code', {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }),

  getMyReferrals: (token: string) =>
    apiFetch<any[]>('/api/v1/chefs/referrals/my', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ── Live Tracking ──────────────────────────────────────
  updateChefLocation: (bookingId: string, lat: number, lng: number, etaMinutes: number, token: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${bookingId}/location?lat=${lat}&lng=${lng}&etaMinutes=${etaMinutes}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }),

  getBookingTracking: (bookingId: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${bookingId}/tracking`),

  // ── Invoice / Receipt ──────────────────────────────────
  getBookingInvoice: (bookingId: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${bookingId}/invoice`),

  getEventInvoice: (eventId: string) =>
    apiFetch<any>(`/api/v1/chef-events/${eventId}/invoice`),

  // ── Rebook ─────────────────────────────────────────────
  rebookChef: (bookingId: string, newDate: string, newTime: string, token: string) =>
    apiFetch<any>(`/api/v1/chef-bookings/${bookingId}/rebook?newDate=${newDate}${newTime ? '&newTime=' + encodeURIComponent(newTime) : ''}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }),

  /* ── Event Pricing ────────────────────────────────────────── */

  getEventPricing: (chefId?: string) =>
    apiFetch<any[]>(`/api/v1/chef-events/pricing${chefId ? '?chefId=' + chefId : ''}`),

  /* ── Builder Projects ────────────────────────────────────── */

  searchBuilderProjects: (params: Record<string, string>) =>
    apiFetch<any>(`/api/v1/search/builder-projects?${new URLSearchParams(params)}`),

  autocompleteBuilderProjects: (q: string) =>
    apiFetch<any[]>(`/api/v1/search/builder-projects/autocomplete?q=${encodeURIComponent(q)}`),

  getBuilderProject: (id: string) =>
    apiFetch<any>(`/api/v1/builder-projects/${id}`),

  createBuilderProject: (data: any, token: string) =>
    apiFetch<any>('/api/v1/builder-projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  updateBuilderProject: (id: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/builder-projects/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  publishBuilderProject: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/builder-projects/${id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMyBuilderProjects: (token: string) =>
    apiFetch<any>('/api/v1/builder-projects/my-projects', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res: any) => res?.content || res || []),

  addUnitType: (projectId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/builder-projects/${projectId}/unit-types`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getUnitTypes: (projectId: string) =>
    apiFetch<any[]>(`/api/v1/builder-projects/${projectId}/unit-types`),

  deleteUnitType: (unitTypeId: string, token: string) =>
    apiFetch<void>(`/api/v1/builder-projects/unit-types/${unitTypeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  calculateUnitPrice: (unitTypeId: string, floor: number, preferredFacing: boolean) =>
    apiFetch<any>(`/api/v1/builder-projects/unit-types/${unitTypeId}/calculate-price?floor=${floor}&preferredFacing=${preferredFacing}`),

  addConstructionUpdate: (projectId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/builder-projects/${projectId}/construction-updates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getConstructionUpdates: (projectId: string) =>
    apiFetch<any[]>(`/api/v1/builder-projects/${projectId}/construction-updates`),

  // ── Broker profiles ────────────────────────────────────────────────
  registerBroker: (data: any) =>
    apiFetch<any>('/api/v1/brokers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBrokerProfile: () =>
    apiFetch<any>('/api/v1/brokers/me'),

  updateBrokerProfile: (data: any) =>
    apiFetch<any>('/api/v1/brokers/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  searchBrokers: (params: Record<string, string>) =>
    apiFetch<any>(`/api/v1/brokers/search?${new URLSearchParams(params)}`),

  getBrokerById: (id: string) =>
    apiFetch<any>(`/api/v1/brokers/${id}`),

  // ══════ VAS: Sale Agreement ══════
  getAgreementTemplates: () => apiFetch<any[]>('/api/v1/agreements/templates'),
  calculateStampDuty: (state: string, agreementType: string, propertyValuePaise: number) =>
    apiFetch<any>(`/api/v1/agreements/stamp-duty/calculate?state=${state}&agreementType=${agreementType}&propertyValuePaise=${propertyValuePaise}`),
  createAgreement: (data: any, token?: string) =>
    apiFetch<any>('/api/v1/agreements', { method: 'POST', ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}), body: JSON.stringify(data) }),
  getSaleAgreement: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/agreements/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  getMyAgreements: (token: string) =>
    apiFetch<any>('/api/v1/agreements/my', { headers: { Authorization: `Bearer ${token}` } }),
  addAgreementParty: (agreementId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/agreements/${agreementId}/parties`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  generateAgreementDraft: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/agreements/${id}/generate-draft`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  payAgreement: (id: string, paymentId: string, token: string) =>
    apiFetch<any>(`/api/v1/agreements/${id}/pay?paymentId=${paymentId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  signAgreement: (id: string, partyId: string, token: string) =>
    apiFetch<any>(`/api/v1/agreements/${id}/sign/${partyId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),

  // ══════ VAS: Home Loan ══════
  checkLoanEligibility: (data: any, token: string) =>
    apiFetch<any>('/api/v1/homeloan/eligibility', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  calculateEmi: (loanAmountPaise: number, interestRate: number, tenureMonths: number) =>
    apiFetch<any>(`/api/v1/homeloan/emi/calculate?loanAmountPaise=${loanAmountPaise}&interestRate=${interestRate}&tenureMonths=${tenureMonths}`, { method: 'POST' }),
  getPartnerBanks: () => apiFetch<any[]>('/api/v1/homeloan/banks'),
  getPartnerBank: (id: string) => apiFetch<any>(`/api/v1/homeloan/banks/${id}`),
  createPartnerBank: (data: any, token: string) =>
    apiFetch<any>('/api/v1/homeloan/banks', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  updatePartnerBank: (id: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/homeloan/banks/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  deletePartnerBank: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/homeloan/banks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  compareBanks: (eligibilityId: string) => apiFetch<any[]>(`/api/v1/homeloan/banks/compare?eligibilityId=${eligibilityId}`),
  applyLoan: (data: any, token: string) =>
    apiFetch<any>('/api/v1/homeloan/apply', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  getMyLoanApplications: (token: string) =>
    apiFetch<any>('/api/v1/homeloan/applications/my', { headers: { Authorization: `Bearer ${token}` } }),
  getLoanApplication: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/homeloan/applications/${id}`, { headers: { Authorization: `Bearer ${token}` } }),

  // ══════ VAS: Legal Services ══════
  getLegalPackages: () => apiFetch<any[]>('/api/v1/legal/packages'),
  getAdvocates: (city?: string) => apiFetch<any[]>(`/api/v1/legal/advocates${city ? '?city=' + city : ''}`),
  getAdvocate: (id: string) => apiFetch<any>(`/api/v1/legal/advocates/${id}`),
  registerAdvocate: (data: any, token: string) =>
    apiFetch<any>('/api/v1/legal/advocates/register', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  getMyAdvocateProfile: (token: string) =>
    apiFetch<any>('/api/v1/legal/advocates/my-profile', { headers: { Authorization: `Bearer ${token}` } }),
  updateMyAdvocateProfile: (data: any, token: string) =>
    apiFetch<any>('/api/v1/legal/advocates/my-profile', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  createAdvocate: (data: any, token: string) =>
    apiFetch<any>('/api/v1/legal/advocates', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  updateAdvocate: (id: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/legal/advocates/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  deleteAdvocate: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/legal/advocates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  createLegalCase: (data: any, token?: string) =>
    apiFetch<any>('/api/v1/legal/cases', { method: 'POST', ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}), body: JSON.stringify(data) }),
  getMyLegalCases: (token: string) =>
    apiFetch<any>('/api/v1/legal/cases/my', { headers: { Authorization: `Bearer ${token}` } }),
  getLegalCase: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/legal/cases/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  uploadLegalDocument: (caseId: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/legal/cases/${caseId}/documents`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  getLegalDocuments: (caseId: string, token: string) =>
    apiFetch<any[]>(`/api/v1/legal/cases/${caseId}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
  scheduleLegalConsultation: (caseId: string, data: any, token?: string) =>
    apiFetch<any>(`/api/v1/legal/cases/${caseId}/consultation`, { method: 'POST', ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}), body: JSON.stringify(data) }),
  downloadLegalReport: async (caseId: string): Promise<Blob> => {
    // Report endpoint is public (permitAll) — no auth needed
    const res = await fetch(`${API_URL}/api/v1/legal/cases/${caseId}/report`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Download failed (${res.status})`);
    }
    return res.blob();
  },

  // ══════ VAS: Home Interiors ══════
  getInteriorDesigners: (city?: string) => apiFetch<any[]>(`/api/v1/interiors/designers${city ? '?city=' + city : ''}`),
  getInteriorDesigner: (id: string) => apiFetch<any>(`/api/v1/interiors/designers/${id}`),
  registerDesigner: (data: any, token: string) =>
    apiFetch<any>('/api/v1/interiors/designers/register', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  getMyDesignerProfile: (token: string) =>
    apiFetch<any>('/api/v1/interiors/designers/my-profile', { headers: { Authorization: `Bearer ${token}` } }),
  updateMyDesignerProfile: (data: any, token: string) =>
    apiFetch<any>('/api/v1/interiors/designers/my-profile', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  createInteriorDesigner: (data: any, token: string) =>
    apiFetch<any>('/api/v1/interiors/designers', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  updateInteriorDesigner: (id: string, data: any, token: string) =>
    apiFetch<any>(`/api/v1/interiors/designers/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  deleteInteriorDesigner: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/interiors/designers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  getMaterialCatalog: (category?: string) => apiFetch<any[]>(`/api/v1/interiors/materials/catalog${category ? '?category=' + category : ''}`),
  bookInteriorConsultation: (data: any, token: string) =>
    apiFetch<any>('/api/v1/interiors/consultation', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  getMyInteriorProjects: (token?: string) =>
    apiFetch<any>('/api/v1/interiors/projects/my', token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  getInteriorProject: (id: string, token: string) =>
    apiFetch<any>(`/api/v1/interiors/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  getInteriorRoomDesigns: (projectId: string, token: string) =>
    apiFetch<any[]>(`/api/v1/interiors/projects/${projectId}/rooms`, { headers: { Authorization: `Bearer ${token}` } }),
  getInteriorMilestones: (projectId: string, token: string) =>
    apiFetch<any[]>(`/api/v1/interiors/projects/${projectId}/milestones`, { headers: { Authorization: `Bearer ${token}` } }),
  getInteriorQuote: (projectId: string, token: string) =>
    apiFetch<any>(`/api/v1/interiors/projects/${projectId}/quote`, { headers: { Authorization: `Bearer ${token}` } }),

  /* ── Flights ───────────────────────────────────────────────── */

  searchFlights: (params: Record<string, string>) => {
    const qs = Object.entries(params).filter(([,v]) => v).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    return apiFetch<any>(`/api/v1/flights/search?${qs}`);
  },
  createFlightBooking: (body: any, token: string) =>
    apiFetch<any>('/api/v1/flights/book', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  confirmFlightPayment: (bookingId: string, razorpayOrderId: string, razorpayPaymentId: string, token: string) =>
    apiFetch<any>(`/api/v1/flights/${bookingId}/confirm-payment`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpayOrderId, razorpayPaymentId }),
    }),
  cancelFlightBooking: (bookingId: string, token: string) =>
    apiFetch<any>(`/api/v1/flights/${bookingId}/cancel`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }),
  getMyFlights: (token: string, page: number = 0) =>
    apiFetch<any>(`/api/v1/flights/my?page=${page}&size=10&sort=createdAt,desc`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getFlightBooking: (bookingId: string, token: string) =>
    apiFetch<any>(`/api/v1/flights/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

};
