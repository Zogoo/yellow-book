import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

export type ConnectionStatus = 'checking' | 'connected' | 'error';

/** Probes `/categories` so the badge can tell the user when the API is unreachable. */
@Injectable({ providedIn: 'root' })
export class ApiConnectionService {
  private readonly api = inject(ApiService);
  readonly status = signal<ConnectionStatus>('checking');
  readonly message = signal('Checking API...');
  readonly lastError = signal<string | null>(null);
  readonly lastCheckedAt = signal<number | null>(null);
  readonly baseUrl = environment.apiUrl;

  async probe(): Promise<void> {
    this.status.set('checking');
    this.message.set('Checking API...');
    try {
      await this.api.getData('categories', { limit: 1 }, { toast: { showError: false } });
      this.status.set('connected');
      this.message.set('Connected');
      this.lastError.set(null);
    } catch (error) {
      this.status.set('error');
      this.message.set('API unavailable');
      this.lastError.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.lastCheckedAt.set(Date.now());
    }
  }
}
