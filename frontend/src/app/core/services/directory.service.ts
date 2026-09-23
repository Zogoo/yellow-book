import { Injectable, computed, inject, signal } from '@angular/core';

import { CategoryDefinition, Listing } from '../models';
import { getDefaultListingImage, normalizeName, slugify } from '../utils/status-class';
import { ApiService } from './api.service';

export const DEFAULT_CATEGORY: CategoryDefinition = {
  name: 'General Services',
  icon: 'DefaultIcon',
  color: 'text-gray-500',
  filters: { emergencyService: false },
};

export interface DirectoryListing extends Listing {
  title: string;
  normalizedTitle: string;
  normalizedCategory: string;
  image: string;
  description: string;
}

/** Categories + approved listings, hydrated once and shared by the public pages. */
@Injectable({ providedIn: 'root' })
export class DirectoryService {
  private readonly api = inject(ApiService);
  readonly categories = signal<CategoryDefinition[]>([]);
  readonly listings = signal<DirectoryListing[]>([]);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly ready = computed(
    () => !this.pending() && this.listings().length >= 0 && this.hydrated(),
  );
  private readonly hydrated = signal(false);
  private inflight: Promise<void> | null = null;

  ensureHydrated(options: { force?: boolean } = {}): Promise<void> {
    if (this.hydrated() && !options.force) return Promise.resolve();
    if (this.inflight) return this.inflight;
    this.pending.set(true);
    this.inflight = Promise.all([
      this.api.getData<{ categories: CategoryDefinition[] }>(
        'categories',
        { limit: 100 },
        { toast: { showError: false } },
      ),
      this.api.getData<{ listings: Listing[] }>(
        'listings',
        { limit: 200 },
        { toast: { showError: false } },
      ),
    ])
      .then(([cats, lists]) => {
        this.categories.set(
          (cats?.categories ?? []).map((c) => ({ ...c, filters: c.filters ?? {} })),
        );
        this.listings.set((lists?.listings ?? []).map((l) => enrichListing(l)));
        this.error.set(null);
        this.hydrated.set(true);
      })
      .catch((error: Error) => {
        this.error.set(error.message);
        this.hydrated.set(true);
      })
      .finally(() => {
        this.pending.set(false);
        this.inflight = null;
      });
    return this.inflight;
  }

  /** Matches whichever of the two names the link carried, or the slug. */
  getCategoryByName(name: unknown): CategoryDefinition {
    const key = normalizeName(name);
    if (!key) return { ...DEFAULT_CATEGORY, name: String(name ?? DEFAULT_CATEGORY.name) };
    return (
      this.categories().find(
        (c) =>
          normalizeName(c.name) === key ||
          normalizeName(c.nameMn) === key ||
          normalizeName(c.slug) === key,
      ) ?? { ...DEFAULT_CATEGORY, name: String(name ?? DEFAULT_CATEGORY.name) }
    );
  }

  getListingsByCategory(name: unknown): DirectoryListing[] {
    const key = normalizeName(name);
    if (!key) return [];
    const category = this.getCategoryByName(name);
    const keys = new Set(
      [key, normalizeName(category.name), normalizeName(category.nameMn)].filter(Boolean),
    );
    return this.listings().filter((l) => keys.has(l.normalizedCategory));
  }

  getBySlug(slug: unknown): DirectoryListing | undefined {
    const key = slugify(slug);
    return this.listings().find((l) => l.slug === key);
  }

  getById(id: unknown): DirectoryListing | undefined {
    const key = String(id ?? '');
    return this.listings().find((l) => String(l.id) === key);
  }

  getByTitle(title: unknown): DirectoryListing | undefined {
    const key = normalizeName(title);
    return this.listings().find((l) => l.normalizedTitle === key);
  }

  matchSearch(query: string, limit = 12): DirectoryListing[] {
    const key = normalizeName(query);
    if (!key) return this.listings().slice(0, limit);
    return this.listings()
      .filter((l) => l.normalizedTitle.includes(key) || normalizeName(l.category).includes(key))
      .slice(0, limit);
  }
}

export function enrichListing(entry: Listing): DirectoryListing {
  const title = entry.title || entry.name;
  const serviceType = entry.serviceType || entry.category;
  return {
    ...entry,
    name: entry.name || title,
    title,
    slug: entry.slug || slugify(title),
    normalizedTitle: normalizeName(title),
    normalizedCategory: normalizeName(entry.category),
    // No stock photo stands in for a company that has not uploaded one.
    image: entry.image ?? '',
    // No invented marketing copy: if the company wrote nothing, we show nothing.
    description: entry.description ?? '',
    rating: Number(entry.rating ?? 0),
    ratingCount: Number(entry.ratingCount ?? 0),
  };
}
