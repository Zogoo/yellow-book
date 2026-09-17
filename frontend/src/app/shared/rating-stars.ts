import { Component, computed, input } from '@angular/core';

/** Fractional star display with an accessible label. */
@Component({
  selector: 'app-rating-stars',
  template: `
    <span
      class="inline-flex items-center"
      [style.gap.px]="gap()"
      role="img"
      [attr.aria-label]="
        ariaLabel() + ': ' + value().toFixed(valueDigits()) + ' out of ' + max() + countSuffix()
      "
    >
      @for (star of starList(); track star.index) {
        <span class="relative inline-block" [style.width.px]="px()" [style.height.px]="px()">
          <svg
            viewBox="0 0 24 24"
            [attr.width]="px()"
            [attr.height]="px()"
            [attr.fill]="emptyColor()"
            aria-hidden="true"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
          <span class="absolute inset-0 overflow-hidden" [style.width.%]="star.fill">
            <svg
              viewBox="0 0 24 24"
              [attr.width]="px()"
              [attr.height]="px()"
              [attr.fill]="color()"
              aria-hidden="true"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </span>
        </span>
      }
      @if (showValue()) {
        <span class="ml-1 text-sm font-semibold text-gray-700">{{
          value().toFixed(valueDigits())
        }}</span>
      }
      @if (showCount()) {
        <span class="ml-1 text-xs text-gray-500">({{ count() }})</span>
      }
    </span>
  `,
})
export class RatingStars {
  readonly rating = input<number | null | undefined>(0);
  readonly max = input(5);
  readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md');
  readonly color = input('#ffc107');
  readonly emptyColor = input('#e0e0e0');
  readonly gap = input(4);
  readonly showValue = input(true);
  readonly valueDigits = input(1);
  readonly showCount = input(false);
  readonly count = input(0);
  readonly ariaLabel = input('Rating');
  readonly value = computed(() =>
    Math.max(0, Math.min(this.max(), Number(this.rating() ?? 0) || 0)),
  );
  readonly px = computed(() => ({ xs: 12, sm: 16, md: 20, lg: 24 })[this.size()]);
  readonly starList = computed(() =>
    Array.from({ length: this.max() }, (_, i) => ({
      index: i,
      fill: Math.max(0, Math.min(1, this.value() - i)) * 100,
    })),
  );
  readonly countSuffix = computed(() =>
    this.showCount() ? `, based on ${this.count()} reviews` : '',
  );
}
