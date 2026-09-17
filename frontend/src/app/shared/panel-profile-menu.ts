import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { getDefaultRouteForUser } from '../core/utils/role-access';

/** Avatar button + "Signed in as" dropdown with Dashboard / Logout. */
@Component({
  selector: 'app-panel-profile-menu',
  template: `
    <div class="relative">
      <button
        type="button"
        class="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#fcc207] text-sm font-bold text-[#212121]"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        <span class="sr-only">Open profile menu</span>
        <span aria-hidden="true">{{ initials() }}</span>
        <span
          class="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"
        ></span>
      </button>
      @if (open()) {
        <div
          class="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-lg"
          role="menu"
        >
          <div class="px-3 py-2">
            <p class="text-xs text-gray-500">Signed in as</p>
            <p class="truncate text-sm font-semibold text-gray-900">{{ displayName() }}</p>
            <p class="text-xs text-gray-400">{{ roleLabel() }}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
            (click)="goDashboard()"
          >
            <span aria-hidden="true">▦</span> Dashboard
          </button>
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            (click)="logout()"
          >
            <span aria-hidden="true">⎋</span> Logout
          </button>
        </div>
      }
    </div>
  `,
})
export class PanelProfileMenu {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly roleLabel = input('Account');
  readonly dashboardTo = input<string | null>(null);
  readonly open = signal(false);
  readonly displayName = computed(
    () => this.auth.user()?.name || this.auth.user()?.email || 'Guest user',
  );
  readonly initials = computed(() => {
    const name = String(this.displayName());
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) return name.slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  goDashboard(): void {
    this.open.set(false);
    void this.router.navigateByUrl(this.dashboardTo() || getDefaultRouteForUser(this.auth.user()));
  }

  logout(): void {
    this.open.set(false);
    void this.auth.logout();
  }
}
