import { Injectable, effect, inject, signal } from '@angular/core';

import { FavoriteRecord } from '../models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { LoginModalService } from './login-modal.service';

/** Favourite listings for the signed-in user, shared by the public pages. */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly loginModal = inject(LoginModalService);
  readonly favorites = signal<FavoriteRecord[]>([]);
  /** What the visitor tried to save before we asked them to sign in. */
  private readonly pending = signal<{
    id: number;
    slug?: string;
    name?: string;
    category?: string;
    rating?: number;
  } | null>(null);

  constructor() {
    effect(() => {
      const signedIn = this.auth.isAuthenticated() && this.auth.user() !== null;
      const wanted = this.pending();
      if (signedIn && wanted) {
        this.pending.set(null);
        void this.load().then(() => this.toggle(wanted));
      }
    });
  }

  readonly busyKeys = signal<Set<string>>(new Set());

  async load(): Promise<void> {
    if (
      !this.auth.isAuthenticated() ||
      this.auth.role() === 'admin' ||
      this.auth.role() === 'agent'
    ) {
      this.favorites.set([]);
      return;
    }
    try {
      const result = await this.api.list<FavoriteRecord>(
        'favorites',
        { limit: 200 },
        { toast: { showError: false } },
      );
      this.favorites.set(result.items);
    } catch {
      this.favorites.set([]);
    }
  }

  find(listing: { id: number; slug?: string }): FavoriteRecord | undefined {
    return this.favorites().find(
      (f) => f.listingId === listing.id || (listing.slug && f.slug === listing.slug),
    );
  }

  isFavorite(listing: { id: number; slug?: string }): boolean {
    return Boolean(this.find(listing));
  }

  async toggle(
    listing: { id: number; slug?: string; name?: string; category?: string; rating?: number },
    named = false,
  ): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.pending.set({
        id: listing.id,
        slug: listing.slug,
        name: listing.name,
        category: listing.category,
        rating: listing.rating,
      });
      this.loginModal.openModal('favourite', {
        reason: 'Sign in to save companies to your list.',
      });
      return;
    }
    const key = listing.slug || String(listing.id);
    const label = named ? `${listing.name ?? 'Listing'} ` : '';
    try {
      const existing = this.find(listing);
      if (existing) {
        await this.api.deleteData(`favorites/${existing.id}`, { toast: { showError: false } });
        this.favorites.update((list) => list.filter((f) => f.id !== existing.id));
        this.toast.success(
          named ? `${listing.name} removed from favourites` : 'Removed from favourites',
        );
      } else {
        const created = await this.api.postData<FavoriteRecord>(
          'favorites',
          {
            name: listing.name,
            slug: listing.slug,
            listingId: listing.id,
            category: listing.category,
            rating: listing.rating,
            savedAt: new Date().toISOString(),
            userId: this.auth.user()?.id,
          },
          { toast: { showError: false } },
        );
        this.favorites.update((list) => [...list, created]);
        this.toast.success(named ? `${listing.name} saved to favourites` : 'Saved to favourites');
      }
    } catch {
      this.toast.alert(`${label ? '' : ''}Unable to update favourites right now.`);
    } finally {
      this.busyKeys.update((set) => {
        const next = new Set(set);
        next.delete(key);
        return next;
      });
    }
  }
}
