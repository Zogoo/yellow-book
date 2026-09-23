import { Component, computed, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** ‹ 1 2 3 › pager with the gold active page. */
@Component({
  selector: 'app-pagination',
  imports: [TranslatePipe],
  template: `
    <nav
      class="flex items-center justify-center gap-2"
      [attr.aria-label]="'common.pagination' | translate"
    >
      <button
        type="button"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
        [disabled]="page() <= 1"
        (click)="go(page() - 1)"
        [attr.aria-label]="'common.previousPage' | translate"
      >
        ‹
      </button>
      @for (p of pages(); track p) {
        <button
          type="button"
          class="min-w-10 rounded-lg px-3 py-2 text-sm font-medium"
          [class.bg-[#facc15]]="p === page()"
          [class.text-[#212121]]="p === page()"
          [class.shadow-[0_0_0_4px_rgba(250,204,21,0.25)]]="p === page()"
          [class.border]="p !== page()"
          [class.border-gray-200]="p !== page()"
          [attr.aria-current]="p === page() ? 'page' : null"
          (click)="go(p)"
        >
          {{ p }}
        </button>
      }
      <button
        type="button"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
        [disabled]="page() >= totalPages()"
        (click)="go(page() + 1)"
        [attr.aria-label]="'common.nextPage' | translate"
      >
        ›
      </button>
    </nav>
  `,
})
export class Pagination {
  readonly page = model(1);
  readonly totalPages = input(1);
  readonly maxVisible = input(5);
  readonly pages = computed(() => {
    const total = Math.max(1, this.totalPages());
    const visible = Math.min(this.maxVisible(), total);
    let start = Math.max(1, this.page() - Math.floor(visible / 2));
    const end = Math.min(total, start + visible - 1);
    start = Math.max(1, end - visible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  go(target: number): void {
    const clamped = Math.max(1, Math.min(this.totalPages(), target));
    if (clamped !== this.page()) this.page.set(clamped);
  }
}
