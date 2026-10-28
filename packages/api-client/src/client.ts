// ─────────────────────────────────────────────────────────────
// Typed API Client for JavaMifi Compass
// Used by web Next.js and admin React CMS
// ─────────────────────────────────────────────────────────────

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class JavaMifiApiClient {
  private baseUrl: string;
  private getToken?: () => string | null | Promise<string | null>;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.onUnauthorized) {
      this.onUnauthorized();
    }

    if (!response.ok) {
      let errData: { code?: string; message?: string; details?: unknown } = {};
      try {
        errData = await response.json();
      } catch {
        // non-json response
      }
      throw new ApiError(
        response.status,
        errData.code || 'UNKNOWN_ERROR',
        errData.message || response.statusText,
        errData.details,
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // ── Auth Endpoints ──────────────────────────────────────────
  auth = {
    login: (credentials: { email: string; password: string; totpCode?: string }) =>
      this.request<{ token: string; refreshToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
      this.request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => this.request<any>('/auth/me'),
    refresh: (refreshToken: string) =>
      this.request<{ token: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
    logout: () => this.request<void>('/auth/logout', { method: 'POST' }),
  };

  // ── Catalog Endpoints ───────────────────────────────────────
  catalog = {
    getDestinations: (locale = 'id') =>
      this.request<any[]>(`/catalog/destinations?locale=${locale}`),
    getDestinationBySlug: (slug: string, locale = 'id') =>
      this.request<any>(`/catalog/destinations/${slug}?locale=${locale}`),
    getProducts: (locale = 'id') => this.request<any[]>(`/catalog/products?locale=${locale}`),
    getProductBySlug: (slug: string, locale = 'id') =>
      this.request<any>(`/catalog/products/${slug}?locale=${locale}`),
    getPlans: (params?: { destinationId?: string; productId?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<any[]>(`/catalog/plans?${query}`);
    },
    getPresets: (locale = 'id') => this.request<any[]>(`/catalog/presets?locale=${locale}`),
    validatePromo: (code: string, subtotalIdr: number) =>
      this.request<{ valid: boolean; discountIdr: number; promoCode?: any }>(
        '/catalog/promos/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code, subtotalIdr }),
        },
      ),
  };

  // ── Planner Endpoints ───────────────────────────────────────
  planner = {
    calculateRecommendation: (input: {
      destinations: string[];
      startDate: string;
      endDate: string;
      travelerCount: number;
      deviceCount: number;
      usageProfile: 'LIGHT' | 'MODERATE' | 'HEAVY' | 'WORK';
      needsVPN: boolean;
      esimCompatible: boolean;
    }) =>
      this.request<any>('/planner/recommend', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  };

  // ── Orders & Checkout Endpoints ─────────────────────────────
  orders = {
    createOrder: (payload: any) =>
      this.request<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getOrder: (orderNumber: string) => this.request<any>(`/orders/${orderNumber}`),
    getTripHub: (orderNumber: string, token?: string) =>
      this.request<any>(`/orders/${orderNumber}/trip-hub${token ? `?token=${token}` : ''}`),
    listOrders: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<any>(`/orders?${query}`);
    },
    refundOrder: (orderNumber: string, reason?: string) =>
      this.request<any>(`/orders/${orderNumber}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Customer requested refund' }),
      }),
  };

  // ── Payments Endpoints ──────────────────────────────────────
  payments = {
    createPayment: (
      orderId: string,
      gatewayMode?: 'mock' | 'midtrans_sandbox',
      options?: { syntheticToken?: string; idempotencyKey?: string; clientAmount?: number },
    ) =>
      this.request<any>('/payments/create', {
        method: 'POST',
        body: JSON.stringify({ orderId, gatewayMode, ...options }),
      }),
    createMockIntent: (payload: {
      orderId?: string;
      orderNumber?: string;
      syntheticToken?: string;
      idempotencyKey?: string;
      clientAmount?: number;
    }) =>
      this.request<any>('/payments/mock/intent', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    simulateMockPayment: (payload: {
      paymentId: string;
      status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
    }) =>
      this.request<any>('/payments/mock/callback', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getLedger: (orderId: string) => this.request<any[]>(`/payments/ledger/${orderId}`),
  };

  // ── Readiness Card / Integrations ───────────────────────────
  integrations = {
    getDestinationReadiness: (countryCode: string) =>
      this.request<{
        weather: any;
        exchangeRate: any;
        countryInfo: any;
        tips: any;
      }>(`/integrations/readiness/${countryCode}`),
    getSystemHealth: () => this.request<any>('/health'),
  };

  // ── Content Endpoints ───────────────────────────────────────
  content = {
    getPage: (slug: string, locale = 'id') =>
      this.request<any>(`/content/pages/${slug}?locale=${locale}`),
    getFaqs: (category?: string, locale = 'id') =>
      this.request<any[]>(
        `/content/faqs?locale=${locale}${category ? `&category=${category}` : ''}`,
      ),
    getBanners: (position = 'HOME_HERO', locale = 'id') =>
      this.request<any[]>(`/content/banners?position=${position}&locale=${locale}`),
  };

  // ── Support Tickets ─────────────────────────────────────────
  support = {
    createTicket: (payload: {
      name: string;
      email: string;
      subject: string;
      message: string;
      orderNumber?: string;
    }) =>
      this.request<any>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getTickets: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<any>(`/support/tickets?${query}`);
    },
  };

  // ── Admin Endpoints ─────────────────────────────────────────
  admin = {
    getDashboardMetrics: () => this.request<any>('/admin/dashboard'),
    getDevices: (status?: string) =>
      this.request<any[]>(`/admin/devices${status ? `?status=${status}` : ''}`),
    updateDeviceStatus: (id: string, status: string, notes?: string) =>
      this.request<any>(`/admin/devices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    getAuditLogs: (params?: { page?: number; limit?: number; resource?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<any>(`/admin/audit-logs?${query}`);
    },
    getAutomationRuns: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<any>(`/admin/automation/runs?${query}`);
    },
    retryOutboxEvent: (eventId: string) =>
      this.request<any>(`/admin/automation/events/${eventId}/retry`, {
        method: 'POST',
      }),
    getCustomers: () => this.request<any[]>('/admin/customers'),
    getCatalog: () => this.request<any[]>('/admin/catalog/products'),
    updateCatalogProduct: (id: string, body: any) =>
      this.request<any>(`/admin/catalog/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    getMediaList: () => this.request<any[]>('/admin/media'),
    uploadMedia: (body: any) =>
      this.request<any>('/admin/media/upload', {
        method: 'POST',
        body: typeof body === 'string' ? body : JSON.stringify(body),
      }),
    switchAdapter: (adapterType: 'paymentGateway' | 'esimProvider', mode: string) =>
      this.request<any>('/admin/integrations/switch', {
        method: 'POST',
        body: JSON.stringify({ adapterType, mode }),
      }),
  };

  // ── Dining / Food Discovery (Compass Rasa) ──────────────────
  dining = {
    getCountries: () => this.request<any[]>('/v1/dining/countries'),
    getRates: () => this.request<any[]>('/v1/dining/rates'),
    getPlaces: (params?: {
      country?: string;
      city?: string;
      filter?: string;
      search?: string;
      radiusKm?: number;
      includeUnverified?: boolean;
      sortBy?: 'relevance' | 'rating' | 'distance';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.country) q.set('country', params.country);
      if (params?.city) q.set('city', params.city);
      if (params?.filter) q.set('filter', params.filter);
      if (params?.search) q.set('search', params.search);
      if (params?.radiusKm) q.set('radiusKm', String(params.radiusKm));
      if (params?.includeUnverified !== undefined)
        q.set('includeUnverified', String(params.includeUnverified));
      if (params?.sortBy) q.set('sortBy', params.sortBy);
      if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return this.request<{ items: any[]; total: number; page: number; limit: number }>(
        `/v1/dining/places${qs ? `?${qs}` : ''}`,
      );
    },
    getPlaceDetail: (id: string) => this.request<any>(`/v1/dining/places/${id}`),
    parseSearchIntent: (query: string) =>
      this.request<{
        country?: string;
        city?: string;
        cuisine?: string;
        filter: string;
        budgetMaxMinor?: number;
        radiusKm?: number;
      }>('/v1/dining/parse-intent', {
        method: 'POST',
        body: JSON.stringify({ query }),
      }),
    submitReport: (payload: {
      placeId: string;
      placeName: string;
      disputeReason: string;
      suggestedTier?: string;
      userComment: string;
      reporterEmail?: string;
    }) =>
      this.request<any>('/v1/dining/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getReviewQueue: () => this.request<any[]>('/v1/dining/admin/review-queue'),
    resolveReviewItem: (
      id: string,
      payload: {
        action: 'OVERRIDE_TIER' | 'DISMISS';
        overrideTier?: string;
        resolvedBy: string;
        notes?: string;
      },
    ) =>
      this.request<any>(`/v1/dining/admin/review-queue/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getSafetyStatus: () => this.request<any>('/v1/dining/admin/safety-status'),
    toggleKillSwitch: (active: boolean) =>
      this.request<any>('/v1/dining/admin/safety-toggle', {
        method: 'POST',
        body: JSON.stringify({ active }),
      }),
    runGoldenSetEvaluation: () =>
      this.request<any>('/v1/dining/evaluation/run', {
        method: 'POST',
      }),
  };
}
