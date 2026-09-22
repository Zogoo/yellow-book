import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import {
  DirectoryListing,
  DirectoryService,
  enrichListing,
} from '../../core/services/directory.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { LocaleService } from '../../core/services/locale.service';
import { Listing } from '../../core/models';
import { getFilterChipClass } from '../../core/utils/status-class';
import { Pagination } from '../../shared/pagination';
import { StarRatingBox } from '../../shared/star-rating-box';
import { Avatar } from '../../shared/avatar';
import { CategoryGrid } from './category-grid';

interface Chip {
  type: string;
  value: string;
  label: string;
}

const PAGE_SIZE = 5;

/** `/catagory`: category grid, or the filtered listing view when `?name=` is set. */
@Component({
  selector: 'app-catagory-page',
  imports: [FormsModule, CategoryGrid, Pagination, StarRatingBox, TranslatePipe, Avatar],
  template: `
    @if (!categoryName() && !queryTerm()) {
      <section class="mx-auto max-w-7xl px-4 py-12">
        <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
          {{ 'category.allListings' | translate }}
        </p>
        <h1 class="mt-2 text-3xl font-bold text-[#212121]">
          {{ 'category.discover' | translate }}
        </h1>
        <p class="mt-2 mb-8 text-gray-600">{{ 'category.discoverLead' | translate }}</p>
        <app-category-grid heading="" />
      </section>
    } @else {
      <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="mb-4 flex items-center gap-4 text-sm">
          <button type="button" class="yb-btn yb-btn-outline" (click)="back()">
            ← {{ 'common.back' | translate }}
          </button>
          <nav aria-label="Breadcrumb" class="text-gray-500">
            Category <span class="mx-1">›</span>
            <span class="text-sky-500">{{ categoryLabel() }}</span>
          </nav>
        </div>
        <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-xs text-gray-500">
              {{ (categoryName() ? 'common.category' : 'category.searchResults') | translate }}
            </p>
            <h1 class="text-3xl font-bold text-[#28aed8]">
              {{ categoryLabel() || '“' + queryTerm() + '”' }}
            </h1>
            @if (!loading()) {
              <p class="text-sm text-gray-500">
                {{ filtered().length }}
                {{ filtered().length === 1 ? 'company' : 'companies' }}
              </p>
            }
          </div>
          <form class="flex gap-2" (ngSubmit)="submitSearch()" role="search">
            <input
              class="yb-input md:w-72"
              type="search"
              [attr.placeholder]="'nav.searchPlaceholder' | translate"
              [(ngModel)]="searchInput"
              name="q"
              [attr.aria-label]="'nav.searchPlaceholder' | translate"
            />
            <button type="submit" class="yb-btn yb-btn-gold">
              {{ 'common.search' | translate }}
            </button>
          </form>
        </div>

        <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside>
            <button
              type="button"
              class="yb-btn yb-btn-outline mb-3 w-full lg:hidden"
              (click)="filtersOpen.set(!filtersOpen())"
            >
              Filters
            </button>
            <div class="space-y-6" [class.hidden]="!filtersOpen()" [class.lg:block]="true">
              <div class="yb-card p-4">
                <h3 class="mb-3 text-sm font-semibold">{{ 'common.district' | translate }}</h3>
                <select
                  class="yb-input"
                  [value]="district()"
                  (change)="setDistrict($event)"
                  [attr.aria-label]="'common.district' | translate"
                >
                  <option value="">{{ 'common.all' | translate }}</option>
                  @for (option of districtOptions(); track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              </div>
              @if (hasPrices()) {
                <div class="yb-card p-4">
                  <h3 class="mb-3 text-sm font-semibold">
                    {{ 'category.priceRange' | translate }}
                  </h3>
                  <div class="flex justify-between text-xs text-gray-500">
                    <span>min\${{ priceBounds().min }}</span
                    ><span>max\${{ priceBounds().max }}</span>
                  </div>
                  <input
                    type="range"
                    class="w-full accent-[#28AED8]"
                    [min]="priceBounds().min"
                    [max]="priceBounds().max"
                    [value]="priceValue()"
                    (input)="onPrice($event)"
                    aria-label="Maximum price"
                  />
                  <p class="mt-1 text-center text-xs font-semibold text-[#28AED8]">
                    \${{ priceValue() }}
                  </p>
                </div>
              }
              @if (category().filters.emergencyService) {
                <div class="yb-card p-4">
                  <h3 class="mb-3 text-sm font-semibold">{{ 'category.emergency' | translate }}</h3>
                  <div class="flex gap-4 text-sm">
                    <label class="flex items-center gap-2"
                      ><input
                        type="radio"
                        name="emergency"
                        [checked]="emergency() === true"
                        (click)="setEmergency(true)"
                      />
                      Yes</label
                    >
                    <label class="flex items-center gap-2"
                      ><input
                        type="radio"
                        name="emergency"
                        [checked]="emergency() === false"
                        (click)="setEmergency(false)"
                      />
                      No</label
                    >
                  </div>
                </div>
              }
              <div class="yb-card p-4">
                <h3 class="mb-3 text-sm font-semibold">
                  {{
                    category().filters.serviceTypes?.label || ('category.serviceTypes' | translate)
                  }}
                </h3>
                <div class="max-h-64 space-y-2 overflow-y-auto text-sm">
                  @for (option of serviceOptions(); track option) {
                    <label class="flex items-center gap-2"
                      ><input
                        type="checkbox"
                        [checked]="services().has(option)"
                        (change)="toggleSet('services', option)"
                      />
                      {{ option }}</label
                    >
                  }
                </div>
              </div>
              <div class="yb-card p-4">
                <h3 class="mb-3 text-sm font-semibold">
                  {{
                    category().filters.specializations?.label ||
                      ('category.specializations' | translate)
                  }}
                </h3>
                <div class="max-h-64 space-y-2 overflow-y-auto text-sm">
                  @for (option of specializationOptions(); track option) {
                    <label class="flex items-center gap-2"
                      ><input
                        type="checkbox"
                        [checked]="specializations().has(option)"
                        (change)="toggleSet('specializations', option)"
                      />
                      {{ option }}</label
                    >
                  }
                </div>
              </div>
              <div class="flex gap-2 lg:hidden">
                <button
                  type="button"
                  class="yb-btn flex-1 bg-blue-600 text-white"
                  (click)="filtersOpen.set(false)"
                >
                  {{ 'category.applyFilters' | translate }}
                </button>
                <button type="button" class="yb-btn flex-1 bg-gray-200" (click)="clearAll()">
                  {{ 'category.clearAll' | translate }}
                </button>
              </div>
            </div>
          </aside>

          <section>
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <div class="relative">
                <button
                  type="button"
                  class="yb-btn yb-btn-outline"
                  (click)="sortOpen.set(!sortOpen())"
                  aria-haspopup="true"
                  [attr.aria-expanded]="sortOpen()"
                >
                  {{ 'category.rating' | translate }} ☰
                </button>
                @if (sortOpen()) {
                  <div
                    class="absolute z-20 mt-2 w-[280px] rounded-xl border border-gray-100 bg-white p-4 shadow-xl md:w-[342px]"
                  >
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <label class="flex items-center gap-2 py-1 text-sm"
                        ><input
                          type="checkbox"
                          [checked]="ratings().has(star)"
                          (change)="toggleRating(star)"
                        />
                        {{ star }} star</label
                      >
                    }
                  </div>
                }
              </div>
              @for (chip of chips(); track chip.type + chip.value) {
                <span
                  class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
                  [class]="chipClass(chip.type)"
                >
                  {{ chip.label }}
                  <button
                    type="button"
                    [attr.aria-label]="'Remove ' + chip.label"
                    (click)="removeChip(chip)"
                  >
                    ×
                  </button>
                </span>
              }
              @if (chips().length) {
                <button
                  type="button"
                  class="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700"
                  (click)="clearAll()"
                >
                  {{ 'category.clearAll' | translate }}
                </button>
              }
            </div>

            @if (loading()) {
              <p class="py-10 text-center text-gray-500">{{ 'common.loading' | translate }}</p>
            } @else if (paged().length === 0) {
              <div class="yb-card p-10 text-center">
                <p class="text-gray-600">{{ 'category.noResults' | translate }}</p>
                <button
                  type="button"
                  class="yb-btn mt-4 bg-red-500 text-white"
                  (click)="clearAll()"
                >
                  Clear Filters
                </button>
              </div>
            } @else {
              <div class="space-y-4">
                @for (item of paged(); track item.id) {
                  <article
                    class="yb-card flex cursor-pointer flex-col gap-4 p-4 md:flex-row"
                    role="link"
                    tabindex="0"
                    (click)="open(item)"
                    (keydown.enter)="open(item)"
                    (keydown.space)="open(item); $event.preventDefault()"
                  >
                    @if (item.image) {
                      <img
                        [src]="item.image"
                        [alt]="item.title"
                        class="h-40 w-full rounded-xl object-cover md:w-52"
                      />
                    } @else {
                      <div
                        class="flex h-40 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#fff3c4] to-[#feecb2] md:w-52"
                      >
                        <app-avatar [name]="item.title" [size]="64" />
                      </div>
                    }
                    <div class="flex-1 space-y-2">
                      <div class="flex items-start justify-between gap-2">
                        <h3 class="text-lg font-semibold text-[#212121]">{{ item.title }}</h3>
                        <button
                          type="button"
                          class="text-xl"
                          [attr.aria-pressed]="favorites.isFavorite(item)"
                          [attr.aria-label]="
                            favorites.isFavorite(item)
                              ? 'Remove from favourites'
                              : 'Save to favourites'
                          "
                          (click)="$event.stopPropagation(); favorites.toggle(item, true)"
                        >
                          {{ favorites.isFavorite(item) ? '❤' : '♡' }}
                        </button>
                      </div>
                      <app-star-rating-box
                        [rating]="item.rating"
                        [readonly]="true"
                        [boxSize]="32"
                        [iconSize]="24"
                        filledColor="#FFC107"
                        emptyColor="#E0E0E0"
                      />
                      @if (item.website) {
                        <p class="text-sm text-gray-600">🌐 {{ item.website }}</p>
                      }
                      <p class="text-sm text-gray-600">
                        📍 {{ item.district || item.location || ('common.location' | translate) }}
                      </p>
                      @if (item.phone) {
                        <a
                          [href]="'tel:' + item.phone"
                          class="inline-flex text-sm font-semibold text-[#1877f2]"
                          (click)="$event.stopPropagation()"
                          >📞 {{ 'common.call' | translate }} {{ item.phone }}</a
                        >
                      }
                      @if (item.revenue) {
                        <p class="text-sm text-gray-600">
                          💲 {{ item.revenue }}
                          <span class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                            {{ 'agency.revenue' | translate }}
                          </span>
                        </p>
                      }
                      <div
                        class="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center text-xs"
                      >
                        <div>
                          <p class="text-gray-500">{{ 'category.rating' | translate }}</p>
                          <p class="font-semibold">{{ item.ratingCount }}</p>
                        </div>
                        <div>
                          <p class="text-gray-500">{{ 'category.reviewsLabel' | translate }}</p>
                          <p class="font-semibold">{{ item.comments ?? item.ratingCount }}</p>
                        </div>
                        <button
                          type="button"
                          class="text-[#28aed8]"
                          (click)="open(item); $event.stopPropagation()"
                        >
                          {{ 'category.more' | translate }}
                        </button>
                      </div>
                    </div>
                  </article>
                }
              </div>
              @if (totalPages() > 1) {
                <div class="mt-6">
                  <app-pagination
                    [page]="page()"
                    (pageChange)="setPage($event)"
                    [totalPages]="totalPages()"
                  />
                </div>
              }
            }
          </section>
        </div>
      </div>
    }
  `,
})
export class CatagoryPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly directory = inject(DirectoryService);
  private readonly locale = inject(LocaleService);
  readonly favorites = inject(FavoritesService);
  readonly categoryName = toSignal(
    this.route.queryParamMap.pipe(map((q) => (q.get('name') ?? '').trim())),
    { initialValue: '' },
  );
  readonly queryTerm = toSignal(
    this.route.queryParamMap.pipe(map((q) => (q.get('q') ?? '').trim())),
    { initialValue: '' },
  );
  readonly category = computed(() => this.directory.getCategoryByName(this.categoryName()));
  /** The canonical name is English; the heading follows the chosen language. */
  readonly categoryLabel = computed(() => {
    const category = this.category();
    if (!this.categoryName()) return '';
    return this.locale.locale() === 'en'
      ? (category.name ?? this.categoryName())
      : (category.nameMn ?? category.name ?? this.categoryName());
  });
  readonly listings = signal<DirectoryListing[]>([]);
  readonly loading = signal(false);
  readonly filtersOpen = signal(false);
  readonly sortOpen = signal(false);
  readonly services = signal(new Set<string>());
  readonly specializations = signal(new Set<string>());
  readonly ratings = signal(new Set<number>());
  readonly emergency = signal<boolean | null>(null);
  readonly district = signal('');
  readonly maxPrice = signal<number>(Number.POSITIVE_INFINITY);
  readonly page = signal(1);
  searchInput = '';
  private lastKey = '';

  /** Only the districts that actually have listings here. */
  readonly districtOptions = computed(() =>
    [
      ...new Set(
        this.listings()
          .map((l) => l.district)
          .filter((d): d is string => !!d),
      ),
    ].sort(),
  );
  readonly hasPrices = computed(() => this.listings().some((l) => Number(l.price ?? 0) > 0));
  readonly priceBounds = computed(() => {
    const prices = this.listings()
      .map((l) => Number(l.price ?? 0))
      .filter((p) => p > 0);
    if (prices.length === 0) return { min: 0, max: 100 };
    let min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) min = Math.floor(min * 0.75);
    return { min, max };
  });
  readonly priceValue = computed(() =>
    Number.isFinite(this.maxPrice()) ? this.maxPrice() : this.priceBounds().max,
  );
  readonly serviceOptions = computed(() => {
    const configured = this.category().filters.serviceTypes?.options ?? [];
    if (configured.length) return configured;
    return [
      ...new Set(
        this.listings()
          .map((l) => l.serviceType)
          .filter((s): s is string => Boolean(s)),
      ),
    ].sort();
  });
  readonly specializationOptions = computed(() => {
    const configured = this.category().filters.specializations?.options ?? [];
    if (configured.length) return configured;
    return [
      ...new Set(
        this.listings()
          .map((l) => l.specialization)
          .filter((s): s is string => Boolean(s)),
      ),
    ].sort();
  });
  readonly filtered = computed(() => {
    const q = this.queryTerm().toLowerCase();
    return this.listings().filter((l) => {
      if (this.services().size && !this.services().has(l.serviceType ?? '')) return false;
      if (this.specializations().size && !this.specializations().has(l.specialization ?? ''))
        return false;
      if (this.emergency() !== null && Boolean(l.emergencyService) !== this.emergency())
        return false;
      if (Number(l.price ?? 0) > this.maxPrice()) return false;
      if (this.ratings().size && !this.ratings().has(Math.floor(l.rating))) return false;
      if (this.district() && l.district !== this.district()) return false;
      if (q && !`${l.name} ${l.location ?? ''} ${l.website ?? ''}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly paged = computed(() =>
    this.filtered().slice((this.page() - 1) * PAGE_SIZE, this.page() * PAGE_SIZE),
  );
  readonly chips = computed<Chip[]>(() => {
    const chips: Chip[] = [];
    this.services().forEach((v) => chips.push({ type: 'service', value: v, label: v }));
    this.specializations().forEach((v) =>
      chips.push({ type: 'specialization', value: v, label: v }),
    );
    this.ratings().forEach((v) =>
      chips.push({ type: 'rating', value: String(v), label: `${v} star` }),
    );
    if (this.district())
      chips.push({ type: 'district', value: this.district(), label: this.district() });
    if (this.emergency() !== null)
      chips.push({
        type: 'emergency',
        value: 'x',
        label: `Emergency: ${this.emergency() ? 'Yes' : 'No'}`,
      });
    if (Number.isFinite(this.maxPrice()))
      chips.push({ type: 'price', value: 'x', label: `Max: $${this.maxPrice()}` });
    if (this.queryTerm())
      chips.push({ type: 'query', value: 'x', label: `Search: ${this.queryTerm()}` });
    return chips;
  });

  ngOnInit(): void {
    void this.directory.ensureHydrated();
    void this.favorites.load();
    this.route.queryParamMap.subscribe((params) => {
      this.searchInput = params.get('q') ?? '';
      this.page.set(Number(params.get('page') ?? 1) || 1);
      const key = `${params.get('name') ?? ''}|${params.get('q') ?? ''}`;
      if (key !== this.lastKey) {
        this.lastKey = key;
        // A search with no category still has to return results.
        if (params.get('name') || params.get('q')) void this.load();
      }
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.api.getData<{ listings: Listing[] }>('listings', {
        category: this.categoryName(),
        limit: 60,
        search: this.queryTerm(),
      });
      this.listings.set((data?.listings ?? []).map(enrichListing));
    } catch {
      this.listings.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  submitSearch(): void {
    void this.router.navigate([], {
      queryParams: { q: this.searchInput.trim() || null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  back(): void {
    if (window.history.length > 1) window.history.back();
    else void this.router.navigateByUrl('/');
  }

  toggleSet(kind: 'services' | 'specializations', value: string): void {
    const target = kind === 'services' ? this.services : this.specializations;
    target.update((set) => {
      const next = new Set(set);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    this.setPage(1);
  }

  toggleRating(star: number): void {
    this.ratings.update((set) => {
      const next = new Set(set);
      if (next.has(star)) next.delete(star);
      else next.add(star);
      return next;
    });
    this.setPage(1);
  }

  setDistrict(event: Event): void {
    this.district.set((event.target as HTMLSelectElement).value);
    this.setPage(1);
  }

  setEmergency(value: boolean): void {
    this.emergency.set(this.emergency() === value ? null : value);
    this.setPage(1);
  }

  onPrice(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.maxPrice.set(value >= this.priceBounds().max ? Number.POSITIVE_INFINITY : value);
    this.setPage(1);
  }

  removeChip(chip: Chip): void {
    if (chip.type === 'service') this.toggleSet('services', chip.value);
    else if (chip.type === 'specialization') this.toggleSet('specializations', chip.value);
    else if (chip.type === 'rating') this.toggleRating(Number(chip.value));
    else if (chip.type === 'district') this.district.set('');
    else if (chip.type === 'emergency') this.emergency.set(null);
    else if (chip.type === 'price') this.maxPrice.set(Number.POSITIVE_INFINITY);
    else if (chip.type === 'query')
      void this.router.navigate([], {
        queryParams: { q: null, page: null },
        queryParamsHandling: 'merge',
      });
  }

  clearAll(): void {
    this.services.set(new Set());
    this.specializations.set(new Set());
    this.ratings.set(new Set());
    this.emergency.set(null);
    this.district.set('');
    this.maxPrice.set(Number.POSITIVE_INFINITY);
    this.filtersOpen.set(false);
    void this.router.navigate([], {
      queryParams: { q: null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  setPage(p: number): void {
    this.page.set(p);
    void this.router.navigate([], {
      queryParams: { page: p === 1 ? null : p },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  chipClass(type: string): string {
    return getFilterChipClass(type);
  }

  open(item: DirectoryListing): void {
    void this.router.navigate(['/agency'], { queryParams: { slug: item.slug, id: item.id } });
  }
}
