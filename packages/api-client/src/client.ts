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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
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
    getProducts: (locale = 'id') =>
      this.request<any[]>(`/catalog/products?locale=${locale}`),
    getProductBySlug: (slug: string, locale = 'id') =>
      this.request<any>(`/catalog/products/${slug}?locale=${locale}`),
    getPlans: (params?: { destinationId?: string; productId?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<any[]>(`/catalog/plans?${query}`);
    },
    getPresets: (locale = 'id') =>
      this.request<any[]>(`/catalog/presets?locale=${locale}`),
    validatePromo: (code: string, subtotalIdr: number) =>
      this.request<{ valid: boolean; discountIdr: number; promoCode?: any }>('/catalog/promos/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotalIdr }),
      }),
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
    getOrder: (orderNumber: string) =>
      this.request<any>(`/orders/${orderNumber}`),
    getTripHub: (orderNumber: string, token?: string) =>
      this.request<any>(`/orders/${orderNumber}/trip-hub${token ? `?token=${token}` : ''}`),
    listOrders: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<any>(`/orders?${query}`);
    },
  };

  // ── Payments Endpoints ──────────────────────────────────────
  payments = {
    createPayment: (orderId: string, gatewayMode?: 'mock' | 'midtrans_sandbox') =>
      this.request<any>('/payments/create', {
        method: 'POST',
        body: JSON.stringify({ orderId, gatewayMode }),
      }),
    simulateMockPayment: (payload: { paymentId: string; status: 'SUCCESS' | 'FAILED' | 'EXPIRED' }) =>
      this.request<any>('/payments/mock/callback', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getLedger: (orderId: string) =>
      this.request<any[]>(`/payments/ledger/${orderId}`),
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
      this.request<any[]>(`/content/faqs?locale=${locale}${category ? `&category=${category}` : ''}`),
    getBanners: (position = 'HOME_HERO', locale = 'id') =>
      this.request<any[]>(`/content/banners?position=${position}&locale=${locale}`),
  };

  // ── Support Tickets ─────────────────────────────────────────
  support = {
    createTicket: (payload: { name: string; email: string; subject: string; message: string; orderNumber?: string }) =>
      this.request<any>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
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
  };
}
