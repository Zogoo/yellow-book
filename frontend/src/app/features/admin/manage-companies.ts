import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, emptyMeta } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiMeta, CompanyRecord } from '../../core/models';
import { titleCase, toApiStatus } from '../../core/utils/status-class';
import { DetailItem, DetailModal } from '../../shared/detail-modal';
import { StatusDropdown } from '../../shared/status-dropdown';

interface RegistrationOptions {
  categories: string[];
}

/** `/admin/manage-companies` — searchable, filterable company table with add/view/delete. */
@Component({
  selector: 'app-manage-companies-page',
  imports: [FormsModule, DetailModal, StatusDropdown],
  template: `
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold text-[#212121]">Company Management</h1>
      <button type="button" class="yb-btn yb-btn-gold" (click)="openAdd()">+ Add Company</button>
    </header>
    <div class="yb-card space-y-3 p-4">
      <input
        class="yb-input"
        type="search"
        placeholder="Search Companies By Name Or Category"
        [(ngModel)]="filters.search"
        (ngModelChange)="onSearch()"
        aria-label="Search companies"
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
          >Time Range
          <select class="yb-input" [(ngModel)]="filters.timeRange" (ngModelChange)="load(1)">
            <option value="">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
          </select>
        </label>
        <label class="text-xs text-gray-500"
          >Status
          <select class="yb-input" [(ngModel)]="filters.status" (ngModelChange)="load(1)">
            <option value="">Select Status</option>
            @for (s of statuses; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </label>
        <label class="text-xs text-gray-500"
          >Category
          <select class="yb-input" [(ngModel)]="filters.category" (ngModelChange)="load(1)">
            <option value="">Select Category</option>
            @for (c of categories(); track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </label>
      </div>
    </div>

    @if (loading()) {
      <p class="text-gray-500">Loading Company Data...</p>
    } @else if (rows().length === 0) {
      <div class="yb-card p-10 text-center">
        <h2 class="font-semibold">No companies found</h2>
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
              <th class="px-3 py-3">Company</th>
              <th class="px-3 py-3">Website</th>
              <th class="px-3 py-3">Mobile</th>
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
                  {{ pad((meta().page - 1) * meta().limit + i + 1) }}
                </td>
                <td class="px-3 py-3 font-medium">
                  {{ c.name }}
                  @if (c.verified) {
                    <span class="ml-1 text-green-600" title="Verified">✔</span>
                  }
                </td>
                <td class="px-3 py-3">{{ c.website || 'No website provided' }}</td>
                <td class="px-3 py-3">{{ c.mobile || c.phone || 'No contact number' }}</td>
                <td class="px-3 py-3">{{ c.category }}</td>
                <td class="px-3 py-3">
                  <app-status-dropdown
                    [value]="title(c.status)"
                    [options]="['Pending', 'Approved', 'Rejected']"
                    (changed)="setStatus(c, $event)"
                  />
                </td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-2">
                    <a
                      [href]="'/agency?title=' + encode(c.name) + '&id=' + c.id"
                      target="_blank"
                      rel="noopener"
                      class="text-gray-500"
                      [attr.aria-label]="'Open ' + c.name + ' public page'"
                      >↗</a
                    >
                    <button
                      type="button"
                      class="text-gray-600"
                      [attr.data-testid]="'admin-view-company-' + c.id"
                      [attr.aria-label]="'View ' + c.name"
                      (click)="view(c)"
                    >
                      👁
                    </button>
                    <button
                      type="button"
                      class="text-red-600"
                      [attr.data-testid]="'admin-delete-company-' + c.id"
                      [attr.aria-label]="'Delete ' + c.name"
                      (click)="remove(c)"
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
          >Showing {{ rows().length }} of {{ meta().total }} companies (Page {{ meta().page }} of
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

    @if (addOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        (click)="addOpen.set(false)"
      >
        <form
          class="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Add New Company Profile"
          (click)="$event.stopPropagation()"
          (ngSubmit)="submitAdd()"
          novalidate
        >
          <h2 class="text-lg font-bold">Add New Company Profile</h2>
          <p class="text-sm text-gray-500">
            Fill out the form below to create a new company profile in the system.
          </p>
          <div class="h-2 rounded-full bg-gray-100">
            <div
              class="h-2 rounded-full bg-[#fcc207]"
              [style.width.%]="(addStep() / 3) * 100"
            ></div>
          </div>
          <p class="text-xs text-gray-500">Step {{ addStep() }} of 3</p>
          @if (addStep() === 1) {
            <input
              class="yb-input"
              name="name"
              placeholder="e.g., Yellow.Book Travel Agency"
              [(ngModel)]="add.name"
              aria-label="Company Name"
            />
            <input
              class="yb-input"
              name="website"
              placeholder="https://www.yourcompany.com"
              [(ngModel)]="add.website"
              aria-label="Website"
            />
            <select
              class="yb-input"
              name="category"
              [(ngModel)]="add.category"
              aria-label="Category"
            >
              <option value="">Select Category</option>
              @for (c of categories(); track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          } @else if (addStep() === 2) {
            <select
              class="yb-input"
              name="employees"
              [(ngModel)]="add.employees"
              aria-label="Number of Employees"
            >
              <option value="">Number of Employees</option>
              @for (e of ['1-10', '11-30', '31-50', '51-100', '100+']; track e) {
                <option [value]="e">{{ e }}</option>
              }
            </select>
            <select
              class="yb-input"
              name="revenue"
              [(ngModel)]="add.revenue"
              aria-label="Annual Revenue"
            >
              <option value="">Annual Revenue</option>
              <option value="0-100k">0–100K MNT</option>
              <option value="100k-500k">100K–500K MNT</option>
              <option value="500k-1m">500K–1M MNT</option>
              <option value="1m+">1M+ MNT</option>
            </select>
            <textarea
              class="yb-input"
              rows="3"
              name="description"
              placeholder="Brief description of the company..."
              [(ngModel)]="add.description"
              aria-label="Company Description"
            ></textarea>
          } @else {
            <div class="grid gap-3 sm:grid-cols-2">
              <input
                class="yb-input"
                name="firstName"
                placeholder="John"
                [(ngModel)]="add.firstName"
                aria-label="First Name"
              />
              <input
                class="yb-input"
                name="lastName"
                placeholder="Doe"
                [(ngModel)]="add.lastName"
                aria-label="Last Name"
              />
            </div>
            <input
              class="yb-input"
              name="jobTitle"
              placeholder="e.g., CEO, Travel Agent"
              [(ngModel)]="add.jobTitle"
              aria-label="Job Title"
            />
            <div class="grid gap-3 sm:grid-cols-[140px_1fr]">
              <select
                class="yb-input"
                name="countryCode"
                [(ngModel)]="add.countryCode"
                aria-label="Country"
              >
                <option value="+976">🇲🇳 +976</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+86">🇨🇳 +86</option>
              </select>
              <input
                class="yb-input"
                name="phone"
                placeholder="Phone Number"
                [(ngModel)]="add.phone"
                aria-label="Phone Number"
              />
            </div>
            <input
              class="yb-input"
              type="email"
              name="ownerEmail"
              placeholder="Owner email (existing user)"
              [(ngModel)]="add.ownerEmail"
              aria-label="Owner email"
            />
          }
          <div class="flex justify-between">
            <button
              type="button"
              class="yb-btn yb-btn-outline"
              [disabled]="addStep() === 1"
              (click)="addStep.set(addStep() - 1)"
            >
              Previous
            </button>
            @if (addStep() < 3) {
              <button type="button" class="yb-btn yb-btn-gold" (click)="addStep.set(addStep() + 1)">
                Next
              </button>
            } @else {
              <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">Submit</button>
            }
          </div>
        </form>
      </div>
    }
  `,
})
export class ManageCompaniesPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly rows = signal<CompanyRecord[]>([]);
  readonly meta = signal<ApiMeta>(emptyMeta({ limit: 10 }));
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly selected = signal(new Set<number>());
  readonly detail = signal<CompanyRecord | null>(null);
  readonly addOpen = signal(false);
  readonly addStep = signal(1);
  readonly categories = signal<string[]>([]);
  readonly statuses = ['Approved', 'Pending', 'Rejected'];
  filters = { search: '', dateFrom: '', dateTo: '', timeRange: '', status: '', category: '' };
  add = {
    name: '',
    website: '',
    category: '',
    employees: '',
    revenue: '',
    description: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    countryCode: '+976',
    phone: '',
    ownerEmail: '',
  };
  private timer: ReturnType<typeof setTimeout> | null = null;
  readonly allSelected = computed(
    () => this.rows().length > 0 && this.rows().every((r) => this.selected().has(r.id)),
  );
  readonly detailItems = computed<DetailItem[]>(() => {
    const c = this.detail();
    if (!c) return [];
    return [
      { label: 'Company', value: c.name },
      { label: 'Category', value: c.category },
      { label: 'Website', value: c.website },
      { label: 'Mobile', value: c.mobile || c.phone },
      { label: 'Status', value: titleCase(c.status) },
      { label: 'Verified', value: c.verified },
    ];
  });
  readonly pageNumbers = computed(() =>
    [this.meta().page - 1, this.meta().page, this.meta().page + 1].filter(
      (p) => p >= 1 && p <= this.meta().totalPages,
    ),
  );

  ngOnInit(): void {
    this.filters.search = this.route.snapshot.queryParamMap.get('search') ?? '';
    void this.api
      .getData<RegistrationOptions>('company-registration-options', undefined, {
        toast: { showError: false },
      })
      .then((o) => this.categories.set(o?.categories ?? []))
      .catch(() => undefined);
    void this.load(1);
  }

  async load(page: number): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.api.list<CompanyRecord>(
        'companies',
        {
          page,
          limit: 10,
          search: this.filters.search.trim(),
          status: toApiStatus(this.filters.status),
          category: this.filters.category,
          dateFrom: this.filters.dateFrom,
          dateTo: this.filters.dateTo,
          timeRange: this.filters.timeRange,
        },
        { toast: { showError: false } },
      );
      this.rows.set(result.items);
      this.meta.set(result.meta);
      this.selected.set(new Set());
    } catch (e) {
      this.toast.alert(e instanceof Error ? e.message : 'Failed to load companies');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.router.navigate([], {
        queryParams: { search: this.filters.search.trim() || null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      void this.load(1);
    }, 300);
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  title(value: unknown): string {
    return titleCase(value);
  }

  encode(value: string): string {
    return encodeURIComponent(value);
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

  view(c: CompanyRecord): void {
    this.detail.set(c);
  }

  async setStatus(c: CompanyRecord, status: string): Promise<void> {
    try {
      await this.api.putData(
        `companies/${c.id}`,
        { status: toApiStatus(status) },
        { toast: { showError: false } },
      );
      this.rows.update((list) =>
        list.map((x) => (x.id === c.id ? { ...x, status: toApiStatus(status) } : x)),
      );
      this.toast.success(`${c.name} marked as ${status}`);
    } catch {
      this.toast.alert(`Failed to update ${c.name}`);
      await this.load(this.meta().page);
    }
  }

  async remove(c: CompanyRecord): Promise<void> {
    if (!window.confirm(`Are you sure you want to delete ${c.name}?`)) return;
    try {
      await this.api.deleteData(`companies/${c.id}`, { toast: { showError: false } });
      this.toast.success(`${c.name} removed`);
      await this.load(this.meta().page);
    } catch {
      this.toast.alert(`Failed to delete ${c.name}`);
    }
  }

  openAdd(): void {
    this.add = {
      name: '',
      website: '',
      category: '',
      employees: '',
      revenue: '',
      description: '',
      firstName: '',
      lastName: '',
      jobTitle: '',
      countryCode: '+976',
      phone: '',
      ownerEmail: '',
    };
    this.addStep.set(1);
    this.addOpen.set(true);
  }

  async submitAdd(): Promise<void> {
    if (!this.add.name.trim()) {
      this.toast.alert('Company name is required');
      return;
    }
    this.busy.set(true);
    try {
      let ownerUserId: number | undefined;
      if (this.add.ownerEmail.trim()) {
        const owners = await this.api.list<{ id: number; email: string }>(
          'users',
          { search: this.add.ownerEmail.trim(), limit: 1 },
          { toast: { showError: false } },
        );
        ownerUserId = owners.items[0]?.id;
      }
      if (!ownerUserId) {
        this.toast.alert('Enter the email of an existing user to own this company');
        return;
      }
      await this.api.postData(
        'companies',
        {
          name: this.add.name.trim(),
          website: this.add.website,
          category: this.add.category || 'General',
          mobile: this.add.phone ? `${this.add.countryCode}${this.add.phone}` : '',
          status: 'pending',
          verified: false,
          description: this.add.description,
          employees: this.add.employees,
          revenue: this.add.revenue,
          firstName: this.add.firstName,
          lastName: this.add.lastName,
          jobTitle: this.add.jobTitle,
          countryCode: this.add.countryCode,
          ownerUserId,
        },
        { toast: { showError: false } },
      );
      this.toast.success('Company added');
      this.addOpen.set(false);
      await this.load(1);
    } catch (e) {
      this.toast.alert(e instanceof Error ? e.message : 'Failed to create company');
    } finally {
      this.busy.set(false);
    }
  }
}
