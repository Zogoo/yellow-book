import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, emptyMeta } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiMeta, AssignmentRecord } from '../../core/models';
import { titleCase, toApiStatus } from '../../core/utils/status-class';
import { DetailItem, DetailModal } from '../../shared/detail-modal';
import { StatusDropdown } from '../../shared/status-dropdown';

/** `/agent/assign-companies` — the agent's assigned company queue. */
@Component({
  selector: 'app-assign-companies-page',
  imports: [FormsModule, DetailModal, StatusDropdown],
  template: `
    <header><h1 class="text-2xl font-bold text-[#212121]">My Assign Companies</h1></header>
    <div class="yb-card flex flex-wrap items-center gap-3 p-4">
      <input
        class="yb-input flex-1"
        type="search"
        placeholder="Search companies by name or category"
        [(ngModel)]="search"
        (ngModelChange)="onSearch()"
        aria-label="Search companies"
      />
      <h2 class="text-sm font-semibold">All List</h2>
      <select
        class="yb-input w-auto"
        [(ngModel)]="status"
        (ngModelChange)="load(1)"
        aria-label="Status filter"
      >
        <option value="">All Statuses</option>
        <option value="pending">pending</option>
        <option value="approved">verified</option>
        <option value="rejected">rejected</option>
      </select>
    </div>
    @if (loading()) {
      <p class="text-gray-500">Loading assigned companies...</p>
    } @else if (rows().length === 0) {
      <div class="yb-card p-10 text-center">
        <p class="font-semibold">No companies found matching your criteria</p>
        <p class="text-sm text-gray-500">Try adjusting your search or filters</p>
      </div>
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
              <th class="px-3 py-3">Company Name</th>
              <th class="px-3 py-3">Category</th>
              <th class="px-3 py-3">Status</th>
              <th class="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (c of rows(); track c.id; let i = $index) {
              <tr class="border-t border-gray-100">
                <td class="px-3 py-3">
                  <input
                    type="checkbox"
                    [checked]="selected().has(c.id)"
                    (change)="toggleOne(c.id)"
                    [attr.aria-label]="'Select ' + c.name"
                  />
                </td>
                <td class="px-3 py-3 text-gray-500">
                  {{ (meta().page - 1) * meta().limit + i + 1 }}
                </td>
                <td class="px-3 py-3 font-medium">
                  {{ c.name }}
                  @if (toApi(c.status) === 'approved') {
                    <span class="ml-1 text-green-600">✔</span>
                  }
                </td>
                <td class="px-3 py-3">{{ c.category }}</td>
                <td class="px-3 py-3">
                  <app-status-dropdown
                    [value]="label(c.status)"
                    [options]="['Pending', 'Verified', 'Rejected']"
                    (changed)="requestStatus(c, $event)"
                  />
                </td>
                <td class="px-3 py-3">
                  <button type="button" class="text-[#1877f2]" (click)="showDetails(c)">
                    Details
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <span>Showing {{ rangeStart() }} to {{ rangeEnd() }} of {{ meta().total }} companies</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="yb-btn yb-btn-outline"
            [disabled]="!meta().hasPrevious"
            (click)="load(meta().page - 1)"
          >
            Previous
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
    <app-detail-modal
      [open]="detail() !== null"
      title="Company Details"
      [items]="detailItems()"
      (close)="detail.set(null)"
    />

    @if (pending(); as p) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        (click)="pending.set(null)"
      >
        <div
          class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Update status?"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-lg font-bold">Update status?</h2>
          <p class="mt-2 text-sm text-gray-600">
            You're about to change <em>{{ p.company.name }}</em> from
            <em>{{ label(p.company.status) }}</em> to <em>{{ p.next }}</em
            >. Would you like to continue?
          </p>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="yb-btn yb-btn-outline" (click)="pending.set(null)">
              Cancel
            </button>
            <button
              type="button"
              class="yb-btn yb-btn-gold"
              [disabled]="busy()"
              (click)="confirmStatus()"
            >
              {{ busy() ? 'Updating…' : 'Confirm change' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AssignCompaniesPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly rows = signal<AssignmentRecord[]>([]);
  readonly meta = signal<ApiMeta>(emptyMeta({ limit: 8 }));
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly selected = signal(new Set<number>());
  readonly detail = signal<AssignmentRecord | null>(null);
  readonly pending = signal<{ company: AssignmentRecord; next: string } | null>(null);
  search = '';
  status = '';
  private timer: ReturnType<typeof setTimeout> | null = null;
  readonly allSelected = computed(
    () => this.rows().length > 0 && this.rows().every((r) => this.selected().has(r.id)),
  );
  readonly rangeStart = computed(() =>
    this.meta().total === 0 ? 0 : (this.meta().page - 1) * this.meta().limit + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.meta().total, this.meta().page * this.meta().limit),
  );
  readonly pageNumbers = computed(() => {
    const total = this.meta().totalPages;
    const start = Math.max(1, Math.min(this.meta().page - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });
  readonly detailItems = computed<DetailItem[]>(() => {
    const c = this.detail();
    return c
      ? [
          { label: 'Company Name', value: c.name },
          { label: 'ID', value: c.companyId },
          { label: 'Category', value: c.category },
          { label: 'Status', value: titleCase(c.status) },
          { label: 'Assigned Date', value: c.assignedDate?.slice(0, 10) },
          { label: 'Email', value: c.email },
          { label: 'Mobile', value: c.mobile },
          { label: 'Address', value: c.address },
        ]
      : [];
  });

  ngOnInit(): void {
    void this.load(1);
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.api.list<AssignmentRecord>(
        'subadmin/companies',
        { page, limit: 8, search: this.search.trim() },
        { toast: { showError: false } },
      );
      const items = this.status
        ? result.items.filter((c) => toApiStatus(c.status) === this.status)
        : result.items;
      this.rows.set(items);
      this.meta.set(result.meta);
    } catch {
      this.toast.alert('Failed to load assigned companies');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.load(1), 300);
  }

  toApi(value: unknown): string {
    return toApiStatus(value);
  }

  label(status: string): string {
    return toApiStatus(status) === 'approved' ? 'Verified' : titleCase(status);
  }

  showDetails(c: AssignmentRecord): void {
    this.detail.set(c);
    this.toast.info(`Showing details for ${c.name}`);
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

  requestStatus(c: AssignmentRecord, next: string): void {
    this.pending.set({ company: c, next });
  }

  async confirmStatus(): Promise<void> {
    const p = this.pending();
    if (!p) return;
    const apiStatus = p.next.toLowerCase() === 'verified' ? 'approved' : toApiStatus(p.next);
    this.busy.set(true);
    try {
      await this.api.putData(
        `subadmin/companies/${p.company.id}`,
        { status: apiStatus },
        { toast: { showError: false } },
      );
      this.rows.update((list) =>
        list.map((x) => (x.id === p.company.id ? { ...x, status: apiStatus } : x)),
      );
      this.toast.success(`Status for ${p.company.name} updated to ${p.next}.`);
    } catch {
      this.toast.alert(`Unable to update status for ${p.company.name}.`);
      await this.load(this.meta().page);
    } finally {
      this.busy.set(false);
      this.pending.set(null);
    }
  }
}
