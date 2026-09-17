import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, emptyMeta } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AdminRecord, ApiMeta } from '../../core/models';
import { formatDate, getRoleClass, titleCase, toApiStatus } from '../../core/utils/status-class';
import { DetailItem, DetailModal } from '../../shared/detail-modal';
import { StatusDropdown } from '../../shared/status-dropdown';

/** `/admin/admin-management` — admin accounts with view/edit/delete. */
@Component({
  selector: 'app-admin-management-page',
  imports: [FormsModule, RouterLink, DetailModal, StatusDropdown],
  template: `
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold text-[#212121]">Admin Management</h1>
      <a routerLink="/admin/create-sub-admin" class="yb-btn yb-btn-gold">+ Add Sub Admin</a>
    </header>
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
        placeholder="Search admins by name or email"
        [(ngModel)]="filters.search"
        (ngModelChange)="onSearch()"
        aria-label="Search admins"
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
          >Role<select class="yb-input" [(ngModel)]="filters.role" (ngModelChange)="load(1)">
            <option value="">All Roles</option>
            @for (r of roles; track r) {
              <option [value]="r">{{ r }}</option>
            }
          </select></label
        >
        <label class="text-xs text-gray-500"
          >Status<select class="yb-input" [(ngModel)]="filters.status" (ngModelChange)="load(1)">
            <option value="">All Status</option>
            @for (s of statuses; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select></label
        >
      </div>
    </div>
    @if (loading()) {
      <p class="text-gray-500">Loading admins...</p>
    } @else if (rows().length === 0) {
      <div class="yb-card p-10 text-center text-gray-500">No admins found</div>
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
              <th class="px-3 py-3">Admin Name</th>
              <th class="px-3 py-3">Email</th>
              <th class="px-3 py-3">Role</th>
              <th class="px-3 py-3">Status</th>
              <th class="px-3 py-3">Created On</th>
              <th class="px-3 py-3">Last Login</th>
              <th class="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (a of rows(); track a.id; let i = $index) {
              <tr class="border-t border-gray-100">
                <td class="px-3 py-3">
                  <input
                    type="checkbox"
                    [checked]="selected().has(a.id)"
                    (change)="toggleOne(a.id)"
                    [attr.aria-label]="'Select ' + a.name"
                  />
                </td>
                <td class="px-3 py-3 text-gray-500">
                  {{ pad((meta().page - 1) * meta().limit + i + 1) }}
                </td>
                <td class="px-3 py-3 font-medium">{{ a.name }}</td>
                <td class="px-3 py-3">{{ a.email }}</td>
                <td class="px-3 py-3">
                  <span
                    class="rounded-full px-2 py-1 text-xs font-semibold"
                    [class]="roleClass(a.role)"
                    >{{ a.role }}</span
                  >
                </td>
                <td class="px-3 py-3">
                  <app-status-dropdown
                    [value]="title(a.status)"
                    [options]="statuses"
                    (changed)="setStatus(a, $event)"
                  />
                </td>
                <td class="px-3 py-3 text-gray-500">{{ date(a.createdOn || a.createdAt) }}</td>
                <td class="px-3 py-3 text-gray-500">{{ date(a.lastLogin) }}</td>
                <td class="px-3 py-3">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="text-gray-600"
                      [attr.data-testid]="'admin-view-admin-' + a.id"
                      [attr.aria-label]="'View ' + a.name"
                      (click)="detail.set(a)"
                    >
                      👁
                    </button>
                    <button
                      type="button"
                      class="text-blue-600"
                      [attr.data-testid]="'admin-edit-admin-' + a.id"
                      [attr.aria-label]="'Edit ' + a.name"
                      (click)="openEdit(a)"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      class="text-red-600"
                      [attr.data-testid]="'admin-delete-admin-' + a.id"
                      [attr.aria-label]="'Delete ' + a.name"
                      (click)="remove(a)"
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
          >Showing {{ rows().length }} of {{ meta().total }} admins (Page {{ meta().page }} of
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
      title="Admin Details"
      [items]="detailItems()"
      (close)="detail.set(null)"
    />

    @if (editing(); as a) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        (click)="editing.set(null)"
      >
        <form
          class="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-admin-title"
          (click)="$event.stopPropagation()"
          (ngSubmit)="saveEdit(a)"
          novalidate
        >
          <h2 id="edit-admin-title" class="text-lg font-bold">Edit Admin</h2>
          <p class="text-sm text-gray-500">
            Update administrator details. Changes will take effect immediately.
          </p>
          <div>
            <label class="text-sm font-medium">Full name</label
            ><input
              class="yb-input"
              name="name"
              placeholder="e.g., Alex Johnson"
              [(ngModel)]="edit.name"
              required
            />
          </div>
          <div>
            <label class="text-sm font-medium">Email address</label
            ><input
              class="yb-input"
              type="email"
              name="email"
              placeholder="name@company.com"
              [(ngModel)]="edit.email"
              required
            />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Role</label
              ><select class="yb-input" name="role" [(ngModel)]="edit.role">
                @for (r of roles; track r) {
                  <option [value]="r">{{ r }}</option>
                }
                @if (edit.role && !roles.includes(edit.role)) {
                  <option [value]="edit.role">{{ edit.role }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Status</label
              ><select class="yb-input" name="status" [(ngModel)]="edit.status">
                @for (s of statuses; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm"
            ><input type="checkbox" name="verified" [(ngModel)]="edit.verified" /> Mark as verified
            admin</label
          >
          <div class="flex justify-end gap-2">
            <button type="button" class="yb-btn yb-btn-outline" (click)="editing.set(null)">
              Cancel
            </button>
            <button
              type="submit"
              class="yb-btn yb-btn-gold"
              [disabled]="busy() || !edit.name.trim() || !edit.email.trim()"
            >
              {{ busy() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class AdminManagementPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly rows = signal<AdminRecord[]>([]);
  readonly all = signal<AdminRecord[]>([]);
  readonly meta = signal<ApiMeta>(emptyMeta({ limit: 10 }));
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly selected = signal(new Set<number>());
  readonly detail = signal<AdminRecord | null>(null);
  readonly editing = signal<AdminRecord | null>(null);
  readonly roles = ['Super Admin', 'Admin', 'Moderator', 'Support'];
  readonly statuses = ['Active', 'Inactive', 'Suspended'];
  filters = { search: '', dateFrom: '', dateTo: '', timeRange: '', role: '', status: '' };
  edit = { name: '', email: '', role: 'Admin', status: 'Active', verified: true };
  private timer: ReturnType<typeof setTimeout> | null = null;
  readonly allSelected = computed(
    () => this.rows().length > 0 && this.rows().every((r) => this.selected().has(r.id)),
  );
  readonly statCards = computed(() => {
    const list = this.all();
    return [
      { label: 'Total Admins', value: list.length },
      { label: 'Active', value: list.filter((a) => toApiStatus(a.status) === 'active').length },
      { label: 'Inactive', value: list.filter((a) => toApiStatus(a.status) === 'inactive').length },
      {
        label: 'Super Admins',
        value: list.filter((a) => toApiStatus(a.role) === 'super_admin').length,
      },
    ];
  });
  readonly detailItems = computed<DetailItem[]>(() => {
    const a = this.detail();
    return a
      ? [
          { label: 'Name', value: a.name },
          { label: 'Email', value: a.email },
          { label: 'Role', value: a.role },
          { label: 'Status', value: titleCase(a.status) },
          { label: 'Verified', value: a.verified },
          { label: 'Created On', value: formatDate(a.createdOn || a.createdAt) },
          { label: 'Last Login', value: formatDate(a.lastLogin) },
        ]
      : [];
  });

  ngOnInit(): void {
    void this.refreshAll();
    void this.load(1);
  }

  async refreshAll(): Promise<void> {
    try {
      this.all.set(
        (
          await this.api.list<AdminRecord>(
            'admins',
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
      const result = await this.api.list<AdminRecord>(
        'admins',
        {
          page,
          limit: 10,
          search: this.filters.search.trim(),
          status: toApiStatus(this.filters.status),
          role: this.filters.role,
          dateFrom: this.filters.dateFrom,
          dateTo: this.filters.dateTo,
          timeRange: this.filters.timeRange,
        },
        { toast: { showError: false } },
      );
      this.rows.set(result.items);
      this.meta.set(result.meta);
    } catch {
      this.toast.alert('Failed to load admin data');
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

  roleClass(value: unknown): string {
    return getRoleClass(value);
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

  async setStatus(a: AdminRecord, status: string): Promise<void> {
    try {
      await this.api.putData(
        `admins/${a.id}`,
        { status: toApiStatus(status) },
        { toast: { showError: false } },
      );
      this.rows.update((list) => list.map((x) => (x.id === a.id ? { ...x, status } : x)));
      this.toast.success(`${a.name} marked as ${status}`);
      void this.refreshAll();
    } catch {
      this.toast.alert(`Failed to update ${a.name}`);
      await this.load(this.meta().page);
    }
  }

  openEdit(a: AdminRecord): void {
    this.edit = {
      name: a.name,
      email: a.email,
      role: a.role,
      status: titleCase(a.status),
      verified: a.verified,
    };
    this.editing.set(a);
  }

  async saveEdit(a: AdminRecord): Promise<void> {
    this.busy.set(true);
    try {
      const updated = await this.api.putData<AdminRecord>(
        `admins/${a.id}`,
        {
          name: this.edit.name.trim(),
          email: this.edit.email.trim(),
          role: this.edit.role,
          status: toApiStatus(this.edit.status),
          verified: this.edit.verified,
        },
        { toast: { showError: false } },
      );
      this.rows.update((list) => list.map((x) => (x.id === a.id ? { ...x, ...updated } : x)));
      this.toast.success('Admin updated');
      this.editing.set(null);
      void this.refreshAll();
    } catch (e) {
      this.toast.alert(e instanceof Error ? e.message : 'Failed to update admin');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(a: AdminRecord): Promise<void> {
    if (!window.confirm(`Are you sure you want to delete ${a.name}?`)) return;
    try {
      await this.api.deleteData(`admins/${a.id}`, { toast: { showError: false } });
      this.toast.success(`${a.name} removed`);
      await this.load(this.meta().page);
      void this.refreshAll();
    } catch (e) {
      this.toast.alert(e instanceof Error ? e.message : `Failed to delete ${a.name}`);
    }
  }
}
