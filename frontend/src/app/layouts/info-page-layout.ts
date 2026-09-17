import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { Footer } from './footer';
import { InfoPageNav } from './info-page-nav';

/** Nav + footer shell; hides its nav on the category detail view (`/catagory?name=`). */
@Component({
  selector: 'app-info-page-layout',
  imports: [RouterOutlet, InfoPageNav, Footer],
  template: `
    <div class="flex min-h-screen flex-col" [class.bg-white]="true">
      @if (!hideNav()) {
        <app-info-page-nav />
      }
      <main class="flex-1"><router-outlet /></main>
      <app-footer />
    </div>
  `,
})
export class InfoPageLayout {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(
    this.route.queryParamMap.pipe(map((q) => q.get('name') ?? '')),
    { initialValue: '' },
  );
  readonly hideNav = computed(
    () => this.router.url.startsWith('/catagory') && this.query().trim().length > 0,
  );
}
