import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'alert' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

/** Bottom-right toasts (3 s, max 5) replacing awesome-notifications. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  success(message: string): void {
    this.push('success', message);
  }

  alert(message: string): void {
    this.push('alert', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  warning(message: string): void {
    this.push('warning', message);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const toast: Toast = { id: this.nextId++, kind, message };
    this.toasts.update((list) => [...list, toast].slice(-5));
    // Failures stay long enough to be read; confirmations get out of the way.
    setTimeout(() => this.dismiss(toast.id), kind === 'alert' ? 8000 : 3500);
  }
}
