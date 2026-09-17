import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiMeta, ReviewRecord } from '../../core/models';
import { emptyMeta } from '../../core/services/api.service';
import { getStatusClass, titleCase } from '../../core/utils/status-class';
import { Pagination } from '../../shared/pagination';
import { RatingStars } from '../../shared/rating-stars';
import { StarRatingBox } from '../../shared/star-rating-box';

/** `/user/my-reviews` — list, edit and delete the signed-in user's reviews. */
@Component({
  selector: 'app-my-reviews-page',
  imports: [FormsModule, Pagination, RatingStars, StarRatingBox],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[#212121]">My Reviews</h1>
        <p class="text-sm text-gray-500">{{ meta().total }} reviews written</p>
      </div>
      <div class="flex gap-2">
        <input
          class="yb-input"
          type="search"
          placeholder="Search reviews"
          [(ngModel)]="search"
          (ngModelChange)="onSearch()"
          aria-label="Search reviews"
        />
        <select
          class="yb-input"
          [(ngModel)]="status"
          (ngModelChange)="load(1)"
          aria-label="Status filter"
        >
          <option value="">All statuses</option>
          @for (s of ['pending', 'approved', 'rejected', 'on_hold']; track s) {
            <option [value]="s">{{ label(s) }}</option>
          }
        </select>
      </div>
    </header>
    @if (loading()) {
      <p class="text-gray-500">Loading your reviews...</p>
    } @else if (reviews().length === 0) {
      <div class="yb-card p-10 text-center text-gray-500">You haven't written any reviews yet.</div>
    } @else {
      <div class="space-y-4">
        @for (review of reviews(); track review.id) {
          <article class="yb-card p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="font-semibold text-[#212121]">{{ review.companyName }}</h2>
                <p class="text-xs text-gray-400">{{ review.date }} {{ review.time }}</p>
              </div>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                [class]="statusClass(review.status)"
                >{{ label(review.status) }}</span
              >
            </div>
            @if (editing()?.id === review.id) {
              <div class="mt-3 space-y-3">
                <app-star-rating-box [(rating)]="editRating" [boxSize]="36" [iconSize]="20" />
                <textarea
                  class="yb-input"
                  rows="3"
                  [(ngModel)]="editContent"
                  aria-label="Review text"
                ></textarea>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="yb-btn yb-btn-gold"
                    (click)="saveEdit(review)"
                    [disabled]="busy()"
                  >
                    Save
                  </button>
                  <button type="button" class="yb-btn yb-btn-outline" (click)="editing.set(null)">
                    Cancel
                  </button>
                </div>
              </div>
            } @else {
              <div class="mt-2"><app-rating-stars [rating]="review.rating" size="sm" /></div>
              <p class="mt-2 text-gray-700">{{ review.content }}</p>
              <p class="mt-2 text-xs text-gray-500">
                👍 {{ review.likes }} · 👎 {{ review.dislikes }} · ↗ {{ review.shares }}
              </p>
              @if (review.companyResponse) {
                <div class="mt-3 rounded-lg bg-[#fff9e6] p-3 text-sm">
                  <strong>{{ review.companyResponse.name }}</strong> replied:
                  {{ review.companyResponse.text }}
                </div>
              }
              <div class="mt-3 flex gap-2">
                <button type="button" class="yb-btn yb-btn-outline" (click)="startEdit(review)">
                  Edit
                </button>
                <button
                  type="button"
                  class="yb-btn bg-red-50 text-red-700"
                  (click)="remove(review)"
                  [attr.data-testid]="'user-delete-review-' + review.id"
                >
                  Delete
                </button>
                <button type="button" class="yb-btn yb-btn-outline" (click)="view(review)">
                  View on page
                </button>
              </div>
            }
          </article>
        }
      </div>
      @if (meta().totalPages > 1) {
        <app-pagination
          [page]="meta().page"
          (pageChange)="load($event)"
          [totalPages]="meta().totalPages"
        />
      }
    }
  `,
})
export class MyReviewsPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly reviews = signal<ReviewRecord[]>([]);
  readonly meta = signal<ApiMeta>(emptyMeta({ limit: 10 }));
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly editing = signal<ReviewRecord | null>(null);
  readonly hasAny = computed(() => this.reviews().length > 0);
  search = '';
  status = '';
  editRating = 0;
  editContent = '';
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    void this.load(1);
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.api.list<ReviewRecord>('user/my-reviews', {
        page,
        limit: 10,
        search: this.search.trim(),
        status: this.status,
      });
      this.reviews.set(result.items);
      this.meta.set(result.meta);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.load(1), 300);
  }

  label(status: string): string {
    return titleCase(status);
  }

  statusClass(status: string): string {
    return getStatusClass(status);
  }

  startEdit(review: ReviewRecord): void {
    this.editing.set(review);
    this.editRating = review.rating;
    this.editContent = review.content;
  }

  async saveEdit(review: ReviewRecord): Promise<void> {
    this.busy.set(true);
    try {
      const updated = await this.api.putData<ReviewRecord>(`user/my-reviews/${review.id}`, {
        rating: this.editRating,
        review: this.editContent,
      });
      this.reviews.update((list) =>
        list.map((r) => (r.id === review.id ? { ...r, ...updated } : r)),
      );
      this.editing.set(null);
      this.toast.success('Review updated');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(review: ReviewRecord): Promise<void> {
    if (!window.confirm(`Delete your review of ${review.companyName}?`)) return;
    try {
      await this.api.deleteData(`user/my-reviews/${review.id}`);
      this.toast.success('Review deleted');
      await this.load(this.meta().page);
    } catch {
      this.toast.alert('Failed to delete review');
    }
  }

  view(review: ReviewRecord): void {
    void this.router.navigate(['/agency'], {
      queryParams: { id: review.companyId, reviewId: review.id },
    });
  }
}
