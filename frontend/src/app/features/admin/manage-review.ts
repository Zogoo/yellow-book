import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService, emptyMeta } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiMeta, ReviewRecord } from '../../core/models';
import { titleCase, toApiStatus } from '../../core/utils/status-class';
import { RatingStars } from '../../shared/rating-stars';
import { StatusDropdown } from '../../shared/status-dropdown';

const STATUS_MESSAGES: Record<string, string> = {
  Approved: 'Review approved',
  Rejected: 'Review rejected',
  'On Hold': 'Review put on hold',
  Banned: 'Reviewer banned',
  Suspended: 'Review suspended',
};

/** `/admin/manage-review` — moderation table with stats, filters and the detail modal. */
@Component({
  selector: 'app-manage-review-page',
  imports: [FormsModule, RatingStars, StatusDropdown],
  template: `
    <header><h1 class="text-2xl font-bold text-[#212121]">Review Management</h1></header>
    <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
      @for (card of statCards(); track card.label) {
        <button
          type="button"
          class="yb-card p-4 text-left"
          [class.ring-2]="card.filter && filters.status === card.filter"
          [class.ring-[#fcc207]]="card.filter && filters.status === card.filter"
          (click)="applyStat(card.filter)"
        >
          <p class="text-xs text-gray-500">{{ card.label }}</p>
          <p class="text-2xl font-bold">{{ card.value }}</p>
        </button>
      }
    </div>
    <div class="yb-card space-y-3 p-4">
      <input
        class="yb-input"
        type="search"
        placeholder="Search reviews by name or content"
        [(ngModel)]="filters.search"
        (ngModelChange)="onSearch()"
        aria-label="Search reviews"
      />
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label class="text-xs text-gray-500"
          >From<input
            class="yb-input"
            type="date"
            [(ngModel)]="filters.dateFrom"
            (ngModelChange)="load(1)"
        /></label>
        <label class="text-xs text-gray-500"
          >To<input
            class="yb-input"
            type="date"
            [(ngModel)]="filters.dateTo"
            (ngModelChange)="load(1)"
        /></label>
        <label class="text-xs text-gray-500"
          >Time Range<select
            class="yb-input"
            [(ngModel)]="filters.timeRange"
            (ngModelChange)="load(1)"
          >
            <option value="">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
          </select></label
        >
        <label class="text-xs text-gray-500"
          >Rating<select class="yb-input" [(ngModel)]="filters.rating" (ngModelChange)="load(1)">
            <option value="">Select Rating</option>
            @for (r of [5, 4, 3, 2, 1]; track r) {
              <option [value]="r">{{ r }} Star</option>
            }
          </select></label
        >
        <label class="text-xs text-gray-500"
          >Status<select class="yb-input" [(ngModel)]="filters.status" (ngModelChange)="load(1)">
            <option value="">Select Status</option>
            @for (s of statuses; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select></label
        >
      </div>
    </div>
    @if (loading()) {
      <p class="text-gray-500">Loading Reviews...</p>
    } @else if (rows().length === 0) {
      <div class="yb-card p-10 text-center text-gray-500">No reviews found</div>
    } @else {
      <div class="yb-card overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-3 py-3">No</th>
              <th class="px-3 py-3">Reviewer</th>
              <th class="px-3 py-3">Rating</th>
              <th class="px-3 py-3">Date &amp; Time</th>
              <th class="px-3 py-3">Review</th>
              <th class="px-3 py-3">Status</th>
              <th class="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.id; let i = $index) {
              <tr class="border-t border-gray-100">
                <td class="px-3 py-3 text-gray-500">
                  {{ pad((meta().page - 1) * meta().limit + i + 1) }}
                </td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-8 w-8 items-center justify-center rounded-full bg-[#fcc207] text-xs font-bold"
                      >{{ initials(r.reviewerName) }}</span
                    ><span class="font-medium">{{ r.reviewerName }}</span>
                  </div>
                </td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-1">
                    <app-rating-stars [rating]="r.rating" size="xs" [showValue]="false" /><span>{{
                      r.rating
                    }}</span>
                  </div>
                </td>
                <td class="px-3 py-3 text-gray-500">{{ r.date }} {{ r.time }}</td>
                <td class="px-3 py-3 italic">“{{ excerpt(r.content) }}”</td>
                <td class="px-3 py-3">
                  <app-status-dropdown
                    [value]="title(r.status)"
                    [options]="statuses"
                    (changed)="setStatus(r, $event)"
                  />
                </td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="text-gray-600"
                      [attr.data-testid]="'admin-reply-review-' + r.id"
                      aria-label="Reply"
                      (click)="reply(r)"
                    >
                      💬
                    </button>
                    <a
                      [href]="'/agency?reviewId=' + r.id + '&id=' + r.companyId"
                      target="_blank"
                      rel="noopener"
                      class="text-gray-600"
                      [attr.data-testid]="'admin-public-review-' + r.id"
                      aria-label="Open public review"
                      >↗</a
                    >
                    <button
                      type="button"
                      class="text-gray-600"
                      [attr.data-testid]="'admin-view-review-' + r.id"
                      aria-label="View review"
                      (click)="detail.set(r)"
                    >
                      👁
                    </button>
                    <button
                      type="button"
                      class="text-green-600"
                      [attr.data-testid]="'admin-approve-review-' + r.id"
                      aria-label="Approve review"
                      (click)="approve(r)"
                    >
                      ✔
                    </button>
                    <button
                      type="button"
                      class="text-red-600"
                      [attr.data-testid]="'admin-delete-review-' + r.id"
                      aria-label="Delete review"
                      (click)="remove(r)"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <span>{{ meta().total }} reviews (Page {{ meta().page }} of {{ meta().totalPages }})</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="yb-btn yb-btn-outline"
            [disabled]="!meta().hasPrevious"
            (click)="load(meta().page - 1)"
          >
            Prev
          </button>
          <button
            type="button"
            class="yb-btn yb-btn-outline"
            [disabled]="!meta().hasNext"
            (click)="load(meta().page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    }

    @if (detail(); as r) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        (click)="detail.set(null)"
      >
        <div
          class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Review Details"
          (click)="$event.stopPropagation()"
        >
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold">Review Details</h2>
            <button type="button" aria-label="Close" (click)="detail.set(null)">✕</button>
          </div>
          <dl class="space-y-2 text-sm">
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Reviewer Name</dt>
              <dd>{{ r.reviewerName }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Email</dt>
              <dd>{{ r.reviewerEmail || '—' }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Company</dt>
              <dd>{{ r.companyName }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Rating</dt>
              <dd class="flex items-center gap-2">
                <app-rating-stars [rating]="r.rating" size="sm" [showValue]="false" />
                {{ r.rating }}
              </dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Review</dt>
              <dd>{{ r.content }}</dd>
            </div>
          </dl>
          <div class="mt-5 grid grid-cols-2 gap-2">
            <button type="button" class="yb-btn yb-btn-gold" (click)="modalStatus(r, 'Approved')">
              Approved
            </button>
            <button
              type="button"
              class="yb-btn bg-red-600 text-white"
              (click)="modalStatus(r, 'Rejected')"
            >
              Reject
            </button>
            <button type="button" class="yb-btn yb-btn-outline" (click)="modalStatus(r, 'On Hold')">
              On-Hold
            </button>
            <button
              type="button"
              class="yb-btn bg-gray-800 text-white"
              (click)="modalStatus(r, 'Banned')"
            >
              Ban Reviewer
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ManageReviewPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly rows = signal<ReviewRecord[]>([]);
  readonly all = signal<ReviewRecord[]>([]);
  readonly meta = signal<ApiMeta>(emptyMeta({ limit: 10 }));
  readonly loading = signal(true);
  readonly detail = signal<ReviewRecord | null>(null);
  readonly statuses = ['Pending', 'Approved', 'Rejected', 'On Hold', 'Banned', 'Suspended'];
  filters = { search: '', dateFrom: '', dateTo: '', timeRange: '', rating: '', status: '' };
  private timer: ReturnType<typeof setTimeout> | null = null;
  readonly statCards = computed(() => {
    const list = this.all();
    const count = (s: string) => list.filter((r) => toApiStatus(r.status) === s).length;
    return [
      { label: 'Total Reviews', value: list.length, filter: '' },
      { label: 'Pending', value: count('pending'), filter: 'Pending' },
      { label: 'Approved', value: count('approved'), filter: 'Approved' },
      { label: 'Rejected', value: count('rejected'), filter: 'Rejected' },
      { label: 'On Hold', value: count('on_hold') + count('hold'), filter: 'On Hold' },
      {
        label: 'Banned Users',
        value: count('banned') || list.filter((r) => r.rating <= 2).length,
        filter: 'Banned',
      },
    ];
  });

  ngOnInit(): void {
    void this.refreshStats();
    void this.load(1);
  }

  async refreshStats(): Promise<void> {
    try {
      const r = await this.api.list<ReviewRecord>(
        'agency/reviews',
        { limit: 200 },
        { toast: { showError: false } },
      );
      this.all.set(r.items);
    } catch {
      this.all.set([]);
    }
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.api.list<ReviewRecord>(
        'agency/reviews',
        {
          page,
          limit: 10,
          search: this.filters.search.trim(),
          rating: this.filters.rating,
          status: toApiStatus(this.filters.status),
          dateFrom: this.filters.dateFrom,
          dateTo: this.filters.dateTo,
          timeRange: this.filters.timeRange,
        },
        { toast: { showError: false } },
      );
      this.rows.set(result.items);
      this.meta.set(result.meta);
    } catch {
      this.toast.alert('Failed to load reviews');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.load(1), 300);
  }

  applyStat(filter: string): void {
    this.filters.status = filter;
    void this.load(1);
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  title(value: unknown): string {
    return titleCase(value);
  }

  initials(name: string): string {
    return (name || '?')
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  excerpt(text: string): string {
    const words = (text || '').split(/\s+/);
    return words.length > 3 ? `${words.slice(0, 3).join(' ')}...` : text;
  }

  reply(r: ReviewRecord): void {
    void this.router.navigate(['/company/review', r.id]);
  }

  async setStatus(r: ReviewRecord, status: string, message?: string): Promise<void> {
    try {
      await this.api.patchData(
        `agency/reviews/${r.id}`,
        { status: toApiStatus(status) },
        { toast: { showError: false } },
      );
      this.rows.update((list) =>
        list.map((x) => (x.id === r.id ? { ...x, status: toApiStatus(status) } : x)),
      );
      this.toast.success(message ?? `Review marked as ${status}`);
      void this.refreshStats();
    } catch {
      this.toast.alert('Failed to update review status');
    }
  }

  async approve(r: ReviewRecord): Promise<void> {
    try {
      await this.api.patchData(
        `agency/reviews/${r.id}`,
        { status: 'approved' },
        { toast: { showError: false } },
      );
      this.rows.update((list) =>
        list.map((x) => (x.id === r.id ? { ...x, status: 'approved' } : x)),
      );
      this.toast.success('Review approved');
      void this.refreshStats();
    } catch {
      this.toast.alert('Failed to approve review');
    }
  }

  async modalStatus(r: ReviewRecord, status: string): Promise<void> {
    await this.setStatus(r, status, STATUS_MESSAGES[status]);
    this.detail.set(null);
  }

  async remove(r: ReviewRecord): Promise<void> {
    if (!window.confirm(`Delete review from ${r.reviewerName}?`)) return;
    try {
      await this.api.deleteData(`agency/reviews/${r.id}`, { toast: { showError: false } });
      this.toast.success('Review removed');
      await this.load(this.meta().page);
      void this.refreshStats();
    } catch {
      this.toast.alert('Failed to delete review');
    }
  }
}
