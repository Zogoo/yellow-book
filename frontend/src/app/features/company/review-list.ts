import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, emptyMeta } from '../../core/services/api.service';
import { ApiMeta, ReviewRecord } from '../../core/models';
import { getStatusClass, titleCase } from '../../core/utils/status-class';
import { Pagination } from '../../shared/pagination';
import { RatingStars } from '../../shared/rating-stars';

/** `/company/review` — reviews for the owner's company with reply status. */
@Component({
  selector: 'app-company-review-list-page',
  imports: [FormsModule, RouterLink, Pagination, RatingStars],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[#212121]">Reviews</h1>
        <p class="text-sm text-gray-500">
          {{ meta().total }} reviews · reply to build trust with customers.
        </p>
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
            <option [value]="s">{{ title(s) }}</option>
          }
        </select>
      </div>
    </header>
    @if (loading()) {
      <p class="text-gray-500">Loading reviews...</p>
    } @else if (reviews().length === 0) {
      <div class="yb-card p-10 text-center text-gray-500">No reviews found.</div>
    } @else {
      <div class="yb-card overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-3">Reviewer</th>
              <th class="px-4 py-3">Rating</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Review</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Reply</th>
              <th class="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (r of reviews(); track r.id) {
              <tr class="border-t border-gray-100">
                <td class="px-4 py-3 font-medium">{{ r.reviewerName }}</td>
                <td class="px-4 py-3"><app-rating-stars [rating]="r.rating" size="xs" /></td>
                <td class="px-4 py-3 text-gray-500">{{ r.date }}</td>
                <td class="max-w-xs truncate px-4 py-3">{{ r.content }}</td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2 py-1 text-xs font-semibold"
                    [class]="statusClass(r.status)"
                    >{{ title(r.status) }}</span
                  >
                </td>
                <td class="px-4 py-3 text-xs">
                  @if (r.companyResponse) {
                    <span
                      class="rounded-full px-2 py-1"
                      [class]="statusClass(r.companyResponseStatus)"
                      >{{ title(r.companyResponseStatus || 'pending') }}</span
                    >
                  } @else {
                    <span class="text-gray-400">No reply</span>
                  }
                </td>
                <td class="px-4 py-3">
                  <a [routerLink]="['/company/review', r.id]" class="yb-btn yb-btn-outline">{{
                    r.companyResponse ? 'View' : 'Reply'
                  }}</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
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
export class CompanyReviewListPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly reviews = signal<ReviewRecord[]>([]);
  readonly meta = signal<ApiMeta>(emptyMeta({ limit: 10 }));
  readonly loading = signal(true);
  search = '';
  status = '';
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    void this.load(1);
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.api.list<ReviewRecord>('agency/reviews', {
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

  title(value: unknown): string {
    return titleCase(value);
  }

  statusClass(value: unknown): string {
    return getStatusClass(value);
  }
}
