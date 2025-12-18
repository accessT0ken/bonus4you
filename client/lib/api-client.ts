// API Client for Bonus4You API

// Use relative path for API calls (proxied through Next.js rewrites to backend)
// The rewrite is configured in next.config.mjs
const API_BASE_URL = '/api';

export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  service?: string;
  errors?: Record<string, string> | string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      let data: any

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (parseError) {
          const text = await response.text()
          throw new Error(`Failed to parse JSON response: ${text.substring(0, 100)}`)
        }
      } else {
        const text = await response.text()
        throw new Error(`Expected JSON but got: ${contentType || 'unknown type'}. Response: ${text.substring(0, 100)}`)
      }

      if (!response.ok) {
        const error: ApiError = data
        // Include validation errors in the error message if available
        let errorMessage = error.message || 'API request failed'
        if (error.errors) {
          if (typeof error.errors === 'string') {
            errorMessage += `: ${error.errors}`
          } else if (typeof error.errors === 'object') {
            const errorDetails = Object.entries(error.errors)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
            errorMessage += ` (${errorDetails})`
          }
        }
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
    if (!params) {
      return this.request<T>(endpoint, { method: 'GET' });
    }
    
    // Filter out undefined values
    const cleanParams = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]);
    
    const queryString = cleanParams.length > 0
      ? '?' + new URLSearchParams(cleanParams)
      : '';
    return this.request<T>(endpoint + queryString, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();

// Casinos API
export const casinosApi = {
  getAll: (params?: { category?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<any[]>('/casinos', params),

  getBySlug: (slug: string) =>
    apiClient.get<any>(`/casinos/${slug}`),

  create: (casino: any) =>
    apiClient.post<any>('/casinos', casino),

  update: (id: string, updates: any) =>
    apiClient.put<any>(`/casinos/${id}`, updates),

  delete: (id: string) =>
    apiClient.delete('/casinos/' + id),

  trackLandingPageView: (id: string) =>
    apiClient.post(`/casinos/${id}/stats/landing-page-view`),

  trackClaimBonusClick: (id: string) =>
    apiClient.post(`/casinos/${id}/stats/claim-bonus-click`),

  trackReviewRead: (id: string) =>
    apiClient.post(`/casinos/${id}/stats/review-read`),

  getFilterOptions: () =>
    apiClient.get<{ categories: string[]; statuses: string[]; countries: string[] }>('/casinos/filters/options'),
};

// Blogs API
export const blogsApi = {
  getAll: (params?: { status?: string; category?: string; page?: number; limit?: number }) =>
    apiClient.get<any[]>('/blogs', params),

  getBySlug: (slug: string) =>
    apiClient.get<any>(`/blogs/${slug}`),

  create: (blog: any) =>
    apiClient.post<any>('/blogs', blog),

  update: (id: string, updates: any) =>
    apiClient.put<any>(`/blogs/${id}`, updates),

  delete: (id: string) =>
    apiClient.delete('/blogs/' + id),
};

// Users API
export const usersApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ user: any; token: string }>('/users/login', { email, password }),

  getAll: (params?: { role?: string; page?: number; limit?: number }) => {
    // Filter out undefined values and ensure limit is valid
    const cleanParams: Record<string, string | number> = {}
    if (params) {
      if (params.role !== undefined) cleanParams.role = params.role
      if (params.page !== undefined && params.page > 0) cleanParams.page = params.page
      if (params.limit !== undefined && params.limit > 0 && params.limit <= 100) {
        cleanParams.limit = params.limit
      }
    }
    return apiClient.get<any[]>('/users', Object.keys(cleanParams).length > 0 ? cleanParams : undefined)
  },

  getById: (id: string) =>
    apiClient.get<any>(`/users/${id}`),

  create: (user: any) =>
    apiClient.post<any>('/users', user),

  update: (id: string, updates: any) =>
    apiClient.put<any>(`/users/${id}`, updates),

  delete: (id: string) =>
    apiClient.delete('/users/' + id),

  updateMePassword: (password: string) =>
    apiClient.put<any>('/users/me/password', { password }),
};

// Stats API
export const statsApi = {
  getStats: () =>
    apiClient.get<{
      casinos: {
        total: number;
        published: number;
        withReviews: number;
        totalLandingViews: number;
        totalClaimClicks: number;
        totalReviewReads: number;
        claimConversionRate: number;
        reviewConversionRate: number;
      };
      blogs: {
        total: number;
        published: number;
      };
      users: {
        total: number;
        active: number;
      };
      totalPageViews: number;
    }>('/stats'),
};

// Support API
export const supportApi = {
  // Guest sends message (and creates/updates conversation)
  sendMessage: (payload: {
    guestId: string;
    name?: string;
    email?: string;
    message: string;
    pageUrl?: string;
  }) => apiClient.post<{ conversationId: number }>('/support/messages', payload),

  // Admin: list conversations
  getConversations: (params?: { status?: 'open' | 'closed' }) =>
    apiClient.get<any[]>('/support/conversations', params),

  // Admin: get one conversation with messages
  getConversationMessages: (id: number) =>
    apiClient.get<any>(`/support/conversations/${id}/messages`),

  // Admin: reply to conversation
  replyToConversation: (id: number, message: string) =>
    apiClient.post(`/support/conversations/${id}/reply`, { message }),

  // Admin: update conversation status
  updateConversationStatus: (id: number, status: 'open' | 'closed') =>
    apiClient.patch(`/support/conversations/${id}/status`, { status } as any),

  // Admin: get support config
  getConfig: () => apiClient.get<{ supportEnabled: boolean }>('/support/config'),

  // Admin: update support config
  updateConfig: (supportEnabled: boolean) =>
    apiClient.patch<{ supportEnabled: boolean }>('/support/config', { supportEnabled }),
};

