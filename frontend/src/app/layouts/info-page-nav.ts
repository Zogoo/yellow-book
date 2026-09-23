import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../core/services/auth.service';
import { LoginModalService } from '../core/services/login-modal.service';
import { getDefaultRouteForUser } from '../core/utils/role-access';
import { PanelProfileMenu } from '../shared/panel-profile-menu';
import { LanguageSwitcher } from '../shared/language-switcher';

/** Compact navigation used by the category, popular-list and FAQ pages. */
@Component({
  selector: 'app-info-page-nav',
  imports: [RouterLink, PanelProfileMenu, TranslatePipe, LanguageSwitcher],
  template: `
    <header class="bg-[#fff9e6]">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <a routerLink="/" [attr.aria-label]="'common.homeLink' | translate"
          ><img src="/logo/logo.png" alt="Yellow Book" width="140" height="34"
        /></a>
        <nav class="hidden items-center gap-8 md:flex">
          <a
            routerLink="/catagory"
            class="text-sm font-medium text-[#616161] hover:text-[#212121]"
            >{{ 'nav.category' | translate }}</a
          >
          <a
            routerLink="/popular-list"
            class="text-sm font-medium text-[#616161] hover:text-[#212121]"
            >{{ 'nav.popular' | translate }}</a
          >
          <a routerLink="/faq" class="text-sm font-medium text-[#616161] hover:text-[#212121]">{{
            'nav.faq' | translate
          }}</a>
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
            <button
              type="button"
              class="text-sm font-semibold"
              (click)="modal.openModal('info-nav')"
            >
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
          (click)="open.set(!open())"
        >
          ☰
        </button>
      </div>
      @if (open()) {
        <div class="fixed inset-0 z-40 bg-black/40 md:hidden" (click)="open.set(false)"></div>
        <aside
          class="fixed top-0 right-0 z-50 flex h-full w-[80vw] max-w-[400px] flex-col gap-4 bg-white p-6 shadow-xl md:hidden"
        >
          <button
            type="button"
            class="self-end"
            [attr.aria-label]="'common.closeMenu' | translate"
            (click)="open.set(false)"
          >
            ✕
          </button>
          <a routerLink="/catagory" (click)="open.set(false)">{{ 'nav.category' | translate }}</a>
          <a routerLink="/popular-list" (click)="open.set(false)">{{
            'nav.popular' | translate
          }}</a>
          <a routerLink="/faq" (click)="open.set(false)">{{ 'nav.faq' | translate }}</a>
          <a routerLink="/business/signup" (click)="open.set(false)">{{
            'nav.forBusinesses' | translate
          }}</a>
          @if (auth.isAuthenticated()) {
            <a [routerLink]="dashboardTo()" (click)="open.set(false)">{{
              'nav.myDashboard' | translate
            }}</a>
            <button type="button" class="text-left text-red-600" (click)="auth.logout()">
              {{ 'nav.logOut' | translate }}
            </button>
          } @else {
            <button
              type="button"
              class="text-left"
              (click)="open.set(false); modal.openModal('info-nav')"
            >
              {{ 'nav.logIn' | translate }}
            </button>
            <a routerLink="/auth/signup" (click)="open.set(false)" class="yb-btn yb-btn-gold"
              >Sign up</a
            >
          }
        </aside>
      }
    </header>
  `,
})
export class InfoPageNav {
  readonly auth = inject(AuthService);
  readonly modal = inject(LoginModalService);
  readonly open = signal(false);
  readonly dashboardTo = computed(() => getDefaultRouteForUser(this.auth.user()));
}
