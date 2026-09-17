import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { PanelProfileMenu } from '../shared/panel-profile-menu';

export type PanelKind = 'admin' | 'agent' | 'company' | 'user';

interface MenuItem {
  label: string;
  to: string;
  icon: string;
}

const MENUS: Record<PanelKind, MenuItem[]> = {
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: '▦' },
    { label: 'Company Management', to: '/admin/manage-companies', icon: '🏢' },
    { label: 'User Management', to: '/admin/manage-users', icon: '👥' },
    { label: 'Review Management', to: '/admin/manage-review', icon: '⭐' },
    { label: 'Admin Management', to: '/admin/admin-management', icon: '🛡' },
    { label: 'Settings', to: '/admin/settings', icon: '⚙' },
  ],
  company: [
    { label: 'Dashboard', to: '/company/dashboard', icon: '▦' },
    { label: 'My Company', to: '/company/my-company', icon: '🏢' },
    { label: 'Review', to: '/company/review', icon: '⭐' },
    { label: 'My Profile', to: '/company/my-profile', icon: '👤' },
    { label: 'Notification', to: '/company/notification', icon: '🔔' },
    { label: 'Settings', to: '/company/settings', icon: '⚙' },
  ],
  agent: [
    { label: 'dashboard', to: '/agent/dashboard', icon: '▦' },
    { label: 'my assign task', to: '/agent/assign-companies', icon: '📋' },
    { label: 'review approval', to: '/agent/review-approval', icon: '⭐' },
    { label: 'my profile', to: '/agent/my-profile', icon: '👤' },
  ],
  user: [
    { label: 'dashboard', to: '/user/dashboard', icon: '▦' },
    { label: 'my reviews', to: '/user/my-reviews', icon: '⭐' },
    { label: 'favourite companies', to: '/user/favourite-companies', icon: '❤' },
    { label: 'my profile', to: '/user/my-profile', icon: '👤' },
  ],
};

const ROLE_CAPTIONS: Record<PanelKind, string> = {
  admin: 'Super Admin',
  agent: 'Sub Admin',
  company: 'Company Panel',
  user: 'User Profile',
};

/** Header + 280 px sidebar shell shared by the four panels. */
@Component({
  selector: 'app-panel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PanelProfileMenu],
  template: `
    <div class="panel-shell">
      <header
        class="flex items-center justify-between border-b border-[#eee] bg-white px-4 py-3 sm:px-8"
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 p-2 md:hidden"
            aria-label="Toggle sidebar"
            (click)="sidebarOpen.set(!sidebarOpen())"
          >
            ☰
          </button>
          <a routerLink="/" aria-label="Yellow Book home"
            ><img src="/logo/logo.png" alt="Yellow Book" width="140" height="34"
          /></a>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 sm:hidden">{{ caption() }}</span>
          <button
            type="button"
            class="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Open notifications"
          >
            🔔
          </button>
          <app-panel-profile-menu [roleLabel]="caption()" [dashboardTo]="menu()[0].to" />
        </div>
      </header>
      <div class="panel-shell__body">
        @if (sidebarOpen()) {
          <div
            class="fixed inset-0 z-30 bg-black/40 md:hidden"
            (click)="sidebarOpen.set(false)"
          ></div>
        }
        <aside
          class="fixed top-0 left-0 z-40 h-full w-[280px] border-r border-[#eee] bg-white shadow-[4px_12px_23px_rgba(0,0,0,0.08)] transition-transform md:static md:h-auto md:translate-x-0"
          [class.-translate-x-full]="!sidebarOpen()"
          aria-label="Sidebar"
        >
          <nav class="flex flex-col gap-1 p-4">
            @for (item of menu(); track item.to) {
              <a
                [routerLink]="item.to"
                routerLinkActive="bg-[#f3f3f3] font-semibold"
                class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-gray-700 capitalize hover:bg-[#f7f7f7]"
                (click)="sidebarOpen.set(false)"
              >
                <span aria-hidden="true">{{ item.icon }}</span
                >{{ item.label }}
              </a>
            }
          </nav>
        </aside>
        <main class="panel-shell__main">
          <div class="panel-shell__content panel-stack"><router-outlet /></div>
        </main>
      </div>
    </div>
  `,
})
export class PanelLayout {
  readonly kind = input.required<PanelKind>();
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly sidebarOpen = signal(false);
  readonly menu = computed(() => MENUS[this.kind()]);
  readonly caption = computed(() => ROLE_CAPTIONS[this.kind()]);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.sidebarOpen.set(false);
  }
}
