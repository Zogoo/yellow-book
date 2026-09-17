import { Component, inject } from '@angular/core';

import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div
      class="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      aria-live="polite"
    >
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg"
          [class.bg-emerald-600]="toast.kind === 'success'"
          [class.bg-rose-600]="toast.kind === 'alert'"
          [class.bg-sky-600]="toast.kind === 'info'"
          [class.bg-amber-500]="toast.kind === 'warning'"
          role="status"
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button
            type="button"
            class="opacity-70 hover:opacity-100"
            aria-label="Dismiss"
            (click)="toasts.dismiss(toast.id)"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  readonly toasts = inject(ToastService);
}
