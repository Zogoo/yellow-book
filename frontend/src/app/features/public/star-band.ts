import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { ApiService } from '../../core/services/api.service';

interface PlatformStats {
  verifiedCompanies: number;
  companies: number;
  users: number;
  reviews: number;
  categories: number;
}

/** Platform counters. Real ones, from `GET /stats`. */
@Component({
  selector: 'app-star-band',
  imports: [TranslatePipe],
  template: `
    @if (stats(); as s) {
      <section class="-mx-4 bg-[#fcc207] px-4 py-10">
        <div class="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
          @for (tile of tiles(); track tile.label) {
            <div
              class="flex flex-col items-center gap-2 rounded-2xl bg-[#e5b106] px-4 py-6 text-center"
            >
              <img [src]="tile.icon" alt="" class="h-10 w-10" />
              <span class="text-2xl font-bold text-[#212121]">{{ tile.value }}</span>
              <span class="text-sm text-[#424242]">{{ tile.label | translate }}</span>
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class StarBand implements OnInit {
  private readonly api = inject(ApiService);
  readonly stats = signal<PlatformStats | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.stats.set(
        await this.api.getData<PlatformStats>('stats', undefined, { toast: { showError: false } }),
      );
    } catch {
      this.stats.set(null);
    }
  }

  /** Computed, so the template gets the same array on every check. */
  readonly tiles = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { icon: '/Frame(7).svg', value: s.verifiedCompanies, label: 'home.stats.verifiedCompanies' },
      { icon: '/Frame(8).svg', value: s.users, label: 'home.stats.members' },
      { icon: '/Frame(9).svg', value: s.reviews, label: 'home.stats.reviews' },
      { icon: '/Frame(10).svg', value: s.categories, label: 'home.stats.categories' },
    ];
  });
}
