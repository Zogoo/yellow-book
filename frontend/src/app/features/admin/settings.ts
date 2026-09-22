import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { PASSWORD_RULE_TEXT, passwordProblem } from '../../core/utils/password-policy';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/** `/admin/settings` — password change and (for the current admin) permission preview. */
@Component({
  selector: 'app-admin-settings-page',
  imports: [FormsModule, RouterLink],
  template: `
    <header><h1 class="text-2xl font-bold text-[#212121]">Settings</h1></header>
    <div class="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav class="yb-card flex flex-col p-2">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-left text-sm"
          [class.bg-[#fff9e6]]="tab() === 'password'"
          (click)="tab.set('password')"
        >
          Change Password
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-left text-sm"
          [class.bg-[#fff9e6]]="tab() === 'roles'"
          (click)="tab.set('roles')"
        >
          Role &amp; Permission
        </button>
      </nav>
      @if (tab() === 'password') {
        <form class="yb-card space-y-4 p-6" (ngSubmit)="updatePassword()" novalidate>
          <h2 class="text-lg font-semibold">Change Password</h2>
          <input
            class="yb-input"
            type="password"
            name="current"
            placeholder="Enter current password"
            [(ngModel)]="pw.current"
            aria-label="Current Password"
          />
          <input
            class="yb-input"
            type="password"
            name="next"
            placeholder="New password"
            [(ngModel)]="pw.next"
            aria-label="New Password"
          />
          <input
            class="yb-input"
            type="password"
            name="confirm"
            placeholder="Confirm password"
            [(ngModel)]="pw.confirm"
            aria-label="Confirm Password"
          />
          @if (message()) {
            <p class="text-sm" [class.text-red-600]="!ok()" [class.text-emerald-600]="ok()">
              {{ message() }}
            </p>
          }
          <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">
            Update Password
          </button>
        </form>
      } @else {
        <section class="yb-card space-y-3 p-6">
          <h2 class="text-lg font-semibold">Role &amp; permissions</h2>
          <p class="text-sm text-gray-500">
            Signed in as <strong>{{ auth.user()?.name }}</strong> ({{ roleLabel() }}).
          </p>
          @if (permissions().length === 0) {
            <p class="text-sm text-gray-600">
              {{
                isSuperAdmin()
                  ? 'As a super admin you have every permission on the platform.'
                  : 'No granular permissions are assigned to your account.'
              }}
            </p>
          } @else {
            <ul class="grid gap-2 sm:grid-cols-2">
              @for (permission of permissions(); track permission) {
                <li class="rounded-lg border border-gray-100 px-3 py-2 text-sm">
                  <span class="mr-2 text-green-600" aria-hidden="true">✓</span>{{ permission }}
                </li>
              }
            </ul>
          }
          <p class="text-xs text-gray-500">
            Permissions are granted by a super admin from
            <a routerLink="/admin/admin-management" class="text-[#1877f2]">Admin Management</a>.
          </p>
        </section>
      }
    </div>
  `,
})
export class AdminSettingsPage {
  readonly auth = inject(AuthService);
  readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  readonly tab = signal<'password' | 'roles'>('password');
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  readonly ok = signal(false);
  pw = { current: '', next: '', confirm: '' };
  readonly permissions = computed(() =>
    (this.auth.user()?.permissions ?? []).map((p) => String(p).replace(/_/g, ' ')),
  );
  readonly isSuperAdmin = computed(
    () => String(this.auth.user()?.['adminRole'] ?? '') === 'SUPER_ADMIN',
  );
  readonly roleLabel = computed(() =>
    String(this.auth.user()?.['adminRole'] ?? this.auth.user()?.role ?? '')
      .replace(/_/g, ' ')
      .toLowerCase(),
  );

  async updatePassword(): Promise<void> {
    this.ok.set(false);
    const problem = passwordProblem(this.pw.next);
    if (!this.pw.current) return this.message.set('Enter your current password.');
    if (problem) return this.message.set(problem);
    if (this.pw.next !== this.pw.confirm) return this.message.set('New passwords do not match.');

    this.busy.set(true);
    try {
      await this.auth.changePassword(this.pw.current, this.pw.next);
      this.ok.set(true);
      this.message.set('Password updated. Other devices have been signed out.');
      this.pw = { current: '', next: '', confirm: '' };
    } catch (e) {
      this.message.set(e instanceof Error ? e.message : 'Unable to update password.');
    } finally {
      this.busy.set(false);
    }
  }
}
