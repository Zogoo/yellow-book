import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ReviewRecord } from '../../core/models';
import { getStatusClass, titleCase } from '../../core/utils/status-class';
import { RatingStars } from '../../shared/rating-stars';

/** `/company/review/:id` — review detail with the one-shot public reply composer. */
@Component({
  selector: 'app-company-review-detail-page',
  imports: [FormsModule, RouterLink, RatingStars],
  template: `
    <a routerLink="/company/review" class="text-sm text-[#1877f2]">← Back to reviews</a>
    @if (loading()) {
      <p class="text-gray-500">Loading review...</p>
    } @else if (!review()) {
      <div class="yb-card p-10 text-center text-gray-500">Review not found.</div>
    } @else {
      <article class="yb-card p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-[#212121]">
              {{ review()!.reviewerName }}
              <span class="text-sm font-normal text-gray-400">#{{ review()!.id }}</span>
            </h1>
            <p class="text-xs text-gray-400">
              {{ review()!.reviewerEmail || 'No email' }} · {{ review()!.date }}
              {{ review()!.time }}
            </p>
          </div>
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold"
            [class]="statusClass(review()!.status)"
            >{{ title(review()!.status) }}</span
          >
        </div>
        <div class="mt-3"><app-rating-stars [rating]="review()!.rating" size="sm" /></div>
        <p class="mt-3 text-gray-700">{{ review()!.content }}</p>
        <p class="mt-3 text-xs text-gray-500">
          👍 {{ review()!.likes }} · 👎 {{ review()!.dislikes }}
        </p>
      </article>
      <section class="yb-card p-6">
        <h2 class="text-lg font-semibold">Public reply</h2>
        @if (review()!.companyResponse && !submitted()) {
          <div class="mt-3 rounded-lg bg-[#fff9e6] p-4 text-sm">
            <p class="font-semibold">
              {{ review()!.companyResponse!.name }}
              <span class="font-normal text-gray-400">· {{ review()!.companyResponse!.date }}</span>
            </p>
            <p class="mt-1 text-gray-700">{{ review()!.companyResponse!.text }}</p>
          </div>
          <p class="mt-3 text-sm">
            Reply status:
            <span
              class="rounded-full px-2 py-1 text-xs font-semibold"
              [class]="statusClass(review()!.companyResponseStatus)"
              >{{ title(review()!.companyResponseStatus || 'pending') }}</span
            >
            @if ((review()!.companyResponseStatus || 'pending') === 'pending') {
              <span class="ml-2 text-gray-500"
                >Your reply is pending moderation before it appears publicly.</span
              >
            }
          </p>
        } @else if (!isOwner()) {
          <p class="mt-2 text-sm text-gray-500">Only the company owner can reply to this review.</p>
        } @else {
          <p class="mt-1 text-sm text-gray-500">
            You can reply once. Replies are reviewed by our moderators before they go live.
          </p>
          <textarea
            class="yb-input mt-3"
            rows="4"
            placeholder="Write your public reply for this review..."
            [(ngModel)]="replyText"
            [disabled]="submitting() || submitted()"
            aria-label="Reply text"
          ></textarea>
          <div class="mt-3 flex items-center gap-3">
            <button
              type="button"
              class="yb-btn yb-btn-gold"
              data-testid="company-review-submit-reply"
              [disabled]="submitting() || submitted() || !replyText.trim()"
              (click)="submitReply()"
            >
              {{
                submitting() ? 'Submitting...' : submitted() ? 'Reply submitted' : 'Submit reply'
              }}
            </button>
            @if (submitted()) {
              <span class="text-sm text-amber-600">Pending moderation</span>
            }
          </div>
        }
      </section>
    }
  `,
})
export class CompanyReviewDetailPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  readonly review = signal<ReviewRecord | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  // Only the company the review is about may reply to it.
  readonly isOwner = computed(() => {
    const review = this.review();
    const companyId = this.auth.user()?.companyId;
    return Boolean(review && companyId != null && companyId === review.companyId);
  });
  replyText = '';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    try {
      this.review.set(
        await this.api.getData<ReviewRecord>(`agency/reviews/${id}`, undefined, {
          toast: { showError: false },
        }),
      );
    } catch {
      this.review.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async submitReply(): Promise<void> {
    const review = this.review();
    if (!review || !this.replyText.trim()) return;
    this.submitting.set(true);
    try {
      const updated = await this.api.postData<ReviewRecord>(
        `agency/reviews/${review.id}/reply`,
        { reply_text: this.replyText.trim() },
        { toast: { showError: false } },
      );
      this.submitted.set(true);
      this.review.set(updated);
      this.toast.success('Reply submitted for moderation');
    } catch (e) {
      this.toast.alert(e instanceof Error ? e.message : 'Unable to submit reply');
    } finally {
      this.submitting.set(false);
    }
  }

  title(value: unknown): string {
    return titleCase(value);
  }

  statusClass(value: unknown): string {
    return getStatusClass(value);
  }
}
