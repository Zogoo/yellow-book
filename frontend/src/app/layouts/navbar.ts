import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { LoginModalService } from '../core/services/login-modal.service';
import { Listing } from '../core/models';
import { getDefaultRouteForUser } from '../core/utils/role-access';
import { normalizeName, slugify } from '../core/utils/status-class';
import { PanelProfileMenu } from '../shared/panel-profile-menu';
import { LanguageSwitcher } from '../shared/language-switcher';

/** Home hero: logo, navigation, sign-in actions, headline and listing search. */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, FormsModule, PanelProfileMenu, TranslatePipe, LanguageSwitcher],
  template: `
    <header
      class="bg-[#fff9e6] font-jakarta"
      style="border-bottom-left-radius: 50% 52px; border-bottom-right-radius: 50% 52px"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <a routerLink="/" [attr.aria-label]="'common.homeLink' | translate"
          ><img src="/logo/logo.png" alt="Yellow Book" width="140" height="34"
        /></a>
        <nav class="hidden items-center gap-8 md:flex">
          <a
            routerLink="/catagory"
            class="text-sm font-medium"
            [class.text-[#212121]]="isActive('/catagory')"
            [class.text-[#616161]]="!isActive('/catagory')"
            >{{ 'nav.category' | translate }}</a
          >
          <a
            href="/#home-popular-listings"
            class="text-sm font-medium text-[#616161]"
            (click)="scrollPopular($event)"
            >{{ 'nav.popular' | translate }}</a
          >
          <a
            routerLink="/faq"
            class="text-sm font-medium"
            [class.text-[#212121]]="isActive('/faq')"
            [class.text-[#616161]]="!isActive('/faq')"
            >{{ 'nav.faq' | translate }}</a
          >
        </nav>
        <div class="hidden items-center gap-4 md:flex">
          <app-language-switcher />
          <a
            routerLink="/business/signup"
            class="text-sm font-medium text-[#616161] hover:text-[#212121]"
            >{{ 'nav.forBusinesses' | translate }}</a
          >
          @if (auth.isAuthenticated()) {
            <app-panel-profile-menu roleLabel="Account" [dashboardTo]="dashboardTo()" />
          } @else {
            <button type="button" class="text-sm font-semibold text-[#212121]" (click)="signIn()">
              {{ 'nav.logIn' | translate }}
            </button>
            <a routerLink="/auth/signup" class="yb-btn yb-btn-gold">{{
              'nav.signUp' | translate
            }}</a>
          }
        </div>
        <button
          type="button"
          class="rounded-lg border border-[#fcc207] p-2 md:hidden"
          [attr.aria-label]="'nav.toggleMenu' | translate"
          [attr.aria-expanded]="menuOpen()"
          (click)="menuOpen.set(!menuOpen())"
        >
          <span class="block h-0.5 w-5 bg-[#212121]"></span>
          <span class="mt-1 block h-0.5 w-5 bg-[#212121]"></span>
          <span class="mt-1 block h-0.5 w-5 bg-[#212121]"></span>
        </button>
      </div>

      @if (menuOpen()) {
        <div class="fixed inset-0 z-40 bg-black/40 md:hidden" (click)="menuOpen.set(false)"></div>
        <aside
          class="fixed top-0 right-0 z-50 flex h-full w-[80vw] max-w-[400px] flex-col gap-4 bg-white p-6 shadow-xl md:hidden"
          role="dialog"
          [attr.aria-label]="'common.mobileMenu' | translate"
        >
          <button
            type="button"
            class="self-end text-gray-500"
            [attr.aria-label]="'common.closeMenu' | translate"
            (click)="menuOpen.set(false)"
          >
            ✕
          </button>
          <a routerLink="/catagory" (click)="menuOpen.set(false)" class="text-base font-medium">{{
            'nav.category' | translate
          }}</a>
          <a
            href="/#home-popular-listings"
            (click)="scrollPopular($event)"
            class="text-base font-medium"
            >{{ 'nav.popular' | translate }}</a
          >
          <a routerLink="/faq" (click)="menuOpen.set(false)" class="text-base font-medium">FAQ</a>
          <a
            routerLink="/business/signup"
            (click)="menuOpen.set(false)"
            class="text-base font-medium"
            >{{ 'nav.forBusinesses' | translate }}</a
          >
          <app-language-switcher />
          @if (auth.isAuthenticated()) {
            <a
              [routerLink]="dashboardTo()"
              (click)="menuOpen.set(false)"
              class="text-base font-medium"
              >{{ 'nav.myDashboard' | translate }}</a
            >
            <button
              type="button"
              class="text-left text-base font-medium text-red-600"
              (click)="auth.logout()"
            >
              {{ 'nav.logOut' | translate }}
            </button>
          } @else {
            <button type="button" class="text-left text-base font-medium" (click)="signIn()">
              {{ 'nav.logIn' | translate }}
            </button>
            <a routerLink="/auth/signup" (click)="menuOpen.set(false)" class="yb-btn yb-btn-gold"
              >Sign up</a
            >
          }
        </aside>
      }

      <div class="mx-auto max-w-4xl px-4 pt-10 pb-16 text-center">
        <h1 class="text-3xl font-bold leading-tight text-[#212121] md:text-5xl">
          {{ 'home.headline' | translate }}
        </h1>
        <p class="mt-4 text-sm text-[#616161] md:text-base">
          {{ 'home.subhead' | translate }}
        </p>
        <form
          class="relative mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full bg-[#feecb2] p-2"
          (ngSubmit)="submitSearch()"
          role="search"
        >
          <input
            class="flex-1 rounded-full bg-[#fff9e6] px-5 py-3 text-sm outline-none"
            type="search"
            name="q"
            [attr.placeholder]="'nav.searchPlaceholder' | translate"
            [(ngModel)]="query"
            (ngModelChange)="onQueryChange()"
            (focus)="dropdownOpen.set(true)"
            [attr.aria-label]="'nav.searchPlaceholder' | translate"
            autocomplete="off"
          />
          <button type="submit" class="yb-btn yb-btn-gold rounded-full px-6">
            🔍 {{ 'common.search' | translate }}
          </button>
          @if (dropdownOpen()) {
            <ul
              class="absolute top-full right-2 left-2 z-30 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-gray-100 bg-white text-left shadow-xl"
              role="listbox"
            >
              @if (searching()) {
                <li class="px-4 py-3 text-sm text-gray-500">{{ 'common.loading' | translate }}</li>
              } @else if (results().length === 0) {
                <li class="px-4 py-3 text-sm text-gray-500">
                  {{ 'category.noResults' | translate }}
                </li>
              } @else {
                @for (item of results(); track item.id) {
                  <li>
                    <button
                      type="button"
                      class="w-full px-4 py-3 text-left hover:bg-[#fff9e6]"
                      role="option"
                      (click)="pick(item)"
                    >
                      <span class="block text-sm font-semibold text-[#212121]">{{
                        item.name
                      }}</span>
                      <span class="block text-xs text-gray-500"
                        >{{ item.category }} • {{ item.serviceType || item.category }} •
                        {{ item.location || 'Anywhere' }}</span
                      >
                      <span class="mt-1 flex flex-wrap gap-1">
                        @for (tag of tags(item); track tag) {
                          <span
                            class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                            >{{ tag }}</span
                          >
                        }
                      </span>
                    </button>
                  </li>
                }
              }
            </ul>
          }
        </form>
      </div>
    </header>
  `,
})
export class Navbar implements OnInit {
  readonly auth = inject(AuthService);
  readonly modal = inject(LoginModalService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly menuOpen = signal(false);
  readonly dropdownOpen = signal(false);
  readonly searching = signal(false);
  readonly results = signal<Listing[]>([]);
  readonly dashboardTo = computed(() => getDefaultRouteForUser(this.auth.user()));
  query = '';
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    void this.search('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.dropdownOpen.set(false);
  }

  isActive(path: string): boolean {
    return this.router.url.split('?')[0] === path;
  }

  onQueryChange(): void {
    this.dropdownOpen.set(true);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.search(this.query), 200);
  }

