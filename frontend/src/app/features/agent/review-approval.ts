import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, emptyMeta } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiMeta, ReviewRecord } from '../../core/models';
import { titleCase, toApiStatus } from '../../core/utils/status-class';
import { RatingStars } from '../../shared/rating-stars';
import { StatusDropdown } from '../../shared/status-dropdown';

/** `/agent/review-approval` — moderation queue for assigned companies. */
@Component({
  selector: 'app-review-approval-page',
  imports: [FormsModule, RatingStars, StatusDropdown],
  template: `
    <header><h1 class="text-2xl font-bold text-[#212121]">Review Approval</h1></header>
    <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
      @for (card of statCards(); track card.label) {
        <div class="yb-card p-4">
          <p class="text-xs text-gray-500">{{ card.label }}</p>
          <p class="text-2xl font-bold">{{ card.value }}</p>
        </div>
      }
    </div>
    <div class="yb-card flex flex-wrap items-center gap-3 p-4">
      <input
        class="yb-input flex-1"
        type="search"
        placeholder="Search reviews by name or content"
        [(ngModel)]="search"
        (ngModelChange)="onSearch()"
        aria-label="Search reviews"
      />
      <h2 class="text-sm font-semibold">All Reviews</h2>
      <select
        class="yb-input w-auto"
        [(ngModel)]="status"
        (ngModelChange)="load(1)"
        aria-label="Status filter"
      >
        <option value="">All statuses</option>
        @for (s of ['Approved', 'Pending', 'Rejected', 'On Hold', 'Banned']; track s) {
          <option [value]="s">{{ s }}</option>
        }
      </select>
    </div>
    @if (loading()) {
      <p class="text-gray-500">Loading reviews...</p>
    } @else if (rows().length === 0) {
      <div class="yb-card p-10 text-center text-gray-500">No reviews found.</div>
    } @else {
      <div class="yb-card overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-3 py-3">No</th>
              <th class="px-3 py-3">Reviewer</th>
              <th class="px-3 py-3">Company</th>
              <th class="px-3 py-3">Date</th>
              <th class="px-3 py-3">Rating</th>
              <th class="px-3 py-3">Status</th>
              <th class="px-3 py-3">Review</th>
              <th class="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.id; let i = $index) {
              <tr class="border-t border-gray-100">
                <td class="px-3 py-3 text-gray-500">
                  {{ (meta().page - 1) * meta().limit + i + 1 }}
                </td>
                <td class="px-3 py-3">
                  <p class="font-medium">{{ r.reviewerName }}</p>
                  <p class="text-xs text-gray-500">{{ r.reviewerEmail || '—' }}</p>
                </td>
                <td class="px-3 py-3">{{ r.companyName }}</td>
                <td class="px-3 py-3 text-gray-500">{{ r.date }}</td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-1">
                    <app-rating-stars [rating]="r.rating" size="xs" [showValue]="false" /><span
                      >{{ r.rating }}/5</span
                    >
                  </div>
                </td>
                <td class="px-3 py-3">
                  <app-status-dropdown
                    [value]="title(r.status)"
                    [options]="['Pending', 'Approved', 'Rejected', 'On Hold', 'Banned']"
                    (changed)="setStatus(r, $event)"
                  />
                </td>
                <td class="max-w-xs px-3 py-3">
                  <p class="line-clamp-2">{{ r.content }}</p>
                </td>
                <td class="px-3 py-3">
                  <button
                    type="button"
                    class="yb-btn bg-red-50 text-red-700"
                    [attr.data-testid]="'subadmin-delete-review-' + r.id"
                    [disabled]="deleting() === r.id"
                    (click)="remove(r)"
                  >
                    {{ deleting() === r.id ? 'Deleting' : 'Delete' }}
                  </button>
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
          @for (p of pageNumbers(); track p) {
            <button
              type="button"
              class="yb-btn"
              [class.yb-btn-gold]="p === meta().page"
              [class.yb-btn-outline]="p !== meta().page"
              (click)="load(p)"
            >
              {{ p }}
            </button>
          }
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
  `,
})
export class ReviewApprovalPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly rows = signal<ReviewRecord[]>([]);
  readonly all = signal<ReviewRecord[]>([]);
  readonly meta = signal<ApiMeta>(emptyMeta({ limit: 10 }));
  readonly loading = signal(true);
  readonly deleting = signal<number | null>(null);
  search = '';
  status = '';
  private timer: ReturnType<typeof setTimeout> | null = null;
  readonly pageNumbers = computed(() => {
    const total = this.meta().totalPages;
    const start = Math.max(1, Math.min(this.meta().page - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });
  readonly statCards = computed(() => {
    const list = this.all();
    const count = (s: string) => list.filter((r) => toApiStatus(r.status) === s).length;
    return [
      { label: 'Total', value: list.length },
      { label: 'Pending', value: count('pending') },
      { label: 'Approved', value: count('approved') },
      { label: 'Rejected', value: count('rejected') },
      { label: 'On Hold', value: count('on_hold') + count('hold') },
      { label: 'Banned', value: count('banned') },
    ];
  });

  ngOnInit(): void {
    void this.refreshStats();
    void this.load(1);
  }

  async refreshStats(): Promise<void> {
    try {
      this.all.set(
        (
          await this.api.list<ReviewRecord>(
            'subadmin/reviews',
            { limit: 200 },
            { toast: { showError: false } },
          )
        ).items,
      );
    } catch {
      this.all.set([]);
    }
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.api.list<ReviewRecord>(
        'subadmin/reviews',
        { page, limit: 10, search: this.search.trim(), status: toApiStatus(this.status) },
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

  title(value: unknown): string {
    return titleCase(value);
  }

  async setStatus(r: ReviewRecord, status: string): Promise<void> {
    try {
      await this.api.patchData(
        `agency/reviews/${r.id}`,
        { status: toApiStatus(status) },
        { toast: { showError: false } },
      );
      this.rows.update((list) =>
        list.map((x) => (x.id === r.id ? { ...x, status: toApiStatus(status) } : x)),
      );
      this.toast.success(`Review marked as ${status}`);
      void this.refreshStats();
    } catch {
      this.toast.alert('Failed to update review status');
    }
  }

  async remove(r: ReviewRecord): Promise<void> {
    if (!window.confirm(`Delete review from ${r.reviewerName || 'this reviewer'}?`)) return;
    this.deleting.set(r.id);
    try {
      await this.api.deleteData(`subadmin/reviews/${r.id}`, { toast: { showError: false } });
      this.toast.success('Review removed');
      await this.load(this.meta().page);
      void this.refreshStats();
    } catch {
      this.toast.alert('Failed to delete review');
    } finally {
      this.deleting.set(null);
    }
  }
}
