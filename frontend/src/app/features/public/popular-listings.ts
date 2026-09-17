import { Component, OnInit, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { DirectoryListing, DirectoryService } from '../../core/services/directory.service';
import { StarRatingBox } from '../../shared/star-rating-box';

/** Highest-rated listings on the home page. */
@Component({
  selector: 'app-popular-listings',
  imports: [StarRatingBox],
  template: `
    <section id="home-popular-listings">
      <h2 class="mb-6 text-2xl font-bold text-[#212121]">{{ heading() }}</h2>
      @if (directory.pending() && items().length === 0) {
        <p class="text-sm text-gray-500">Loading listings...</p>
      } @else if (items().length === 0) {
        <p class="text-sm text-gray-500">No listings yet.</p>
      }
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        @for (item of items(); track item.id) {
          <article
            class="cursor-pointer overflow-hidden rounded-2xl border border-[#eee] bg-white shadow-sm transition hover:shadow-lg"
            role="link"
            tabindex="0"
            (click)="open(item)"
            (keydown.enter)="open(item)"
          >
            <img
              [src]="item.image"
              [alt]="item.title"
              class="h-[220px] w-full object-cover md:h-[240px] lg:h-[260px]"
            />
            <div class="space-y-2 p-4">
              <h3 class="text-base font-semibold text-[#212121]">{{ item.title }}</h3>
              <p class="line-clamp-2 text-xs text-gray-500">{{ item.description }}</p>
              <app-star-rating-box
                [rating]="item.rating"
                [readonly]="true"
                [boxSize]="26"
                [iconSize]="14"
              />
              <p class="flex items-center gap-1 text-xs text-gray-500">
                📍 {{ item.location || 'Anywhere' }}
              </p>
            </div>
          </article>
        }
      </div>
    </section>
  `,
})
export class PopularListings implements OnInit {
  readonly directory = inject(DirectoryService);
  private readonly router = inject(Router);
  readonly limit = input(8);
  readonly sortBy = input<'rating' | 'title' | 'location'>('rating');
  readonly order = input<'asc' | 'desc'>('desc');
  readonly heading = input('Popular listings');
  readonly items = computed(() => {
    const key = this.sortBy();
    const dir = this.order() === 'desc' ? -1 : 1;
    return [...this.directory.listings()]
      .sort((a, b) => {
        const av = a[key] ?? '';
        const bv = b[key] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      })
      .slice(0, this.limit());
  });

  ngOnInit(): void {
    void this.directory.ensureHydrated();
  }

  open(item: DirectoryListing): void {
    void this.router.navigate(['/agency'], { queryParams: { slug: item.slug, id: item.id } });
  }
}
