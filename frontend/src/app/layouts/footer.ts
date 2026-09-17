import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="mt-16 border-t border-[#eee] bg-[#fff9e6]">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src="/logo/logo.png" alt="Yellow Book" width="140" height="34" />
          <p class="mt-3 text-sm text-[#616161]">
            Reliable support from real people, solving everyday problems with care, speed, and
            integrity.
          </p>
        </div>
        <div>
          <h4 class="mb-3 text-sm font-semibold text-[#212121]">Explore</h4>
          <ul class="space-y-2 text-sm text-[#616161]">
            <li><a routerLink="/catagory">Category</a></li>
            <li><a routerLink="/popular-list">Popular Listing</a></li>
            <li><a routerLink="/faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 class="mb-3 text-sm font-semibold text-[#212121]">Company</h4>
          <ul class="space-y-2 text-sm text-[#616161]">
            <li><a routerLink="/about">About Us</a></li>
            <li><a routerLink="/contact">Contact Us</a></li>
            <li><a routerLink="/auth/register">List Your Agency</a></li>
          </ul>
        </div>
        <div>
          <h4 class="mb-3 text-sm font-semibold text-[#212121]">Accounts</h4>
          <ul class="space-y-2 text-sm text-[#616161]">
            <li><a routerLink="/auth/login">User sign in</a></li>
            <li><a routerLink="/auth/company/login">Company sign in</a></li>
            <li><a routerLink="/auth/staff/login">Staff sign in</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-[#f0e6c8] py-4 text-center text-xs text-[#9e9e9e]">
        © {{ year }} Yellow Book. All rights reserved.
      </div>
    </footer>
  `,
})
export class Footer {
  readonly year = new Date().getFullYear();
}
