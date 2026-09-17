import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/** `/admin/settings` — password change and (for the current admin) permission preview. */
@Component({
  selector: 'app-admin-settings-page',
  imports: [FormsModule],
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
          <h2 class="text-lg font-semibold">Role &amp; Permission</h2>
          <p class="text-sm text-gray-500">
            Signed in as <strong>{{ auth.user()?.name }}</strong> ({{
              auth.user()?.adminRole || auth.user()?.role
            }}).
          </p>
          @for (item of roleItems; track item.key) {
            <label class="flex items-center gap-2 text-sm"
              ><input
                type="checkbox"
                [checked]="item.checked"
                (change)="item.checked = !item.checked"
              />
              {{ item.label }}</label
            >
          }
          <button
            type="button"
            class="yb-btn yb-btn-gold"
            (click)="toast.success('Permissions saved for this session')"
          >
            Update Permissions
          </button>
        </section>
      }
    </div>
  `,
})
export class AdminSettingsPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  readonly tab = signal<'password' | 'roles'>('password');
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  readonly ok = signal(false);
  pw = { current: '', next: '', confirm: '' };
  roleItems = [
    { key: 'users', label: 'Manage Users', checked: true },
    { key: 'reviews', label: 'Review Management', checked: false },
    { key: 'companies', label: 'Company Verification', checked: false },
  ];

  ngOnInit(): void {
    const perms = new Set((this.auth.user()?.permissions ?? []).map(String));
    this.roleItems = this.roleItems.map((i) => ({
      ...i,
      checked: i.checked || [...perms].some((p) => p.startsWith(i.key)),
    }));
  }

  async updatePassword(): Promise<void> {
    this.ok.set(false);
    if (!this.pw.current) return this.message.set('Please enter your current password');
    if (!this.pw.next) return this.message.set('Please enter a new password');
    if (this.pw.next !== this.pw.confirm) return this.message.set('New passwords do not match');
    const id = this.auth.user()?.id;
    if (!id) return this.message.set('Unable to resolve your admin account');
    this.busy.set(true);
    try {
      await this.api.putData(
        `admins/${id}`,
        { password: this.pw.next },
        { toast: { showError: false } },
      );
      this.ok.set(true);
      this.message.set('Password updated successfully!');
      this.pw = { current: '', next: '', confirm: '' };
    } catch (e) {
      this.message.set(e instanceof Error ? e.message : 'Unable to update password');
    } finally {
      this.busy.set(false);
    }
  }
}
