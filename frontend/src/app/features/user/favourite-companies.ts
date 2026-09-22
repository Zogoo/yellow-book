import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { FavoriteRecord } from '../../core/models';
import { RatingStars } from '../../shared/rating-stars';

@Component({
  selector: 'app-favourite-companies-page',
  imports: [RatingStars],
  template: `
    <header>
      <h1 class="text-2xl font-bold text-[#212121]">Favourite Companies</h1>
      <p class="text-sm text-gray-500">Companies you've saved for later.</p>
    </header>
    @if (loading()) {
      <p class="text-gray-500">Loading favourites...</p>
    } @else if (items().length === 0) {
      <div class="yb-card p-10 text-center text-gray-500">
        No favourites yet. Tap the heart on any listing to save it.
      </div>
    } @else {
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        @for (fav of items(); track fav.id) {
          <article class="yb-card p-5">
            <h2
              class="cursor-pointer font-semibold text-[#212121] hover:underline"
              (click)="open(fav)"
            >
              {{ fav.name }}
            </h2>
            <p class="text-xs text-gray-500">{{ fav.category }}</p>
            <div class="mt-2"><app-rating-stars [rating]="fav.rating ?? 0" size="sm" /></div>
            <p class="mt-2 text-xs text-gray-400">Saved {{ fav.assigned || fav.savedAt }}</p>
            <div class="mt-3 flex gap-2">
              <button type="button" class="yb-btn yb-btn-outline" (click)="open(fav)">View</button>
              <button type="button" class="yb-btn bg-red-50 text-red-700" (click)="remove(fav)">
                Remove
              </button>
            </div>
          </article>
        }
      </div>
    }
  `,
})
export class FavouriteCompaniesPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly items = signal<FavoriteRecord[]>([]);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.api.list<FavoriteRecord>('favorites', {
        limit: 100,
      });
      this.items.set(result.items);
    } finally {
      this.loading.set(false);
    }
  }

  open(fav: FavoriteRecord): void {
    void this.router.navigate(['/agency'], { queryParams: { slug: fav.slug, id: fav.listingId } });
  }

  async remove(fav: FavoriteRecord): Promise<void> {
    if (!window.confirm(`Remove ${fav.name} from favourites?`)) return;
    try {
      await this.api.deleteData(`favorites/${fav.id}`);
      this.items.update((list) => list.filter((f) => f.id !== fav.id));
      this.toast.success('Removed from favourites');
    } catch {
      this.toast.alert('Unable to update favourites right now.');
    }
  }
}
