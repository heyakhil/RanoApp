import { env } from '../config/env';
import { getFirebaseIdToken } from '../services/firebaseAuth';
import {
  getAccessToken,
  saveSession,
} from '../services/tokenStorage';
import type { ApiResponse } from '../types';
import type { AuthSession, BackendErrorBody } from '../types/auth';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  retryOnExpire?: boolean;
  formData?: boolean;
}

class ApiClient {
  private readonly baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET', auth: true });
  }

  async getPublic<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'GET',
      auth: false,
      retryOnExpire: false,
    });
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'POST', body, auth: true });
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'PATCH', body, auth: true });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE', auth: true });
  }

  async postForm<T>(path: string, body: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body,
      auth: true,
      formData: true,
    });
  }

  async postPublic<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body,
      auth: false,
      retryOnExpire: false,
    });
  }

  /**
   * Authenticated requests attach the JWT. On TOKEN_EXPIRED the client
   * silently exchanges a Firebase ID token for a new JWT and retries once.
   */
  private async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      auth = true,
      retryOnExpire = true,
      formData = false,
    } = options;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (!formData) {
      headers['Content-Type'] = 'application/json';
    }

    if (auth) {
      const token = await getAccessToken();

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, env.apiTimeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body:
          body === undefined
            ? undefined
            : formData
              ? (body as FormData)
              : JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = (await response.json()) as
        | ApiResponse<T>
        | BackendErrorBody;

      if (
        auth &&
        retryOnExpire &&
        response.status === 401 &&
        'code' in payload &&
        payload.code === 'TOKEN_EXPIRED'
      ) {
        const nextToken = await this.refreshAccessTokenSilently();

        if (nextToken) {
          return this.request<T>(path, {
            method,
            body,
            auth: true,
            formData,
            retryOnExpire: false,
          });
        }
      }

      if (!response.ok || !('success' in payload) || !payload.success) {
        const errorPayload = payload as BackendErrorBody;

        return {
          success: false,
          data: undefined as unknown as T,
          message: errorPayload.message ?? 'Request failed',
        };
      }

      return {
        success: true,
        data: (payload as ApiResponse<T>).data,
        message: (payload as ApiResponse<T>).message,
      };
    } catch (error) {
      const aborted =
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name: string }).name === 'AbortError';

      return {
        success: false,
        data: undefined as unknown as T,
        message: aborted
          ? `Server timed out. Is the API running at ${this.baseUrl}?`
          : `Cannot reach API at ${this.baseUrl}. Check backend and device network.`,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Single-flight refresh so parallel API calls share one Firebase→JWT exchange.
   */
  private async refreshAccessTokenSilently(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const idToken = await getFirebaseIdToken(true);
      const response = await this.postPublic<AuthSession>('/auth/refresh', {
        idToken,
      });

      if (!response.success || !response.data) {
        return null;
      }

      await saveSession(response.data.accessToken, response.data.user);
      return response.data.accessToken;
    } catch {
      return null;
    }
  }
}

export const apiClient = new ApiClient(env.apiBaseUrl);
