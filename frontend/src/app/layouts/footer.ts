import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe],
  template: `
    <footer class="mt-16 border-t border-[#eee] bg-[#fff9e6]">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src="/logo/logo.png" alt="Yellow Book" width="140" height="34" />
          <p class="mt-3 text-sm text-[#616161]">{{ 'footer.tagline' | translate }}</p>
        </div>
        <div>
          <h4 class="mb-3 text-sm font-semibold text-[#212121]">
            {{ 'footer.explore' | translate }}
          </h4>
          <ul class="space-y-2 text-sm text-[#616161]">
            <li>
              <a routerLink="/catagory">{{ 'nav.category' | translate }}</a>
            </li>
            <li>
              <a routerLink="/popular-list">{{ 'nav.popular' | translate }}</a>
            </li>
            <li>
              <a routerLink="/faq">{{ 'nav.faq' | translate }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="mb-3 text-sm font-semibold text-[#212121]">
            {{ 'footer.company' | translate }}
          </h4>
          <ul class="space-y-2 text-sm text-[#616161]">
            <li>
              <a routerLink="/about">{{ 'footer.aboutUs' | translate }}</a>
            </li>
            <li>
              <a routerLink="/contact">{{ 'footer.contactUs' | translate }}</a>
            </li>
            <li>
              <a routerLink="/business/signup">{{ 'auth.listYourBusiness' | translate }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="mb-3 text-sm font-semibold text-[#212121]">
            {{ 'footer.accounts' | translate }}
          </h4>
          <ul class="space-y-2 text-sm text-[#616161]">
            <li>
              <a routerLink="/auth/login">{{ 'footer.signIn' | translate }}</a>
            </li>
            <li>
              <a routerLink="/auth/signup">{{ 'footer.createAccount' | translate }}</a>
            </li>
            <li>
              <a routerLink="/business/signup">{{ 'auth.listYourBusiness' | translate }}</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-[#f0e6c8] py-4 text-center text-xs text-[#9e9e9e]">
        {{ 'footer.rights' | translate: { year: year } }}
      </div>
    </footer>
  `,
})
export class Footer {
  readonly year = new Date().getFullYear();
}
