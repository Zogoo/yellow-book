import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CompanyProfile } from '../../core/models';

/** `/company/settings` — password change + notification preference toggles. */
@Component({
  selector: 'app-company-settings-page',
  imports: [FormsModule],
  template: `
    <header>
      <h1 class="text-2xl font-bold text-[#212121]">Welcome {{ fullName() }}</h1>
    </header>
    <div class="grid gap-6 lg:grid-cols-2">
      <form class="yb-card space-y-4 p-6" (ngSubmit)="updatePassword()" novalidate>
        <h2 class="text-lg font-semibold">Change Password</h2>
        @for (field of fields; track field.key) {
          <div>
            <label class="text-sm font-medium">{{ field.label }}</label>
            <div class="relative">
              <input
                class="yb-input pr-14"
                [type]="show[field.key] ? 'text' : 'password'"
                [name]="field.key"
                [(ngModel)]="pw[field.key]"
              />
              <button
                type="button"
                class="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-500"
                (click)="show[field.key] = !show[field.key]"
              >
                {{ show[field.key] ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>
        }
        @if (message()) {
          <p class="text-sm" [class.text-red-600]="!ok()" [class.text-emerald-600]="ok()">
            {{ message() }}
          </p>
        }
        <button type="submit" class="yb-btn bg-emerald-600 text-white" [disabled]="busy()">
          {{ busy() ? 'Saving...' : 'Update Password' }}
        </button>
      </form>
      <section class="yb-card space-y-4 p-6">
        <h2 class="text-lg font-semibold">Notification Preferences</h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">Email Notifications</p>
            <p class="text-xs text-gray-500">
              Receive email notifications for new reviews and updates
            </p>
          </div>
          <button
            type="button"
            class="h-7 w-12 rounded-full transition"
            [class.bg-emerald-500]="prefs.emailNotifications"
            [class.bg-gray-300]="!prefs.emailNotifications"
            role="switch"
            [attr.aria-checked]="prefs.emailNotifications"
            aria-label="Email notifications"
            (click)="toggle('emailNotifications')"
          >
            <span
              class="block h-5 w-5 rounded-full bg-white transition"
              [class.translate-x-6]="prefs.emailNotifications"
              [class.translate-x-1]="!prefs.emailNotifications"
            ></span>
          </button>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">Push Notifications</p>
            <p class="text-xs text-gray-500">Receive push notifications for important updates</p>
          </div>
          <button
            type="button"
            class="h-7 w-12 rounded-full transition"
            [class.bg-emerald-500]="prefs.pushNotifications"
            [class.bg-gray-300]="!prefs.pushNotifications"
            role="switch"
            [attr.aria-checked]="prefs.pushNotifications"
            aria-label="Push notifications"
            (click)="toggle('pushNotifications')"
          >
            <span
              class="block h-5 w-5 rounded-full bg-white transition"
              [class.translate-x-6]="prefs.pushNotifications"
              [class.translate-x-1]="!prefs.pushNotifications"
            ></span>
          </button>
        </div>
        @if (prefMessage()) {
          <p class="text-sm text-gray-600">{{ prefMessage() }}</p>
        }
      </section>
    </div>
  `,
})
export class CompanySettingsPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly fullName = signal('');
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  readonly ok = signal(false);
  readonly prefMessage = signal<string | null>(null);
  readonly fields = [
    { key: 'current' as const, label: 'Current Password' },
    { key: 'next' as const, label: 'New Password' },
    { key: 'confirm' as const, label: 'Confirm Password' },
  ];
  pw: Record<'current' | 'next' | 'confirm', string> = { current: '', next: '', confirm: '' };
  show: Record<'current' | 'next' | 'confirm', boolean> = {
    current: false,
    next: false,
    confirm: false,
  };
  prefs = { emailNotifications: true, pushNotifications: true };

  async ngOnInit(): Promise<void> {
    try {
      const p = await this.api.getData<CompanyProfile>('company/profile');
      this.fullName.set(p.fullName ?? '');
      this.prefs = {
        emailNotifications: p.preferences?.emailNotifications ?? true,
        pushNotifications: p.preferences?.pushNotifications ?? true,
      };
    } catch {
      this.toast.alert('Unable to load settings');
    }
  }

  async updatePassword(): Promise<void> {
    this.ok.set(false);
    if (!this.pw.current) return this.message.set('Please enter your current password');
    if (!this.pw.next) return this.message.set('Please enter a new password');
    if (this.pw.next.length < 6)
      return this.message.set('Password must be at least 6 characters long');
    if (this.pw.next !== this.pw.confirm) return this.message.set('New passwords do not match');
    if (this.pw.next === this.pw.current)
      return this.message.set('New password must be different from current password');
    this.busy.set(true);
    try {
      await this.api.putData('company/profile', {
        security: { lastPasswordChange: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
      });
      this.ok.set(true);
      this.message.set('Password updated successfully!');
      this.pw = { current: '', next: '', confirm: '' };
    } catch {
      this.message.set('Unable to update password.');
    } finally {
      this.busy.set(false);
    }
  }

  async toggle(key: 'emailNotifications' | 'pushNotifications'): Promise<void> {
    this.prefs = { ...this.prefs, [key]: !this.prefs[key] };
    try {
      await this.api.putData('company/profile', {
        preferences: this.prefs,
        updatedAt: new Date().toISOString(),
      });
      this.prefMessage.set('Notification preferences updated.');
    } catch {
      this.prefs = { ...this.prefs, [key]: !this.prefs[key] };
      this.prefMessage.set('Unable to update notification preferences.');
    }
  }
}
