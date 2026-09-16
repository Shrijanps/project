import {
  User,
  Property,
  PredictionResult,
  PredictionHistoryItem,
  PropertyStats,
  ModelMetadata
} from './types';

const TOKEN_KEY = 'real_estate_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (details: { name: string; email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(details)
    }),

  adminSetup: (details: { name: string; email: string; password: string; setup_key: string }) =>
    request<{ user: User; token: string; message: string }>('/api/auth/admin-setup', {
      method: 'POST',
      body: JSON.stringify(details)
    }),

  createAdminUser: (details: { name: string; email: string; password: string }) =>
    request<{ user: User; message: string }>('/api/auth/users/create-admin', {
      method: 'POST',
      body: JSON.stringify(details)
    }),

  updateUserRole: (id: number, role: 'admin' | 'user') =>
    request<{ message: string; user_id: number; role: string }>(`/api/auth/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  getUsers: () => request<{ users: User[] }>('/api/auth/users'),

  // Properties
  getProperties: (params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        query.append(key, String(val));
      }
    });
    return request<{
      properties: Property[];
      total: number;
      page: number;
      total_pages: number;
      limit: number;
    }>(`/api/properties?${query.toString()}`);
  },

  getPropertyStats: () => request<{ stats: PropertyStats }>('/api/properties/stats'),

  getPropertyById: (id: number) => request<{ property: Property }>(`/api/properties/${id}`),

  createProperty: (data: Partial<Property>) =>
    request<{ property: Property; message: string }>('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateProperty: (id: number, data: Partial<Property>) =>
    request<{ property: Property; message: string }>(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteProperty: (id: number) =>
    request<{ message: string }>(`/api/properties/${id}`, {
      method: 'DELETE'
    }),

  // Predictions
  predict: (features: Record<string, any>, k?: number, engine?: 'node' | 'python') =>
    request<PredictionResult>('/api/predict', {
      method: 'POST',
      body: JSON.stringify({ ...features, k, engine })
    }),

  getPredictions: () => request<{ predictions: PredictionHistoryItem[] }>('/api/predictions'),

  deletePrediction: (id: number) =>
    request<{ message: string }>(`/api/predictions/${id}`, {
      method: 'DELETE'
    }),

  // Model Metadata
  getModelInfo: () => request<{ model_info: ModelMetadata }>('/api/model/info'),

  retrainModel: () =>
    request<{ message: string; metrics: any; best_k: number; output: string }>('/api/model/retrain', {
      method: 'POST'
    })
};
