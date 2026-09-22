import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../core/services/api.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ApiMeta, Listing } from '../../core/models';
import { DirectoryListing, enrichListing } from '../../core/services/directory.service';
import { StarRatingBox } from '../../shared/star-rating-box';
import { Avatar } from '../../shared/avatar';

const PAGE_SIZE = 6;

/** Curated "Popular List" with search, favourites and pagination. */
@Component({
  selector: 'app-popular-list-page',
  imports: [FormsModule, StarRatingBox, Avatar, TranslatePipe],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8">
      <header class="mb-8">
        <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
          {{ 'popular.badge' | translate }}
        </p>
        <h1 class="mt-2 text-3xl font-bold text-[#212121]">{{ 'popular.title' | translate }}</h1>
        <p class="mt-2 max-w-2xl text-gray-600">{{ 'popular.lead' | translate }}</p>
      </header>
      <form class="mb-6 flex gap-2" (ngSubmit)="submit()" role="search">
        <input
          id="popular-search"
          class="yb-input"
          type="search"
          [attr.placeholder]="'popular.searchPlaceholder' | translate"
          [(ngModel)]="query"
          name="q"
        />
        <button type="submit" class="yb-btn yb-btn-gold">
          {{ 'common.search' | translate }}
        </button>
      </form>
      <div class="mb-6 flex items-center justify-between text-sm text-gray-600" aria-live="polite">
        <span>
          @if (loading()) {
            {{ 'popular.loading' | translate }}
          } @else if (items().length === 0) {
            {{ 'popular.noMatch' | translate }}
          } @else {
            {{
              'popular.showing'
                | translate: { from: rangeStart(), to: rangeEnd(), total: meta().total }
            }}
          }
        </span>
        <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{{
          'popular.updatedDaily' | translate
        }}</span>
      </div>
      @if (loading()) {
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          @for (i of skeletons; track i) {
            <div class="h-80 animate-pulse rounded-2xl bg-gray-100"></div>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="yb-card p-12 text-center">
          <h2 class="text-xl font-semibold text-[#212121]">
            {{ 'popular.emptyTitle' | translate }}
          </h2>
          <p class="mt-2 text-gray-500">{{ 'popular.emptyLead' | translate }}</p>
        </div>
      } @else {
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          @for (item of items(); track item.id) {
            <article class="yb-card overflow-hidden">
              <div class="relative">
                @if (item.image) {
                  <img
                    [src]="item.image"
                    [alt]="item.title"
                    class="h-48 w-full cursor-pointer object-cover"
                    (click)="open(item)"
                  />
                } @else {
                  <div
                    class="flex h-48 w-full cursor-pointer items-center justify-center bg-gradient-to-br from-[#fff3c4] to-[#feecb2]"
                    (click)="open(item)"
                  >
                    <app-avatar [name]="item.title" [size]="72" />
                  </div>
                }
                <span
                  class="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold"
                  >{{ item.category }}</span
                >
                <button
                  type="button"
                  class="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg"
                  [attr.aria-pressed]="favorites.isFavorite(item)"
                  [attr.aria-label]="
                    (favorites.isFavorite(item) ? 'common.removeFavourite' : 'common.saveFavourite')
                      | translate
                  "
                  (click)="favorites.toggle(item)"
                >
                  {{ favorites.isFavorite(item) ? '❤' : '♡' }}
                </button>
                @if (item.emergencyService) {
                  <span
                    class="absolute bottom-3 left-3 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white"
                    >24/7</span
                  >
                }
              </div>
              <div class="space-y-3 p-5">
                <h3
                  class="cursor-pointer text-lg font-semibold text-[#212121]"
                  (click)="open(item)"
                >
                  {{ item.title }}
                </h3>
                <p class="line-clamp-2 text-sm text-gray-500">{{ item.description }}</p>
                <div class="flex flex-wrap gap-2 text-xs">
                  @if (item.serviceType) {
                    <span class="rounded-full bg-gray-100 px-2 py-1">{{ item.serviceType }}</span>
                  }
                  @if (item.revenue) {
                    <span class="rounded-full bg-gray-100 px-2 py-1">{{ item.revenue }}</span>
                  }
                  @if (item.price) {
                    <span class="rounded-full bg-gray-100 px-2 py-1">{{
                      'common.averagePrice' | translate: { price: formatPrice(item.price) }
                    }}</span>
                  }
                </div>
                <div class="flex items-center gap-2">
                  <app-star-rating-box
                    [rating]="item.rating"
                    [readonly]="true"
                    [boxSize]="44"
                    [iconSize]="24"
                    filledBg="#fffaf0"
                    filledColor="#fbbf24"
                    emptyColor="#d4d4d4"
                  />
                </div>
                <p class="text-sm text-gray-600">
                  {{ item.rating.toFixed(1) }} ·
                  {{ 'common.reviewsCount' | translate: { count: item.ratingCount } }}
                </p>
                <p class="text-xs text-gray-500">
                  📍 {{ item.location || ('common.anywhere' | translate) }}
                </p>
              </div>
            </article>
          }
        </div>
        @if (meta().totalPages > 1) {
          <nav
            class="mt-8 flex flex-wrap items-center justify-center gap-2"
            [attr.aria-label]="'common.pagination' | translate"
          >
            <button
              type="button"
              class="yb-btn yb-btn-outline"
              [disabled]="page() <= 1"
              (click)="goPage(page() - 1)"
            >
              {{ 'common.previous' | translate }}
            </button>
            @for (p of pageNumbers(); track p) {
              <button
                type="button"
                class="yb-btn"
                [class.yb-btn-gold]="p === page()"
                [class.yb-btn-outline]="p !== page()"
                (click)="goPage(p)"
              >
                {{ p }}
              </button>
            }
            <button
              type="button"
              class="yb-btn yb-btn-outline"
              [disabled]="page() >= meta().totalPages"
              (click)="goPage(page() + 1)"
            >
              {{ 'common.next' | translate }}
            </button>
            <span class="ml-4 text-xs text-gray-500"
              >{{
                'popular.showing'
                  | translate: { from: rangeStart(), to: rangeEnd(), total: meta().total }
              }}
              ·
              {{ 'popular.pageOf' | translate: { page: page(), pages: meta().totalPages } }}</span
            >
          </nav>
        }
      }
    </div>
  `,
})
export class PopularListPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly favorites = inject(FavoritesService);
  readonly items = signal<DirectoryListing[]>([]);
  readonly meta = signal<ApiMeta>({
    page: 1,
    limit: PAGE_SIZE,
    pageSize: 0,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly skeletons = [1, 2, 3, 4, 5, 6];
  query = '';
  readonly rangeStart = computed(() =>
    this.meta().total === 0 ? 0 : (this.page() - 1) * PAGE_SIZE + 1,
  );
  readonly rangeEnd = computed(() => Math.min(this.meta().total, this.page() * PAGE_SIZE));
  readonly pageNumbers = computed(() => {
    const total = this.meta().totalPages;
    const start = Math.max(1, Math.min(this.page() - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });

  constructor() {
    inject(Title).setTitle(`${this.translate.instant('popular.title')} • Yellow Book`);
    effect(() => {
      const p = this.page();
      const current = this.route.snapshot.queryParamMap.get('page');
      if (String(p) !== (current ?? '1')) {
        void this.router.navigate([], {
          queryParams: { page: p === 1 ? null : p },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  ngOnInit(): void {
    const p = Number(this.route.snapshot.queryParamMap.get('page') ?? 1) || 1;
    this.page.set(p);
    void this.favorites.load();
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.api
        .get<{ listings: Listing[] }>('listings', {
          search: this.query.trim(),
          page: this.page(),
          limit: PAGE_SIZE,
        })
        .toPromise();
      this.items.set((response?.data?.listings ?? []).map(enrichListing));
      if (response?.meta) this.meta.set(response.meta);
    } catch {
      this.items.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  submit(): void {
    this.page.set(1);
    void this.load();
  }

  goPage(p: number): void {
    this.page.set(Math.max(1, Math.min(this.meta().totalPages, p)));
    void this.load();
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  open(item: DirectoryListing): void {
    void this.router.navigate(['/agency'], { queryParams: { slug: item.slug, id: item.id } });
  }
}
