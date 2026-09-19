import { Component, computed, input, model } from '@angular/core';

/** Five bordered boxes; click sets the rating, clicking the same value again clears it. */
@Component({
  selector: 'app-star-rating-box',
  template: `
    @if (readonly()) {
      <span
        class="inline-flex items-center gap-1"
        role="img"
        [attr.aria-label]="ariaLabel() + ': ' + rating() + ' out of 5'"
      >
        @for (star of stars; track star) {
          <span
            class="flex items-center justify-center rounded border"
            [style.width.px]="boxSize()"
            [style.height.px]="boxSize()"
            [style.borderColor]="borderColor()"
            [style.background]="star <= rating() ? filledBg() : '#fff'"
          >
            <svg
              viewBox="0 0 24 24"
              [attr.width]="iconSize()"
              [attr.height]="iconSize()"
              [attr.fill]="star <= rating() ? filledColor() : emptyColor()"
              aria-hidden="true"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </span>
        }
      </span>
    } @else {
      <div class="inline-flex items-center gap-1" role="radiogroup" [attr.aria-label]="ariaLabel()">
        @for (star of stars; track star) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="star <= rating()"
            [attr.aria-label]="star + ' star'"
            (click)="select(star)"
            class="flex items-center justify-center rounded border"
            [style.width.px]="boxSize()"
            [style.height.px]="boxSize()"
            [style.borderColor]="borderColor()"
            [style.background]="star <= rating() ? filledBg() : '#fff'"
          >
            <svg
              viewBox="0 0 24 24"
              [attr.width]="iconSize()"
              [attr.height]="iconSize()"
              [attr.fill]="star <= rating() ? filledColor() : emptyColor()"
              aria-hidden="true"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </button>
        }
      </div>
    }
  `,
})
export class StarRatingBox {
  readonly rating = model<number>(0);
  readonly readonly = input(false);
  readonly boxSize = input(60);
  readonly iconSize = input(36);
  readonly filledBg = input('#FFFFFF');
  readonly filledColor = input('#FBBF24');
  readonly emptyColor = input('#9CA3AF');
  readonly borderColor = input('#9CA3AF');
  readonly ariaLabel = input('Rating');
  readonly stars = [1, 2, 3, 4, 5];
  readonly rounded = computed(() => Math.round(this.rating()));

  select(star: number): void {
    this.rating.set(this.rating() === star ? 0 : star);
  }
}
