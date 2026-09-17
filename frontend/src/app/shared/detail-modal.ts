import { Component, input, output } from '@angular/core';

export interface DetailItem {
  label: string;
  value: unknown;
}

/** Label/value dialog used by the "view" actions in the panels. */
@Component({
  selector: 'app-detail-modal',
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        (click)="close.emit()"
      >
        <div
          class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          (click)="$event.stopPropagation()"
        >
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">{{ title() }}</h2>
            <button
              type="button"
              class="rounded-full p-1 text-gray-500 hover:bg-gray-100"
              aria-label="Close details dialog"
              (click)="close.emit()"
            >
              ✕
            </button>
          </div>
          <dl class="divide-y divide-gray-100">
            @for (item of items(); track item.label) {
              <div class="flex justify-between gap-4 py-2 text-sm">
                <dt class="text-gray-500">{{ item.label }}</dt>
                <dd class="text-right font-medium text-gray-900">{{ display(item.value) }}</dd>
              </div>
            }
          </dl>
          <ng-content select="[footer]" />
        </div>
      </div>
    }
  `,
})
export class DetailModal {
  readonly open = input(false);
  readonly title = input('Details');
  readonly items = input<DetailItem[]>([]);
  readonly close = output<void>();

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }
}
