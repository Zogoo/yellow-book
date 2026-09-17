import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, emptyMeta } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiMeta, UserRecord } from '../../core/models';
import {
  formatDate,
  getSignupMethodClass,
  titleCase,
  toApiStatus,
} from '../../core/utils/status-class';
import { DetailItem, DetailModal } from '../../shared/detail-modal';
import { StatusDropdown } from '../../shared/status-dropdown';

/** `/admin/manage-users` */
@Component({
  selector: 'app-manage-users-page',
  imports: [FormsModule, DetailModal, StatusDropdown],
  template: `
    <header><h1 class="text-2xl font-bold text-[#212121]">User Management</h1></header>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      @for (card of statCards(); track card.label) {
        <div class="yb-card p-4">
          <p class="text-xs text-gray-500">{{ card.label }}</p>
          <p class="text-2xl font-bold">{{ card.value }}</p>
        </div>
      }
    </div>
    <div class="yb-card space-y-3 p-4">
      <input
        class="yb-input"
        type="search"
        placeholder="Search users by name or email"
        [(ngModel)]="filters.search"
        (ngModelChange)="onSearch()"
        aria-label="Search users"
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
          >Status
          <select
            class="yb-input"
            [(ngModel)]="filters.status"
            (ngModelChange)="load(1)"
            aria-label="Status filter"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending">Pending</option>
          </select>
        </label>
        <label class="text-xs text-gray-500"
          >Signup Method
          <select class="yb-input" [(ngModel)]="filters.signupMethod" (ngModelChange)="load(1)">
            <option value="">Signup Method</option>
            @for (m of signupMethods(); track m) {
              <option [value]="m">{{ m }}</option>
            }
          </select>
        </label>
      </div>
    </div>
    @if (loading()) {
      <p class="text-gray-500">Loading Users...</p>
    } @else if (rows().length === 0) {
      <div class="yb-card p-10 text-center text-gray-500">No users found</div>
    } @else {
      <div class="yb-card overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-3 py-3">
                <input
                  type="checkbox"
                  [checked]="allSelected()"
                  (change)="toggleAll()"
                  aria-label="Select all"
                />
              </th>
              <th class="px-3 py-3">No</th>
              <th class="px-3 py-3">Name</th>
              <th class="px-3 py-3">Email</th>
              <th class="px-3 py-3">Signup Method</th>
              <th class="px-3 py-3">Signup Date</th>
              <th class="px-3 py-3">Status</th>
              <th class="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (u of rows(); track u.id; let i = $index) {
              <tr class="border-t border-gray-100">
                <td class="px-3 py-3">
                  <input
                    type="checkbox"
                    [checked]="selected().has(u.id)"
                    (change)="toggleOne(u.id)"
                    [attr.aria-label]="'Select ' + u.name"
                  />
                </td>
                <td class="px-3 py-3 text-gray-500">
                  {{ pad((meta().page - 1) * meta().limit + i + 1) }}
                </td>
                <td class="px-3 py-3 font-medium">
                  {{ u.name }}
                  @if (u.verified) {
                    <span class="ml-1 text-green-600">✔</span>
                  }
                </td>
                <td class="px-3 py-3">{{ u.email }}</td>
                <td class="px-3 py-3">
                  <span
                    class="rounded-full px-2 py-1 text-xs font-semibold"
                    [class]="methodClass(u.signupMethod)"
                    >{{ u.signupMethod || 'Email' }}</span
                  >
                </td>
                <td class="px-3 py-3 text-gray-500">{{ date(u.signupDate || u.createdAt) }}</td>
                <td class="px-3 py-3">
                  <app-status-dropdown
                    [value]="title(u.status)"
                    [options]="['Active', 'Inactive', 'Suspended', 'Pending']"
                    (changed)="setStatus(u, $event)"
                  />
                </td>
                <td class="px-3 py-3">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="text-gray-600"
                      [attr.data-testid]="'admin-view-user-' + u.id"
                      [attr.aria-label]="'View ' + u.name"
                      (click)="detail.set(u)"
                    >
                      👁
                    </button>
                    <button
                      type="button"
                      class="text-red-600"
                      [attr.data-testid]="'admin-delete-user-' + u.id"
                      [attr.aria-label]="'Delete ' + u.name"
                      (click)="remove(u)"
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
        <span
          >Showing {{ rows().length }} of {{ meta().total }} users (Page {{ meta().page }} of
          {{ meta().totalPages }})</span
        >
        <div class="flex gap-2">
          <button
            type="button"
            class="yb-btn yb-btn-outline"
            [disabled]="!meta().hasPrevious"
            (click)="load(meta().page - 1)"
          >
            Previous
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
    <app-detail-modal
      [open]="detail() !== null"
      title="User Details"
      [items]="detailItems()"
      (close)="detail.set(null)"
    />
  `,
})
export class ManageUsersPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly rows = signal<UserRecord[]>([]);
  readonly all = signal<UserRecord[]>([]);
  readonly meta = signal<ApiMeta>(emptyMeta({ limit: 10 }));
  readonly loading = signal(true);
  readonly selected = signal(new Set<number>());
  readonly detail = signal<UserRecord | null>(null);
  filters = { search: '', dateFrom: '', dateTo: '', timeRange: '', status: '', signupMethod: '' };
  private timer: ReturnType<typeof setTimeout> | null = null;
  readonly allSelected = computed(
    () => this.rows().length > 0 && this.rows().every((r) => this.selected().has(r.id)),
  );
  readonly signupMethods = computed(() =>
    [...new Set(this.all().map((u) => u.signupMethod || 'Email'))].sort(),
  );
  readonly statCards = computed(() => {
    const list = this.all();
    const by = (pred: (m: string) => boolean) =>
      list.filter((u) => pred((u.signupMethod || 'email').toLowerCase())).length;
    return [
      { label: 'Total Users', value: this.meta().total || list.length },
      { label: 'Google Signups', value: by((m) => m === 'google') },
      {
        label: 'Social Signups',
        value: by((m) => ['facebook', 'twitter', 'linkedin'].includes(m)),
      },
      { label: 'Email Signups', value: by((m) => m === 'email') },
    ];
  });
  readonly detailItems = computed<DetailItem[]>(() => {
    const u = this.detail();
    return u
      ? [
          { label: 'Name', value: u.name },
          { label: 'Email', value: u.email },
          { label: 'Signup Method', value: u.signupMethod },
          { label: 'Signup Date', value: formatDate(u.signupDate || u.createdAt) },
          { label: 'Status', value: titleCase(u.status) },
          { label: 'Verified', value: u.verified },
        ]
      : [];
  });

  ngOnInit(): void {
    void this.api
      .list<UserRecord>('users', { limit: 200 }, { toast: { showError: false } })
      .then((r) => this.all.set(r.items))
      .catch(() => undefined);
    void this.load(1);
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.api.list<UserRecord>(
        'users',
        {
          page,
          limit: 10,
          search: this.filters.search.trim(),
          status: toApiStatus(this.filters.status),
          signupMethod: this.filters.signupMethod,
          dateFrom: this.filters.dateFrom,
          dateTo: this.filters.dateTo,
          timeRange: this.filters.timeRange,
        },
        { toast: { showError: false } },
      );
      this.rows.set(result.items);
      this.meta.set(result.meta);
    } catch {
      this.toast.alert('Failed to load users');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.load(1), 300);
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  title(value: unknown): string {
    return titleCase(value);
  }

  date(value: unknown): string {
    return formatDate(value);
  }

  methodClass(value: unknown): string {
    return getSignupMethodClass(value);
  }

  toggleAll(): void {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.rows().map((r) => r.id)));
  }

  toggleOne(id: number): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async setStatus(u: UserRecord, status: string): Promise<void> {
    try {
      await this.api.putData(
        `users/${u.id}`,
        { status: toApiStatus(status) },
        { toast: { showError: false } },
      );
      this.rows.update((list) => list.map((x) => (x.id === u.id ? { ...x, status } : x)));
      this.toast.success(`${u.name} status -> ${status}`);
    } catch (e) {
      this.toast.alert(e instanceof Error ? e.message : `Failed to update ${u.name}`);
      await this.load(this.meta().page);
    }
  }

  async remove(u: UserRecord): Promise<void> {
    if (!window.confirm(`Are you sure you want to delete ${u.name}?`)) return;
    try {
      await this.api.deleteData(`users/${u.id}`, { toast: { showError: false } });
      this.toast.success(`${u.name} removed`);
      await this.load(this.meta().page);
    } catch {
      this.toast.alert(`Failed to delete ${u.name}`);
    }
  }
}
