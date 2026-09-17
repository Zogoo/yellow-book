import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, firstValueFrom, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiEnvelope, ApiErrorBody, ApiMeta } from '../models';
import { ToastService } from './toast.service';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly statusText: string,
    readonly details: ApiErrorBody | null,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface RequestOptions {
  query?: Record<string, unknown>;
  toast?: { showError?: boolean; showSuccess?: boolean };
}

export interface ListResult<T> {
  items: T[];
  meta: ApiMeta;
}

/**
 * Thin typed wrapper around the JSON API: unwraps `{data, meta}` envelopes,
 * normalises errors and surfaces failures as toasts (opt-out per call).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  readonly baseUrl = environment.apiUrl;

  request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Observable<ApiEnvelope<T>> {
    const url = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    let params = new HttpParams();
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return this.http
      .request<ApiEnvelope<T>>(method, url, { body, params })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, options)));
  }

  get<T>(
    path: string,
    query?: Record<string, unknown>,
    options: RequestOptions = {},
  ): Observable<ApiEnvelope<T>> {
    return this.request<T>('GET', path, undefined, { ...options, query });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Observable<ApiEnvelope<T>> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Observable<ApiEnvelope<T>> {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Observable<ApiEnvelope<T>> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Observable<ApiEnvelope<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  /** Promise helpers for components that await sequential calls. */
  getData<T>(path: string, query?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return firstValueFrom(this.get<T>(path, query, options).pipe(map((r) => r?.data as T)));
  }

  list<T>(
    path: string,
    query?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ListResult<T>> {
    return firstValueFrom(
      this.get<T[]>(path, query, options).pipe(
        map((r) => ({ items: (r?.data as T[]) ?? [], meta: r?.meta ?? emptyMeta(query) })),
      ),
    );
  }

  postData<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return firstValueFrom(this.post<T>(path, body, options).pipe(map((r) => r?.data as T)));
  }

  putData<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return firstValueFrom(this.put<T>(path, body, options).pipe(map((r) => r?.data as T)));
  }

  patchData<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return firstValueFrom(this.patch<T>(path, body, options).pipe(map((r) => r?.data as T)));
  }

  deleteData<T>(path: string, options?: RequestOptions): Promise<T> {
    return firstValueFrom(
      this.delete<T>(path, options).pipe(map((r) => (r ? (r.data as T) : (null as T)))),
    );
  }

  private handleError(error: HttpErrorResponse, options: RequestOptions) {
    const details = (
      error.error && typeof error.error === 'object' ? error.error : null
    ) as ApiErrorBody | null;
    const message = details?.message || details?.error || error.message || 'Something went wrong';
    if (options.toast?.showError !== false) {
      const statusText = error.statusText && error.statusText !== 'OK' ? error.statusText : 'Error';
      this.toast.alert(
        error.status ? `${statusText} (${error.status}): ${message}` : 'Something went wrong',
      );
    }
    return throwError(() => new ApiClientError(message, error.status, error.statusText, details));
  }
}

export function emptyMeta(query?: Record<string, unknown>): ApiMeta {
  const page = Number(query?.['page'] ?? 1) || 1;
  const limit = Number(query?.['limit'] ?? 20) || 20;
  return {
    page,
    limit,
    pageSize: 0,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: page > 1,
  };
}
