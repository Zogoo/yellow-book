import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AdminStats, CompanyRecord, ReviewRecord } from '../../core/models';
import { titleCase, toApiStatus } from '../../core/utils/status-class';
import { StatusDropdown } from '../../shared/status-dropdown';
import { RatingStars } from '../../shared/rating-stars';

interface RecentCompany {
  id: number;
  name: string;
  date: string;
  phone?: string | null;
  website?: string | null;
  category?: string;
  status: string;
  slug?: string;
}

/** `/admin/dashboard` — welcome stats, recent reviews and recent companies. */
@Component({
  selector: 'app-admin-dashboard-page',
  imports: [FormsModule, RouterLink, StatusDropdown, RatingStars],
  template: `
    <section class="rounded-2xl bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <h2 class="text-2xl font-bold text-[#212121]">
        Welcome back, {{ stats()?.welcomeName || 'User' }}
      </h2>
      <input
        class="yb-input mt-4 max-w-md"
        type="search"
        placeholder="Search companies by name or category"
        [(ngModel)]="search"
        (keydown.enter)="goSearch()"
        aria-label="Search companies"
      />
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (card of cards(); track card.label) {
          <div class="yb-card flex items-center gap-4 p-4">
            <span class="text-2xl">{{ card.icon }}</span>
            <div>
              <p class="text-xs text-gray-500">{{ card.label }}</p>
              <p class="text-2xl font-bold">{{ card.value }}</p>
            </div>
          </div>
        }
      </div>
    </section>

    <section class="yb-card p-5">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">Recent Reviews</h3>
        <a routerLink="/admin/manage-review" class="text-xs font-semibold text-[#1877f2]"
          >SHOW ALL</a
        >
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-3 py-2">Reviewer</th>
              <th class="px-3 py-2">Rating</th>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Review</th>
              <th class="px-3 py-2">Status</th>
              <th class="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (r of reviews(); track r.id) {
              <tr
                class="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                (click)="openReview(r)"
              >
                <td class="px-3 py-2 font-medium">{{ r.reviewerName || 'Anonymous' }}</td>
                <td class="px-3 py-2"><app-rating-stars [rating]="r.rating" size="xs" /></td>
                <td class="px-3 py-2 text-gray-500">{{ r.date }}</td>
                <td class="px-3 py-2">{{ firstWord(r.content) }}</td>
                <td class="px-3 py-2" (click)="$event.stopPropagation()">
                  <app-status-dropdown
                    [value]="title(r.status)"
                    [options]="['Pending', 'Approved', 'Rejected']"
                    (changed)="setReviewStatus(r, $event)"
                  />
                </td>
                <td class="px-3 py-2" (click)="$event.stopPropagation()">
                  <button
                    type="button"
                    class="text-red-600"
                    [attr.aria-label]="'Delete review by ' + r.reviewerName"
                    (click)="deleteReview(r)"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-3 py-6 text-center text-gray-500">No reviews yet.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="yb-card p-5">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">Recent Companies</h3>
        <a routerLink="/admin/manage-companies" class="text-xs font-semibold text-[#1877f2]"
          >SHOW ALL</a
        >
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-3 py-2">Company Name</th>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Phone</th>
              <th class="px-3 py-2">Website</th>
              <th class="px-3 py-2">Category</th>
              <th class="px-3 py-2">Status</th>
              <th class="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (c of companies(); track c.id) {
              <tr
                class="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                (click)="openCompany(c)"
              >
                <td class="px-3 py-2 font-medium">{{ c.name }}</td>
                <td class="px-3 py-2 text-gray-500">{{ c.date }}</td>
                <td class="px-3 py-2">{{ c.phone || '—' }}</td>
                <td class="px-3 py-2">
                  @if (c.website) {
                    <a
                      [href]="href(c.website)"
                      target="_blank"
                      rel="noopener"
                      class="text-[#1877f2]"
                      (click)="$event.stopPropagation()"
                      >{{ c.website }}</a
                    >
                  } @else {
                    —
                  }
                </td>
                <td class="px-3 py-2">{{ c.category }}</td>
                <td class="px-3 py-2" (click)="$event.stopPropagation()">
                  <app-status-dropdown
                    [value]="title(c.status)"
                    [options]="['Pending', 'Approved', 'Rejected']"
                    (changed)="setCompanyStatus(c, $event)"
                  />
                </td>
                <td class="px-3 py-2" (click)="$event.stopPropagation()">
                  <button
                    type="button"
                    class="text-red-600"
                    [attr.aria-label]="'Delete ' + c.name"
                    (click)="deleteCompany(c)"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-3 py-6 text-center text-gray-500">No companies yet.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class AdminDashboardPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly stats = signal<AdminStats | null>(null);
  readonly reviews = signal<ReviewRecord[]>([]);
  readonly companies = signal<RecentCompany[]>([]);
  readonly cards = signal<{ label: string; value: number; icon: string }[]>([]);
  search = '';

  async ngOnInit(): Promise<void> {
    const [stats, reviews, companies] = await Promise.all([
      this.api
        .getData<AdminStats>('admin/stats', undefined, { toast: { showError: false } })
        .catch(() => {
          this.toast.alert('Failed to load dashboard stats');
          return null;
        }),
      this.api
        .list<ReviewRecord>('agency/reviews', { limit: 5 }, { toast: { showError: false } })
        .catch(() => {
          this.toast.alert('Failed to load reviews');
          return null;
        }),
      this.api
        .list<RecentCompany>('companies/recent', { limit: 5 }, { toast: { showError: false } })
        .catch(() => {
          this.toast.alert('Failed to load recent companies');
          return null;
        }),
    ]);
    this.stats.set(stats);
    const s = stats ?? {
      registeredCompanies: 0,
      pendingVerifications: 0,
      rejectedVerifications: 0,
      totalReviews: 0,
      pendingReviews: 0,
      adminUsers: 0,
    };
    this.cards.set([
      { label: 'Registered Companies', value: s.registeredCompanies, icon: '🏢' },
      { label: 'Pending Verifications', value: s.pendingVerifications, icon: '⏱' },
      { label: 'Rejected Verifications', value: s.rejectedVerifications, icon: '⛔' },
      { label: 'Total Reviews', value: s.totalReviews, icon: '⭐' },
      { label: 'Pending Reviews', value: s.pendingReviews, icon: '⏳' },
      { label: 'Admin Users', value: s.adminUsers, icon: '👥' },
    ]);
    this.reviews.set(reviews?.items ?? []);
    this.companies.set(companies?.items ?? []);
  }

  goSearch(): void {
    void this.router.navigate(['/admin/manage-companies'], {
      queryParams: { search: this.search.trim() || null },
    });
  }

  firstWord(text: string): string {
    return (text || '').split(/\s+/)[0] ?? '';
  }

  title(value: unknown): string {
    return titleCase(value);
  }

  href(site: string): string {
    return /^https?:\/\//i.test(site) ? site : `https://${site}`;
  }

  openReview(r: ReviewRecord): void {
    void this.router.navigate(['/company/review', r.id]);
  }

  openCompany(c: RecentCompany): void {
    void this.router.navigate(['/agency'], {
      queryParams: { id: c.id, slug: c.slug, title: c.name },
    });
  }

  async setReviewStatus(r: ReviewRecord, status: string): Promise<void> {
    const previous = r.status;
    this.reviews.update((list) =>
      list.map((x) => (x.id === r.id ? { ...x, status: toApiStatus(status) } : x)),
    );
    try {
      await this.api.patchData(
        `agency/reviews/${r.id}`,
        { status: toApiStatus(status) },
        { toast: { showError: false } },
      );
      this.toast.success(`Review status updated to ${status}.`);
    } catch {
      this.reviews.update((list) =>
        list.map((x) => (x.id === r.id ? { ...x, status: previous } : x)),
      );
      this.toast.alert(`Failed to update the status for ${r.reviewerName}.`);
    }
  }

  async deleteReview(r: ReviewRecord): Promise<void> {
    if (!window.confirm(`Are you sure you want to delete the review by ${r.reviewerName}?`)) return;
    try {
      await this.api.deleteData(`agency/reviews/${r.id}`, { toast: { showError: false } });
      this.reviews.update((list) => list.filter((x) => x.id !== r.id));
      this.toast.success(`Review by ${r.reviewerName} has been permanently deleted.`);
    } catch {
      this.toast.alert(`Failed to delete the review by ${r.reviewerName}.`);
    }
  }

  async setCompanyStatus(c: RecentCompany, status: string): Promise<void> {
    const previous = c.status;
    this.companies.update((list) =>
      list.map((x) => (x.id === c.id ? { ...x, status: toApiStatus(status) } : x)),
    );
    try {
      await this.api.putData<CompanyRecord>(
        `companies/recent/${c.id}`,
        { status: toApiStatus(status) },
        { toast: { showError: false } },
      );
      this.toast.success(`Company ${c.name} status changed to ${status}.`);
    } catch {
      this.companies.update((list) =>
        list.map((x) => (x.id === c.id ? { ...x, status: previous } : x)),
      );
      this.toast.alert(`Failed to update status for ${c.name}. Please try again.`);
    }
  }

  async deleteCompany(c: RecentCompany): Promise<void> {
    if (!window.confirm(`Are you sure you want to delete ${c.name}?`)) return;
    try {
      await this.api.deleteData(`companies/recent/${c.id}`, { toast: { showError: false } });
      this.companies.update((list) => list.filter((x) => x.id !== c.id));
      this.toast.success(`The company ${c.name} has been successfully deleted.`);
    } catch {
      this.toast.alert(`Failed to delete ${c.name}. Please try again.`);
    }
  }
}
