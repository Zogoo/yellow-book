import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { FavoriteRecord, ReviewRecord } from '../../core/models';

@Component({
  selector: 'app-user-dashboard-page',
  imports: [RouterLink],
  template: `
    <header class="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-pink-500/10 p-6">
      <h1 class="text-2xl font-bold text-[#212121]">
        Welcome back, {{ auth.user()?.name || 'there' }}
      </h1>
      <p class="text-sm text-gray-600">Track your reviews and the companies you've saved.</p>
    </header>
    <div class="grid gap-4 sm:grid-cols-3">
      <a routerLink="/user/my-reviews" class="yb-card p-5"
        ><p class="text-sm text-gray-500">My reviews</p>
        <p class="text-3xl font-bold">{{ reviewCount() }}</p></a
      >
      <a routerLink="/user/favourite-companies" class="yb-card p-5"
        ><p class="text-sm text-gray-500">Favourite companies</p>
        <p class="text-3xl font-bold">{{ favoriteCount() }}</p></a
      >
      <a routerLink="/user/my-profile" class="yb-card p-5"
        ><p class="text-sm text-gray-500">Profile</p>
        <p class="text-lg font-semibold">Update details</p></a
      >
    </div>
  `,
})
export class UserDashboardPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly reviewCount = signal(0);
  readonly favoriteCount = signal(0);

  async ngOnInit(): Promise<void> {
    const [reviews, favorites] = await Promise.all([
      this.api
        .list<ReviewRecord>('user/my-reviews', { limit: 1 }, { toast: { showError: false } })
        .catch(() => null),
      this.api
        .list<FavoriteRecord>('favorites', { limit: 1 }, { toast: { showError: false } })
        .catch(() => null),
    ]);
    this.reviewCount.set(reviews?.meta.total ?? 0);
    this.favoriteCount.set(favorites?.meta.total ?? 0);
  }
}
