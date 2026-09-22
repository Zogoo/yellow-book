import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';

import { ApiClientError, ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DirectoryListing, DirectoryService } from '../../core/services/directory.service';
import { ToastService } from '../../core/services/toast.service';
import { CompanyRecord, ReviewRecord } from '../../core/models';
import { getDefaultListingImage, slugify } from '../../core/utils/status-class';
import { Footer } from '../../layouts/footer';
import { RatingStars } from '../../shared/rating-stars';
import { StarRatingBox } from '../../shared/star-rating-box';
import { Avatar } from '../../shared/avatar';
import { LoginModalService } from '../../core/services/login-modal.service';

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
  district: string;
  registrationNumber: string;
  facebookUrl: string;
  ownerName: string;
  ownerTitle: string;
  ownerBio: string;
  heroImage: string;
  logoImage: string;
  profileImage: string;
}

/** `/agency?slug=&id=&title=&reviewId=` — public company profile with reviews. */
@Component({
  selector: 'app-agency-page',
  imports: [FormsModule, Footer, RatingStars, StarRatingBox, Avatar, TranslatePipe],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="mb-4 flex items-center gap-4 text-sm">
        <button type="button" class="yb-btn yb-btn-outline" (click)="back()">
          ← {{ 'common.back' | translate }}
        </button>
        <nav aria-label="Breadcrumb" class="text-gray-500">
          {{ 'agency.breadcrumb' | translate }} <span class="mx-1">›</span>
          <span class="text-sky-500">{{ agency().name || 'Unknown' }}</span>
        </nav>
      </div>

      <section class="relative mb-16">
        @if (agency().heroImage) {
          <img
            [src]="agency().heroImage"
            [alt]="agency().name"
            class="h-64 w-full rounded-3xl object-cover md:h-[50vh]"
          />
        } @else {
          <div
            class="flex h-48 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-[#fff3c4] to-[#feecb2] md:h-64"
          >
            <span class="text-sm text-[#a67c00]">{{ 'common.noPhoto' | translate }}</span>
          </div>
        }
        <div
          class="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-2xl border-4 border-white bg-white shadow-lg"
        >
          @if (agency().logoImage) {
            <img
              [src]="agency().logoImage"
              [alt]="agency().name"
              class="h-20 w-20 rounded-xl object-cover"
            />
          } @else {
            <app-avatar [name]="agency().name" [size]="80" />
          }
        </div>
      </section>
      <section class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-[#212121]">
          {{ agency().name || 'Loading agency...' }}
        </h1>
        @if (agency().tagline) {
          <p class="mt-1 text-gray-500">{{ agency().tagline }}</p>
        }
        <div class="mt-2 flex items-center justify-center gap-2">
          <app-rating-stars
            [rating]="overallRating()"
            size="sm"
            color="#FFC107"
            emptyColor="#E0E0E0"
            [showValue]="false"
          />
          <span class="font-bold">{{ overallRating().toFixed(1) }}</span>
          <span class="text-sm text-gray-500">
            {{ 'category.resultsCount' | translate: { count: reviews().length } }}
          </span>
        </div>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
          @if (agency().phone) {
            <a [href]="'tel:' + agency().phone.replace(' ', '')" class="yb-btn yb-btn-gold">
              📞 {{ 'common.call' | translate }} {{ agency().phone }}
            </a>
          }
          @if (agency().facebookUrl) {
            <a
              [href]="agency().facebookUrl"
              target="_blank"
              rel="noopener nofollow"
              class="yb-btn yb-btn-outline"
            >
              {{ 'common.facebook' | translate }} ↗
            </a>
          }
        </div>
      </section>

      @if (agency().about) {
        <section class="mb-8 rounded-3xl bg-[#fff5f5] p-6">
          <h2 class="mb-2 text-xl font-bold text-[#212121]">{{ 'agency.about' | translate }}</h2>
          <p class="text-gray-600">{{ agency().about }}</p>
        </section>
      }

      <section class="mb-10 grid gap-6 md:grid-cols-2">
        <div class="yb-card p-6">
          <h2 class="mb-4 text-lg font-bold text-[#212121]">
            {{ 'agency.companyInformation' | translate }}
          </h2>
          @if (contactRows().length === 0) {
            <p class="text-sm text-gray-500">This company has not published contact details yet.</p>
          } @else {
            <dl class="space-y-3 text-sm">
              @for (row of contactRows(); track row.label) {
                <div class="flex gap-2">
                  <dt class="w-44 text-gray-500">{{ row.icon }} {{ row.label | translate }}</dt>
                  <dd>
                    @if (row.href) {
                      <a
                        [href]="row.href"
                        target="_blank"
                        rel="noopener nofollow"
                        class="text-blue-600 hover:underline"
                        >{{ row.value }}</a
                      >
                    } @else {
                      {{ row.value }}
                    }
                  </dd>
                </div>
              }
            </dl>
          }
        </div>
        @if (agency().ownerName) {
          <div class="yb-card flex flex-col items-center p-6 text-center">
            <app-avatar [name]="agency().ownerName" [size]="88" />
            <h3 class="mt-3 text-lg font-semibold">{{ agency().ownerName }}</h3>
            @if (agency().ownerTitle) {
              <p class="text-sm text-gray-500">{{ agency().ownerTitle }}</p>
            }
            <p class="mt-3 text-sm text-gray-500">Owner of {{ agency().name }} on Yellow Book.</p>
          </div>
        }
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
                  {{ 'agency.filter' | translate }} <span [class.rotate-180]="filterOpen()">⌄</span>
                </button>
                @if (filterOpen()) {
                  <div
                    class="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-100 bg-white p-4 shadow-xl"
                  >
                    <h3 class="mb-2 text-sm font-semibold">{{ 'agency.filter' | translate }}</h3>
                    <p class="mb-1 text-xs text-gray-500">{{ 'agency.reviewScore' | translate }}</p>
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
                    <p class="mt-3 mb-1 text-xs text-gray-500">
                      {{ 'agency.dateFilter' | translate }}
                    </p>
                    @for (option of dateOptions; track option.value) {
                      <label class="flex items-center gap-2 py-0.5 text-sm"
                        ><input
                          type="radio"
                          name="dateFilter"
                          [checked]="dateFilter() === option.value"
                          (change)="dateFilter.set(option.value)"
                        />
                        {{ option.label | translate }}</label
                      >
                    }
                  </div>
                }
              </div>
              @if (agency().website) {
                <a
                  [href]="websiteHref()"
                  target="_blank"
                  rel="noopener nofollow"
                  class="yb-btn yb-btn-gold"
                  >{{ 'agency.visitWebsite' | translate }} ↗</a
                >
              }
            </div>
          </div>

          @if (reviewsLoading()) {
            <p class="py-10 text-center text-gray-500">{{ 'common.loading' | translate }}</p>
          } @else if (filteredReviews().length === 0) {
            <p class="py-10 text-center text-gray-500">{{ 'agency.noReviews' | translate }}</p>
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
                  <app-avatar [name]="review.reviewerName" [size]="48" />
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
                    [attr.title]="canLikeDislike() ? null : 'Sign in to react to reviews'"
                    (click)="react(review, 'like')"
                    aria-label="Like review"
                  >
                    <img src="/thumb_up.svg" alt="" class="h-4 w-4" /> {{ review.likes }}
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-1"
                    [class.text-gray-400]="!canLikeDislike()"
                    [attr.title]="canLikeDislike() ? null : 'Sign in to react to reviews'"
                    (click)="react(review, 'dislike')"
                    aria-label="Dislike review"
                  >
                    <img src="/Frame.svg" alt="" class="h-4 w-4" /> {{ review.dislikes }}
                  </button>
                </div>
                @if (review.companyResponse) {
                  <div class="mt-4 ml-6 border-l-2 border-[#fcc207] pl-4">
                    <div class="flex items-center gap-2">
                      <app-avatar
                        [name]="review.companyResponse.name || agency().name"
                        [size]="32"
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

          <div class="yb-card mt-6 flex flex-col items-center gap-3 p-6 text-center">
            @if (myReview(); as mine) {
              <h3 class="text-lg font-semibold text-[#212121]">
                {{ 'agency.youReviewed' | translate }}
              </h3>
              <app-rating-stars [rating]="mine.rating" size="md" [showValue]="false" />
              <p class="max-w-lg text-sm text-gray-600">{{ mine.content }}</p>
              <button type="button" class="yb-btn yb-btn-outline" (click)="openReviewModal()">
                {{ 'agency.editYourReview' | translate }}
              </button>
            } @else if (isOwnCompany()) {
              <h3 class="text-lg font-semibold text-[#212121]">
                {{ 'agency.ownCompany' | translate }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ 'agency.ownCompanyHint' | translate }}
              </p>
            } @else {
              <h3 class="text-lg font-semibold text-[#212121]">
                {{ 'agency.haveYouUsed' | translate: { company: agency().name } }}
              </h3>
              <p class="text-sm text-gray-600">
                Share what happened so other people know what to expect.
              </p>
              <button type="button" class="yb-btn yb-btn-gold" (click)="openReviewModal()">
                {{ 'agency.writeReview' | translate }}
              </button>
            }
          </div>
        </div>

        <aside class="yb-card h-fit p-6 text-center">
          <p class="text-5xl font-bold text-[#212121]">{{ overallRating().toFixed(1) }}</p>
          <p class="text-sm font-semibold text-[#e5b106]">{{ ratingLabel() | translate }}</p>
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
          [attr.aria-label]="'agency.reviewDialog' | translate"
          (click)="$event.stopPropagation()"
          (ngSubmit)="submitReview()"
        >
          <h2 class="text-xl font-bold">
            {{ 'agency.haveYouUsed' | translate: { company: agency().name } }}
          </h2>
          <div class="flex justify-center">
            <app-star-rating-box [(rating)]="form.rating" [boxSize]="44" [iconSize]="26" />
          </div>
          <input
            class="yb-input"
            [attr.placeholder]="'agency.yourName' | translate"
            [(ngModel)]="form.reviewerName"
            name="reviewerName"
          />
          <input
            class="yb-input"
            type="email"
            [attr.placeholder]="'agency.yourEmail' | translate"
            [(ngModel)]="form.reviewerEmail"
            name="reviewerEmail"
          />
          <textarea
            class="yb-input"
            rows="4"
            [attr.placeholder]="'agency.reviewPlaceholder' | translate"
            [(ngModel)]="form.content"
            name="content"
            required
          ></textarea>
          <div class="flex justify-end gap-2">
            <button type="button" class="yb-btn yb-btn-outline" (click)="modalOpen.set(false)">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="submit" class="yb-btn yb-btn-gold" [disabled]="submitting()">
              {{
                submitting()
                  ? ('common.pleaseWait' | translate)
                  : ('agency.submitReview' | translate)
              }}
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
  private readonly loginModal = inject(LoginModalService);
  private readonly translate = inject(TranslateService);
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
    { value: 'all' as const, label: 'agency.allReviews' },
    { value: '30' as const, label: 'agency.last30' },
    { value: '90' as const, label: 'agency.last3Months' },
    { value: '180' as const, label: 'agency.last6Months' },
    { value: '365' as const, label: 'agency.last12Months' },
  ];
  form = { rating: 0, reviewerName: '', reviewerEmail: '', content: '' };
  private companyId: number | null = null;
  private readonly resumeReview = signal(false);

  /** Your own review of this company, if you already wrote one. */
  readonly myReview = computed(() => {
    const me = this.auth.user()?.id;
    return me ? (this.reviews().find((r) => r['userId'] === me) ?? null) : null;
  });
  readonly isOwnCompany = computed(() => {
    const companyId = this.auth.user()?.companyId;
    return companyId != null && companyId === (this.company()?.id ?? this.listing()?.id);
  });

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
    if (r >= 4.5) return 'agency.excellent';
    if (r >= 4) return 'agency.great';
    if (r >= 3) return 'agency.good';
    if (r >= 2) return 'agency.fair';
    if (r > 0) return 'agency.poor';
    return 'agency.noRatings';
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
    const serviceType = l?.serviceType || c?.serviceType || c?.category || '';
    const location = l?.location || c?.location || '';
    const category = l?.category || c?.category || '';
    const owner =
      c?.ownerName ||
      (c?.firstName || c?.lastName ? `${c?.firstName ?? ''} ${c?.lastName ?? ''}`.trim() : '');
    return {
      id: l?.id ?? c?.id ?? null,
      name,
      slug: l?.slug || (c ? slugify(c.name) : ''),
      rating: l?.rating ?? c?.rating ?? 0,
      ratingCount: l?.ratingCount ?? c?.ratingCount ?? 0,
      // Everything below is shown only when the company actually provided it.
      tagline:
        c?.tagline ||
        (serviceType && location
          ? this.translate.instant('agency.taglineIn', { service: serviceType, location })
          : ''),
      about: c?.description || l?.description || '',
      website: (l?.website || c?.website || '').trim(),
      phone: (c?.phone || c?.mobile || c?.phoneNumber || '').trim(),
      email: (c?.contactEmail || c?.email || '').trim(),
      location,
      revenue: (c?.revenue || l?.revenue || '').toString().trim(),
      employees: (c?.employees || '').toString().trim(),
      industry: (c?.industry || '').toString().trim(),
      category,
      district: (c?.district || '').toString().trim(),
      registrationNumber: (c?.registrationNumber || '').toString().trim(),
      facebookUrl: (c?.facebookUrl || '').toString().trim(),
      ownerName: owner,
      ownerTitle: c?.jobTitle || '',
      ownerBio: '',
      heroImage: (l?.image || c?.image || '').toString(),
      logoImage: (l?.image || c?.image || '').toString(),
      profileImage: '',
    };
  });

  constructor() {
    effect(() => {
      // Read the session signals first: a short-circuit here would leave the
      // effect with no dependencies and it would never run again.
      const signedIn = this.auth.isAuthenticated() && this.auth.user() !== null;
      if (signedIn && this.resumeReview()) {
        this.resumeReview.set(false);
        setTimeout(() => this.openReviewModal(), 0);
      }
    });
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

  /** Only the details the company actually published. */
  readonly contactRows = computed(() => {
    const a = this.agency();
    const rows: { icon: string; label: string; value: string; href?: string }[] = [];
    if (a.phone)
      rows.push({
        icon: '📞',
        label: 'common.phone',
        value: a.phone,
        href: `tel:${a.phone.replace(/\s+/g, '')}`,
      });
    if (a.facebookUrl)
      rows.push({
        icon: '📘',
        label: 'common.facebook',
        value: a.facebookUrl,
        href: a.facebookUrl,
      });
    if (a.website)
      rows.push({
        icon: '🌐',
        label: 'common.website',
        value: a.website,
        href: this.websiteHref(),
      });
    if (a.email)
      rows.push({ icon: '✉', label: 'Email', value: a.email, href: `mailto:${a.email}` });
    if (a.district) rows.push({ icon: '📍', label: 'common.district', value: a.district });
    if (a.location) rows.push({ icon: '🏙', label: 'common.location', value: a.location });
    if (a.registrationNumber)
      rows.push({
        icon: '🪪',
        label: 'agency.registrationNumber',
        value: a.registrationNumber,
      });
    if (a.industry) rows.push({ icon: '🏭', label: 'agency.industry', value: a.industry });
    if (a.category) rows.push({ icon: '🏷', label: 'common.category', value: a.category });
    if (a.employees) rows.push({ icon: '👥', label: 'agency.employees', value: a.employees });
    if (a.revenue) rows.push({ icon: '💲', label: 'agency.revenue', value: a.revenue });
    return rows;
  });

  toggleScore(star: number): void {
    this.scoreFilter.update((set) => {
      const next = new Set(set);
      if (next.has(star)) next.delete(star);
      else next.add(star);
      return next;
    });
  }

  async react(review: ReviewRecord, action: 'like' | 'dislike'): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.loginModal.openModal('review', {
        reason: this.translate.instant('agency.signInToReact'),
      });
      return;
    }
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
      // Remember the intent so the composer opens again after signing in.
      this.resumeReview.set(true);
      this.loginModal.openModal('review', {
        reason: this.translate.instant('agency.signInToReview', {
          company: this.agency().name || '',
        }),
      });
      return;
    }
    if (this.isOwnCompany()) {
      this.toast.alert(this.translate.instant('agency.ownCompanyHint'));
      return;
    }
    if (this.myReview()) {
      void this.router.navigate(['/user/my-reviews'], {
        queryParams: { review: this.myReview()?.id },
      });
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
      this.toast.alert(this.translate.instant('agency.ratingRequired'));
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
      this.toast.success(this.translate.instant('agency.submitted'));
      this.modalOpen.set(false);
      await this.loadReviews();
    } catch (e) {
      const conflict = e instanceof ApiClientError && e.status === 409;
      this.toast.alert(
        conflict && e instanceof ApiClientError
          ? e.message
          : 'We could not publish your review. Please try again.',
      );
      if (conflict) {
        this.modalOpen.set(false);
        await this.loadReviews();
      }
    } finally {
      this.submitting.set(false);
    }
  }

  back(): void {
    if (window.history.length > 1) window.history.back();
    else void this.router.navigateByUrl('/');
  }
}
