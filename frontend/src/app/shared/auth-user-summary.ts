import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { getDefaultRouteForUser } from '../core/utils/role-access';
import { TranslatePipe } from '@ngx-translate/core';

/** Shown in place of a login form when the visitor is already signed in. */
@Component({
  selector: 'app-auth-user-summary',
  imports: [TranslatePipe],
  template: `
    <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm">
      <p class="font-semibold text-emerald-800">{{ 'auth.signedIn' | translate }}</p>
      <p class="text-emerald-700">{{ auth.user()?.name || auth.user()?.email }}</p>
      <div class="mt-3 flex gap-2">
        <button type="button" class="yb-btn yb-btn-gold" (click)="goDashboard()">
          {{ 'auth.goToDashboard' | translate }}
        </button>
        <button type="button" class="yb-btn yb-btn-outline" (click)="auth.logout()">
          {{ 'common.logout' | translate }}
        </button>
      </div>
    </div>
  `,
})
export class AuthUserSummary {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  goDashboard(): void {
    void this.router.navigateByUrl(getDefaultRouteForUser(this.auth.user()));
  }
}
