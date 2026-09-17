import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DirectoryListing, DirectoryService } from '../../core/services/directory.service';
import { ToastService } from '../../core/services/toast.service';
import { CompanyRecord, ReviewRecord } from '../../core/models';
import { getDefaultListingImage, slugify } from '../../core/utils/status-class';
import { Footer } from '../../layouts/footer';
import { RatingStars } from '../../shared/rating-stars';
import { StarRatingBox } from '../../shared/star-rating-box';

interface AgencyView {
  id: number | null;
  name: string;
  slug: string;
  rating: number;
  ratingCount: number;
  tagline: string;
  about: string;
  website: string;
  phone: string;
  email: string;
  location: string;
  revenue: string;
  employees: string;
  industry: string;
  category: string;
  ownerName: string;
  ownerTitle: string;
  ownerBio: string;
  heroImage: string;
  logoImage: string;
  profileImage: string;
}

const DEFAULT_BIO =
  "I'm a dedicated agency owner passionate about delivering trusted services, building long-term relationships and helping every client find exactly what they need.";

/** `/agency?slug=&id=&title=&reviewId=` — public company profile with reviews. */
@Component({
  selector: 'app-agency-page',
  imports: [FormsModule, Footer, RatingStars, StarRatingBox],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="mb-4 flex items-center gap-4 text-sm">
        <button type="button" class="yb-btn yb-btn-outline" (click)="back()">← Back</button>
        <nav aria-label="Breadcrumb" class="text-gray-500">
          Agency <span class="mx-1">›</span>
          <span class="text-sky-500">{{ agency().name || 'Unknown' }}</span>
        </nav>
      </div>

      <section class="relative mb-16">
        <img
          [src]="agency().heroImage"
          [alt]="agency().name"
          class="h-64 w-full rounded-3xl object-cover md:h-[50vh]"
        />
        <div
          class="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-2xl border-4 border-white bg-white shadow-lg"
        >
          <img [src]="agency().logoImage" alt="" class="h-20 w-20 rounded-xl object-cover" />
        </div>
      </section>
      <section class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-[#212121]">
          {{ agency().name || 'Loading agency...' }}
        </h1>
        <p class="mt-1 text-gray-500">{{ agency().tagline }}</p>
        <div class="mt-2 flex items-center justify-center gap-2">
          <app-rating-stars
            [rating]="overallRating()"
            size="sm"
            color="#FFC107"
            emptyColor="#E0E0E0"
            [showValue]="false"
          />
          <span class="font-bold">{{ overallRating().toFixed(1) }}</span>
          <span class="text-sm text-gray-500">({{ reviews().length }} reviews)</span>
        </div>
      </section>

      <section class="mb-8 rounded-3xl bg-[#fff5f5] p-6">
        <h2 class="mb-2 text-xl font-bold text-[#212121]">About the Agency</h2>
        <p class="text-gray-600">{{ agency().about }}</p>
      </section>

      <section class="mb-10 grid gap-6 md:grid-cols-2">
        <div class="yb-card p-6">
          <h2 class="mb-4 text-lg font-bold text-[#212121]">Company Information</h2>
          <dl class="space-y-3 text-sm">
            <div class="flex gap-2">
              <dt class="w-44 text-gray-500">🌐 Website:</dt>
              <dd>
                <a
                  [href]="websiteHref()"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 hover:underline"
                  >{{ agency().website }} ↗</a
                >
              </dd>
            </div>
            <div class="flex gap-2">
              <dt class="w-44 text-gray-500">📞 Phone Number:</dt>
              <dd>{{ agency().phone }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="w-44 text-gray-500">✉ Work email:</dt>
              <dd>{{ agency().email }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="w-44 text-gray-500">📍 Location:</dt>
              <dd>{{ agency().location }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="w-44 text-gray-500">💲 Annual Revenue:</dt>
              <dd>{{ agency().revenue }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="w-44 text-gray-500">👥 Number of Employees:</dt>
              <dd>{{ agency().employees }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="w-44 text-gray-500">🏭 Industry:</dt>
              <dd>{{ agency().industry }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="w-44 text-gray-500">🏷 Company Category:</dt>
              <dd>{{ agency().category }}</dd>
            </div>
          </dl>
        </div>
        <div class="yb-card flex flex-col items-center p-6 text-center">
          <img [src]="agency().profileImage" alt="" class="h-24 w-24 rounded-full object-cover" />
          <h3 class="mt-3 text-lg font-semibold">{{ agency().ownerName }}</h3>
          <p class="text-sm text-gray-500">{{ agency().ownerTitle }}</p>
          <p class="mt-3 text-sm text-gray-600 italic">“{{ agency().ownerBio }}”</p>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 class="flex items-center gap-2 text-xl font-bold text-[#212121]">
              💬 Customer Reviews
            </h2>
            <div class="flex items-center gap-2">
              <div class="relative">
                <button
                  type="button"
                  class="yb-btn yb-btn-outline"
                  (click)="filterOpen.set(!filterOpen())"
                  [attr.aria-expanded]="filterOpen()"
                >
                  Filter <span [class.rotate-180]="filterOpen()">⌄</span>
                </button>
                @if (filterOpen()) {
                  <div
                    class="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-100 bg-white p-4 shadow-xl"
                  >
                    <h3 class="mb-2 text-sm font-semibold">Filter Options</h3>
                    <p class="mb-1 text-xs text-gray-500">Review Score</p>
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <label class="flex items-center gap-2 py-0.5 text-sm"
                        ><input
                          type="checkbox"
                          [checked]="scoreFilter().has(star)"
                          (change)="toggleScore(star)"
                        />
                        {{ star }} Star</label
                      >
                    }
                    <p class="mt-3 mb-1 text-xs text-gray-500">Date Filter</p>
                    @for (option of dateOptions; track option.value) {
                      <label class="flex items-center gap-2 py-0.5 text-sm"
                        ><input
                          type="radio"
                          name="dateFilter"
                          [checked]="dateFilter() === option.value"
                          (change)="dateFilter.set(option.value)"
                        />
                        {{ option.label }}</label
                      >
                    }
                  </div>
                }
              </div>
              <a [href]="websiteHref()" target="_blank" rel="noopener" class="yb-btn yb-btn-gold"
                >Go to website ↗</a
              >
            </div>
          </div>

          @if (reviewsLoading()) {
            <p class="py-10 text-center text-gray-500">Loading reviews...</p>
          } @else if (filteredReviews().length === 0) {
            <p class="py-10 text-center text-gray-500">No reviews found.</p>
          }
          <div class="space-y-4">
            @for (review of filteredReviews(); track review.id) {
              <article
                [id]="'agency-review-' + review.id"
                class="yb-card p-5"
                [class.ring-2]="isHighlighted(review)"
                [class.ring-amber-400]="isHighlighted(review)"
                [class.ring-offset-2]="isHighlighted(review)"
                [class.shadow-lg]="isHighlighted(review)"
              >
                <div class="flex items-start gap-3">
                  <img
                    [src]="review.avatar || 'https://i.pravatar.cc/150?img=' + (review.id % 70)"
                    alt=""
                    class="h-12 w-12 rounded-full object-cover"
                  />
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <h3 class="font-semibold text-[#212121]">{{ review.reviewerName }}</h3>
                      <app-star-rating-box
                        [rating]="review.rating"
                        [readonly]="true"
                        [boxSize]="28"
                        [iconSize]="16"
                      />
                    </div>
                    <p class="mt-2 text-gray-600 italic">“{{ review.content }}”</p>
                    <p class="mt-1 text-xs text-gray-400">Date: {{ review.date }}</p>
                  </div>
                </div>
                <div class="mt-4 flex items-center gap-6 border-t border-gray-100 pt-3 text-sm">
                  <button
                    type="button"
                    class="flex items-center gap-1"
                    [class.text-gray-400]="!canLikeDislike()"
                    [disabled]="!canLikeDislike()"
                    (click)="react(review, 'like')"
                    aria-label="Like review"
                  >
                    <img src="/thumb_up.svg" alt="" class="h-4 w-4" /> {{ review.likes }}
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-1"
                    [class.text-gray-400]="!canLikeDislike()"
                    [disabled]="!canLikeDislike()"
                    (click)="react(review, 'dislike')"
                    aria-label="Dislike review"
                  >
                    <img src="/Frame.svg" alt="" class="h-4 w-4" /> {{ review.dislikes }}
                  </button>
                </div>
                @if (review.companyResponse) {
                  <div class="mt-4 ml-6 border-l-2 border-[#fcc207] pl-4">
                    <div class="flex items-center gap-2">
                      <img
                        [src]="review.companyResponse.avatar || agency().profileImage"
                        alt=""
                        class="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <p class="text-sm font-semibold">
                          {{ review.companyResponse.name || agency().name }}
                        </p>
                        <p class="text-xs text-gray-400">Date: {{ review.companyResponse.date }}</p>
                      </div>
                    </div>
                    <p class="mt-2 text-sm text-gray-600 italic">
                      {{ review.companyResponse.text }}
                    </p>
                  </div>
                }
              </article>
            }
          </div>

          <div
            class="yb-card mt-6 flex cursor-pointer flex-col items-center gap-3 p-6 text-center"
            (click)="openReviewModal()"
            role="button"
            tabindex="0"
            (keydown.enter)="openReviewModal()"
          >
            <h3 class="text-lg font-semibold text-[#212121]">Give me your rating &amp; feedback</h3>
            <app-star-rating-box [rating]="0" [readonly]="true" [boxSize]="40" [iconSize]="24" />
          </div>
        </div>

        <aside class="yb-card h-fit p-6 text-center">
          <p class="text-5xl font-bold text-[#212121]">{{ overallRating().toFixed(1) }}</p>
          <p class="text-sm font-semibold text-[#e5b106]">{{ ratingLabel() }}</p>
          <div class="my-2 flex justify-center">
            <app-rating-stars [rating]="5" size="md" [showValue]="false" />
          </div>
          <p class="text-xs text-gray-500">({{ reviews().length }} Reviews)</p>
          <div class="mt-4 space-y-2">
            @for (row of breakdown(); track row.star) {
              <div class="flex items-center gap-2 text-xs">
                <span class="w-10 text-left">{{ row.star }} ★</span>
                <div class="h-2 flex-1 rounded-full bg-gray-100">
                  <div class="h-2 rounded-full bg-[#fcc207]" [style.width.%]="row.percent"></div>
                </div>
                <span class="w-6 text-right">{{ row.count }}</span>
              </div>
            }
          </div>
        </aside>
      </section>
    </div>

    @if (modalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        (click)="modalOpen.set(false)"
      >
        <form
          class="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Write a review"
          (click)="$event.stopPropagation()"
          (ngSubmit)="submitReview()"
        >
          <h2 class="text-xl font-bold">Share your experience with {{ agency().name }}</h2>
          <div class="flex justify-center">
            <app-star-rating-box [(rating)]="form.rating" [boxSize]="44" [iconSize]="26" />
          </div>
          <input
            class="yb-input"
            placeholder="Your name"
            [(ngModel)]="form.reviewerName"
            name="reviewerName"
          />
          <input
            class="yb-input"
            type="email"
            placeholder="Your email"
            [(ngModel)]="form.reviewerEmail"
            name="reviewerEmail"
          />
          <textarea
            class="yb-input"
            rows="4"
            placeholder="Write your review..."
            [(ngModel)]="form.content"
            name="content"
            required
          ></textarea>
          <div class="flex justify-end gap-2">
            <button type="button" class="yb-btn yb-btn-outline" (click)="modalOpen.set(false)">
              Cancel
            </button>
            <button type="submit" class="yb-btn yb-btn-gold" [disabled]="submitting()">
              {{ submitting() ? 'Submitting...' : 'Submit review' }}
            </button>
          </div>
        </form>
      </div>
    }
    <app-footer />
  `,
})
export class AgencyPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly directory = inject(DirectoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly listing = signal<DirectoryListing | null>(null);
  readonly company = signal<CompanyRecord | null>(null);
  readonly reviews = signal<ReviewRecord[]>([]);
  readonly reviewsLoading = signal(true);
  readonly highlightReviewId = signal<string>('');
  readonly filterOpen = signal(false);
  readonly scoreFilter = signal(new Set<number>());
  readonly dateFilter = signal<'all' | '30' | '90' | '180' | '365'>('all');
  readonly modalOpen = signal(false);
  readonly submitting = signal(false);
  readonly dateOptions = [
    { value: 'all' as const, label: 'All Reviews' },
    { value: '30' as const, label: 'Last 30 Days' },
    { value: '90' as const, label: 'Last 3 Months' },
    { value: '180' as const, label: 'Last 6 Months' },
    { value: '365' as const, label: 'Last 12 Months' },
  ];
  form = { rating: 0, reviewerName: '', reviewerEmail: '', content: '' };
  private companyId: number | null = null;

  readonly canLikeDislike = computed(() => {
    const role = this.auth.role();
    return this.auth.isAuthenticated() && (role === 'user' || role === 'company');
  });
  readonly overallRating = computed(() => {
    const list = this.reviews();
    if (!list.length) return this.listing()?.rating ?? this.company()?.rating ?? 0;
    return list.reduce((sum, r) => sum + Number(r.rating || 0), 0) / list.length;
  });
  readonly ratingLabel = computed(() => {
    const r = this.overallRating();
    if (r >= 4.5) return 'Excellent';
    if (r >= 4) return 'Great';
    if (r >= 3) return 'Good';
    if (r >= 2) return 'Fair';
    if (r > 0) return 'Poor';
    return 'No ratings';
  });
  readonly breakdown = computed(() => {
    const total = this.reviews().length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = this.reviews().filter((r) => Math.round(Number(r.rating)) === star).length;
      return { star, count, percent: (count / total) * 100 };
    });
  });
  readonly filteredReviews = computed(() => {
    const days = this.dateFilter() === 'all' ? null : Number(this.dateFilter());
    const cutoff = days ? Date.now() - days * 86400000 : null;
    return this.reviews().filter((r) => {
      if (this.scoreFilter().size && !this.scoreFilter().has(Math.round(Number(r.rating))))
        return false;
      if (cutoff && new Date(r.createdAt || r.date).getTime() < cutoff) return false;
      return true;
    });
  });
  readonly agency = computed<AgencyView>(() => {
    const l = this.listing();
    const c = this.company();
    const name = l?.name || c?.name || '';
    const serviceType = l?.serviceType || c?.serviceType || c?.category || 'professional';
    const location = l?.location || c?.location || 'Ulaanbaatar, Mongolia';
    const category = l?.category || c?.category || 'Software Company';
    const rawWebsite = l?.website || c?.website || '';
    const owner =
      c?.ownerName ||
      (c?.firstName || c?.lastName ? `${c?.firstName ?? ''} ${c?.lastName ?? ''}`.trim() : '');
    return {
      id: l?.id ?? c?.id ?? null,
      name,
      slug: l?.slug || (c ? slugify(c.name) : ''),
      rating: l?.rating ?? c?.rating ?? 0,
      ratingCount: l?.ratingCount ?? c?.ratingCount ?? 0,
      tagline:
        c?.tagline ||
        (name
          ? `Top-rated ${serviceType} in ${location}`
          : 'Your trusted partner for global adventures and professional services.'),
      about:
        c?.description ||
        l?.description ||
        (name
          ? `Discover ${name} — delivering ${serviceType} with excellence in ${location}.`
          : 'Discover our agency — delivering quality services with excellence.'),
      website: rawWebsite || `www.${name || 'Mongolia Explorer Travel'}.com`,
      phone: c?.phone || c?.mobile || c?.phoneNumber || '+976 1234 5678',
      email: c?.contactEmail || c?.email || 'contact@example.com',
      location,
      revenue: c?.revenue || l?.revenue || '10000000',
      employees: c?.employees || '10-20',
      industry: c?.industry || category,
      category,
      ownerName: owner || 'Agency Team',
      ownerTitle: c?.jobTitle || 'CEO & Founder',
      ownerBio: DEFAULT_BIO,
      heroImage: l?.image || c?.image || getDefaultListingImage(category) || '/logo/image6.png',
      logoImage: '/logo/image7.png',
      profileImage: '/profile.png',
    };
  });

  constructor() {
    effect(() => {
      const id = this.highlightReviewId();
      if (!id || this.reviewsLoading()) return;
      let attempts = 0;
      const tryScroll = () => {
        const el = document.getElementById(`agency-review-${id}`);
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }
        if (attempts++ < 6) setTimeout(tryScroll, 120);
      };
      setTimeout(tryScroll, 50);
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.highlightReviewId.set((params.get('reviewId') ?? '').trim());
      void this.resolve(
        params.get('slug'),
        params.get('id'),
        params.get('title'),
        params.get('reviewId'),
      );
    });
  }

  private async resolve(
    slug: string | null,
    id: string | null,
    title: string | null,
    reviewId: string | null,
  ): Promise<void> {
    await this.directory.ensureHydrated();
    let review: ReviewRecord | null = null;
    if (reviewId) {
      try {
        review = await this.api.getData<ReviewRecord>(`reviews/recent/${reviewId}`, undefined, {
          toast: { showError: false },
        });
      } catch {
        review = null;
      }
    }
    const decodedTitle = title ? decodeURIComponent(title).replace(/\+/g, ' ') : '';
    const listing =
      (slug && this.directory.getBySlug(slug)) ||
      (id && this.directory.getById(id)) ||
      (decodedTitle && this.directory.getByTitle(decodedTitle)) ||
      (review && this.directory.getById(review.companyId)) ||
      (review?.companyName && this.directory.getByTitle(review.companyName)) ||
      null;
    this.listing.set(listing);
    this.companyId = listing?.id ?? review?.companyId ?? (id ? Number(id) : null);
    if (this.companyId) {
      try {
        this.company.set(
          await this.api.getData<CompanyRecord>(`companies/${this.companyId}`, undefined, {
            toast: { showError: false },
          }),
        );
      } catch {
        this.company.set(null);
      }
    }
    await this.loadReviews();
  }

  async loadReviews(): Promise<void> {
    this.reviewsLoading.set(true);
    try {
      if (!this.companyId) {
        this.reviews.set([]);
        return;
      }
      const result = await this.api.list<ReviewRecord>(
        'agency/reviews',
        { companyId: this.companyId, limit: 200 },
        { toast: { showError: false } },
      );
      this.reviews.set(result.items);
    } catch {
      this.reviews.set([]);
    } finally {
      this.reviewsLoading.set(false);
    }
  }

  isHighlighted(review: ReviewRecord): boolean {
    return this.highlightReviewId() !== '' && String(review.id) === this.highlightReviewId();
  }

  websiteHref(): string {
    const site = this.agency().website;
    return /^https?:\/\//i.test(site) ? site : `https://${site}`;
  }

  toggleScore(star: number): void {
    this.scoreFilter.update((set) => {
      const next = new Set(set);
      if (next.has(star)) next.delete(star);
      else next.add(star);
      return next;
    });
  }

  async react(review: ReviewRecord, action: 'like' | 'dislike'): Promise<void> {
    if (!this.canLikeDislike()) return;
    const key = action === 'like' ? 'likes' : 'dislikes';
    const previous = { likes: review.likes, dislikes: review.dislikes };
    this.reviews.update((list) =>
      list.map((r) => (r.id === review.id ? { ...r, [key]: r[key] + 1 } : r)),
    );
    try {
      const updated = await this.api.postData<ReviewRecord>(
        `agency/reviews/${review.id}/${action}`,
        {},
        { toast: { showError: false } },
      );
      this.reviews.update((list) =>
        list.map((r) =>
          r.id === review.id ? { ...r, likes: updated.likes, dislikes: updated.dislikes } : r,
        ),
      );
    } catch {
      this.reviews.update((list) =>
        list.map((r) => (r.id === review.id ? { ...r, ...previous } : r)),
      );
      this.toast.alert(`Unable to ${action} this review right now`);
    }
  }

  openReviewModal(): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.alert('Please log in to submit a review.');
      return;
    }
    if (this.auth.role() === 'company' || this.auth.user()?.companyId != null) {
      this.toast.alert(
        'Companies cannot review other companies. Only regular users can submit reviews.',
      );
      return;
    }
    this.form = {
      rating: 0,
      reviewerName: this.auth.user()?.name ?? '',
      reviewerEmail: this.auth.user()?.email ?? '',
      content: '',
    };
    this.modalOpen.set(true);
  }

  async submitReview(): Promise<void> {
    if (!this.form.rating || !this.form.content.trim()) {
      this.toast.alert('Please add a rating and your feedback.');
      return;
    }
    this.submitting.set(true);
    const now = new Date();
    try {
      await this.api.postData('agency/reviews', {
        reviewerName: this.form.reviewerName,
        reviewerEmail: this.form.reviewerEmail,
        rating: this.form.rating,
        date: now.toISOString().slice(0, 10),
        time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        content: this.form.content.trim(),
        companyId: this.companyId,
        companySlug: this.agency().slug,
      });
      this.toast.success('Review submitted');
      this.modalOpen.set(false);
      await this.loadReviews();
    } catch {
      this.toast.alert('Failed to submit review');
    } finally {
      this.submitting.set(false);
    }
  }

  back(): void {
    if (window.history.length > 1) window.history.back();
    else void this.router.navigateByUrl('/');
  }
}
