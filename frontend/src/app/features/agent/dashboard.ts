import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AssignmentRecord, ReviewRecord } from '../../core/models';
import { toApiStatus } from '../../core/utils/status-class';
import { StatusDropdown } from '../../shared/status-dropdown';

/** `/agent/dashboard` — assigned companies awaiting verification and pending reviews. */
@Component({
  selector: 'app-agent-dashboard-page',
  imports: [FormsModule, RouterLink, StatusDropdown, SlicePipe],
  template: `
    <header class="rounded-2xl bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <h1 class="text-2xl font-bold text-[#212121]">My Assigned Tasks</h1>
      <p class="text-sm text-gray-600">
        Overview of companies awaiting verification and new reviews assigned to you.
      </p>
      <p class="mt-2 text-sm text-gray-500">
        Welcome! You have tasks that require your attention. Review the queues below and take action
        on each item.
      </p>
    </header>
    <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div class="space-y-6">
        <section class="yb-card p-5">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Companies Awaiting Your Verification</h2>
            <a routerLink="/agent/assign-companies" class="text-sm text-[#1877f2]">Show all</a>
          </div>
          @for (c of pendingCompanies(); track c.id) {
            <div
              class="flex items-center justify-between gap-3 border-t border-gray-100 py-3 first:border-0"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff9e6] font-bold"
                  >{{ c.name.charAt(0) }}</span
                >
                <div>
                  <p class="font-medium">{{ c.name }}</p>
                  <p class="text-xs text-gray-500">
                    <span class="rounded-full bg-gray-100 px-2 py-0.5">{{ c.category }}</span>
                    Assigned: {{ c.assignedDate | slice: 0 : 10 }}
                  </p>
                </div>
              </div>
              <button type="button" class="yb-btn yb-btn-gold" (click)="verifyTarget.set(c)">
                Review &amp; Verify
              </button>
            </div>
          } @empty {
            <p class="text-sm text-gray-500">No companies waiting for verification.</p>
          }
        </section>
        <section class="yb-card p-5">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold">New Reviews for Your Companies</h2>
            <a routerLink="/agent/review-approval" class="text-sm text-[#1877f2]">Show all</a>
          </div>
          @for (r of pendingReviews(); track r.id) {
            <div
              class="flex items-center justify-between gap-3 border-t border-gray-100 py-3 first:border-0"
            >
              <div>
                <p class="italic">“{{ r.content }}”</p>
                <p class="text-xs text-gray-500">
                  For: {{ r.companyName }} · {{ r.date }} | {{ r.time }} · Rating:
                  {{ r.rating }} Star
                </p>
              </div>
              <button type="button" class="yb-btn bg-[#feecb2]" (click)="moderateTarget.set(r)">
                Moderate Review
              </button>
            </div>
          } @empty {
            <p class="text-sm text-gray-500">No new reviews to moderate.</p>
          }
        </section>
      </div>
      <aside class="yb-card p-5 text-center">
        <h2 class="mb-4 text-lg font-semibold">Task Summary</h2>
        <svg viewBox="0 0 120 120" class="mx-auto h-40 w-40" aria-label="Task summary chart">
          <circle cx="60" cy="60" r="45" fill="none" stroke="#f1f5f9" stroke-width="12" />
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#3b82f6"
            stroke-width="12"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="circumference * (1 - companyShare())"
            transform="rotate(-90 60 60)"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#22c55e"
            stroke-width="12"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="circumference * (1 - reviewShare())"
            [attr.transform]="'rotate(' + (-90 + companyShare() * 360) + ' 60 60)'"
          />
          <text x="60" y="58" text-anchor="middle" font-size="18" font-weight="700">
            {{ totalTasks() }}
          </text>
          <text x="60" y="74" text-anchor="middle" font-size="9" fill="#6b7280">Total Tasks</text>
        </svg>
        <ul class="mt-4 space-y-1 text-left text-sm">
          <li>
            <span class="mr-2 inline-block h-3 w-3 rounded-full bg-blue-500"></span>Pending
            Verification ({{ pendingCompanies().length }})
          </li>
          <li>
            <span class="mr-2 inline-block h-3 w-3 rounded-full bg-green-500"></span>Pending Reviews
            ({{ pendingReviews().length }})
          </li>
        </ul>
      </aside>
    </div>

    @if (verifyTarget(); as c) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        (click)="verifyTarget.set(null)"
      >
        <div
          class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Review & Verify Company"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-lg font-bold">Review &amp; Verify Company</h2>
          <dl class="mt-3 space-y-1 text-sm">
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Company Name</dt>
              <dd>{{ c.name }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Category</dt>
              <dd>{{ c.category }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Industry</dt>
              <dd>{{ c.category }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Contact Email</dt>
              <dd>{{ c.email || '—' }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Phone Number</dt>
              <dd>{{ c.mobile || '—' }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Website</dt>
              <dd>
                @if (c.website) {
                  <a [href]="c.website" target="_blank" rel="noopener" class="text-[#e5b106]">{{
                    c.website
                  }}</a>
                } @else {
                  —
                }
              </dd>
            </div>
          </dl>
          <h3 class="mt-4 font-semibold">Verification Checklist</h3>
          <p class="text-xs text-gray-500">Select every step below before approving a company.</p>
          <div class="mt-2 space-y-2 text-sm">
            <label class="flex items-center gap-2"
              ><input type="checkbox" [(ngModel)]="checklist.phone" /> Verified Via Phone
              Call</label
            >
            <label class="flex items-center gap-2"
              ><input type="checkbox" [(ngModel)]="checklist.email" /> Verified Via Email</label
            >
            <label class="flex items-center gap-2"
              ><input type="checkbox" [(ngModel)]="checklist.website" /> Website Verified</label
            >
          </div>
          @if (!checklistComplete()) {
            <p class="mt-2 text-xs text-amber-600">
              Complete every checklist item before approving this company.
            </p>
          }
          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="yb-btn bg-red-600 text-white"
              [disabled]="checklistComplete()"
              (click)="decide(c, 'rejected')"
            >
              Reject Verification
            </button>
            <button
              type="button"
              class="yb-btn yb-btn-gold"
              [disabled]="!checklistComplete()"
              (click)="decide(c, 'approved')"
            >
              Approve Verification
            </button>
          </div>
        </div>
      </div>
    }

    @if (moderateTarget(); as r) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        (click)="moderateTarget.set(null)"
      >
        <div
          class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Review Details"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-lg font-bold">Review Details</h2>
          <dl class="mt-3 space-y-1 text-sm">
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
              <dd>{{ '★'.repeat(r.rating) }} ({{ r.rating }}/5)</dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-32 text-gray-500">Review</dt>
              <dd class="italic">“{{ r.content }}”</dd>
            </div>
            <div class="flex items-center gap-3">
              <dt class="w-32 text-gray-500">Status</dt>
              <dd>
                <app-status-dropdown
                  [value]="statusLabel(r.status)"
                  [options]="['Pending', 'Approved', 'Rejected', 'On Hold', 'Banned', 'Suspended']"
                  (changed)="setReviewStatus(r, $event)"
                />
              </dd>
            </div>
          </dl>
          <div class="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="yb-btn text-white"
              style="background:#228b22"
              (click)="setReviewStatus(r, 'Approved')"
            >
              Approve
            </button>
            <button
              type="button"
              class="yb-btn text-white"
              style="background:#b22222"
              (click)="setReviewStatus(r, 'Rejected')"
            >
              Reject
            </button>
            <button
              type="button"
              class="yb-btn"
              style="background:#ffd700"
              (click)="setReviewStatus(r, 'On Hold')"
            >
              On Hold
            </button>
            <button
              type="button"
              class="yb-btn bg-gray-500 text-white"
              (click)="setReviewStatus(r, 'Banned', 'Reviewer banned')"
            >
              Ban Reviewer
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AgentDashboardPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly assignments = signal<AssignmentRecord[]>([]);
  readonly reviews = signal<ReviewRecord[]>([]);
  readonly verifyTarget = signal<AssignmentRecord | null>(null);
  readonly moderateTarget = signal<ReviewRecord | null>(null);
  readonly circumference = 2 * Math.PI * 45;
  checklist = { phone: false, email: false, website: false };
  readonly pendingCompanies = computed(() =>
    this.assignments()
      .filter((a) => toApiStatus(a.status) === 'pending')
      .slice(0, 4),
  );
  readonly pendingReviews = computed(() =>
    this.reviews()
      .filter((r) => toApiStatus(r.status) === 'pending')
      .slice(0, 4),
  );
  readonly totalTasks = computed(
    () => this.pendingCompanies().length + this.pendingReviews().length,
  );
  readonly companyShare = computed(() => Math.min(1, this.pendingCompanies().length / 10));
  readonly reviewShare = computed(() => Math.min(1, this.pendingReviews().length / 10));

  async ngOnInit(): Promise<void> {
    const [assignments, reviews] = await Promise.all([
      this.api
        .list<AssignmentRecord>(
          'subadmin/companies',
          { limit: 100 },
          { toast: { showError: false } },
        )
        .catch(() => {
          this.toast.alert('Failed to load company assignments');
          return null;
        }),
      this.api
        .list<ReviewRecord>('subadmin/reviews', { limit: 100 }, { toast: { showError: false } })
        .catch(() => {
          this.toast.alert('Failed to load review tasks');
          return null;
        }),
    ]);
    this.assignments.set(assignments?.items ?? []);
    this.reviews.set(reviews?.items ?? []);
  }

  checklistComplete(): boolean {
    return this.checklist.phone && this.checklist.email && this.checklist.website;
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async decide(c: AssignmentRecord, status: 'approved' | 'rejected'): Promise<void> {
    try {
      await this.api.putData(
        `subadmin/companies/${c.id}`,
        { status },
        { toast: { showError: false } },
      );
      this.assignments.update((list) => list.map((a) => (a.id === c.id ? { ...a, status } : a)));
      this.toast.success(status === 'approved' ? 'Company verified' : 'Company rejection recorded');
    } catch {
      this.toast.alert(
        status === 'approved' ? 'Failed to verify company' : 'Failed to record company rejection',
      );
    } finally {
      this.verifyTarget.set(null);
      this.checklist = { phone: false, email: false, website: false };
    }
  }

  async setReviewStatus(
    r: ReviewRecord,
    status: string,
    message = 'Review status updated',
  ): Promise<void> {
    try {
      await this.api.patchData(
        `agency/reviews/${r.id}`,
        { status: toApiStatus(status) },
        { toast: { showError: false } },
      );
      this.reviews.update((list) =>
        list.map((x) => (x.id === r.id ? { ...x, status: toApiStatus(status) } : x)),
      );
      this.toast.success(message);
    } catch {
      this.toast.alert('Failed to update review status');
    } finally {
      this.moderateTarget.set(null);
    }
  }
}