  async search(term: string): Promise<void> {
    this.searching.set(true);
    try {
      const data = await this.api.getData<{ listings: Listing[] }>(
        'listings',
        { search: term, limit: 12 },
        { toast: { showError: false } },
      );
      this.results.set(data?.listings ?? []);
    } catch {
      this.results.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  tags(item: Listing): string[] {
    const list = [
      item.revenue,
      item.specialization,
      item.price ? `Avg. $${item.price}` : null,
      item.emergencyService ? '24/7 support' : null,
    ];
    return list.filter((t): t is string => Boolean(t)).slice(0, 3);
  }

  pick(item: Listing): void {
    this.query = item.name;
    this.dropdownOpen.set(false);
    void this.router.navigate(['/agency'], {
      queryParams: { slug: item.slug || slugify(item.name), id: item.id },
    });
  }

  submitSearch(): void {
    const exact = this.results().find((r) => normalizeName(r.name) === normalizeName(this.query));
    const target = exact ?? this.results()[0];
    if (target) {
      this.pick(target);
    } else if (this.query.trim()) {
      void this.router.navigate(['/catagory'], { queryParams: { q: this.query.trim() } });
    }
  }

  scrollPopular(event: Event): void {
    this.menuOpen.set(false);
    if (this.router.url.split('?')[0] === '/') {
      event.preventDefault();
      document.getElementById('home-popular-listings')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  signIn(): void {
    this.menuOpen.set(false);
    this.modal.openModal('navbar');
  }
}
