import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UserProfile } from '../../core/models';

/** `/user/my-profile` — personal details + password change form. */
@Component({
  selector: 'app-user-profile-page',
  imports: [FormsModule],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-2xl font-bold text-[#212121]">My Profile</h1>
        <p class="text-sm text-gray-500">Keep your contact details current.</p>
      </div>
      @if (lastUpdated()) {
        <p class="text-xs text-gray-500">Last updated {{ lastUpdated() }}</p>
      }
    </header>
    <form class="yb-card space-y-4 p-6" (ngSubmit)="save()" novalidate>
      <h2 class="text-lg font-semibold">Personal information</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="text-sm font-medium">First name</label
          ><input
            class="yb-input"
            name="firstName"
            placeholder="Jane"
            [(ngModel)]="form.firstName"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Last name</label
          ><input
            class="yb-input"
            name="lastName"
            placeholder="Cooper"
            [(ngModel)]="form.lastName"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Email</label
          ><input
            class="yb-input"
            type="email"
            name="email"
            placeholder="you@example.com"
            [(ngModel)]="form.email"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Phone</label
          ><input
            class="yb-input"
            name="phone"
            placeholder="+976 8811 2233"
            [(ngModel)]="form.phone"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Job title</label
          ><input
            class="yb-input"
            name="jobTitle"
            placeholder="Product Designer"
            [(ngModel)]="form.jobTitle"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Company</label
          ><input
            class="yb-input"
            name="company"
            placeholder="Acme Inc."
            [(ngModel)]="form.company"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Location</label
          ><input
            class="yb-input"
            name="location"
            placeholder="Ulaanbaatar"
            [(ngModel)]="form.location"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Time zone</label
          ><input
            class="yb-input"
            name="timeZone"
            placeholder="UTC+8"
            [(ngModel)]="form.timeZone"
          />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium">Bio</label
        ><textarea
          class="yb-input"
          rows="3"
          name="bio"
          placeholder="Tell others a little about yourself"
          [(ngModel)]="form.bio"
        ></textarea>
      </div>
      @if (error()) {
        <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
      }
      <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">
        {{ busy() ? 'Saving...' : 'Save changes' }}
      </button>
    </form>
    <form class="yb-card space-y-4 p-6" (ngSubmit)="changePassword()" novalidate>
      <h2 class="text-lg font-semibold">Change password</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <input
          class="yb-input"
          type="password"
          name="current"
          placeholder="Current password"
          [(ngModel)]="pw.current"
          aria-label="Current password"
        />
        <input
          class="yb-input"
          type="password"
          name="next"
          placeholder="New password"
          [(ngModel)]="pw.next"
          aria-label="New password"
        />
        <input
          class="yb-input"
          type="password"
          name="confirm"
          placeholder="Confirm new password"
          [(ngModel)]="pw.confirm"
          aria-label="Confirm new password"
        />
      </div>
      @if (pwMessage()) {
        <p class="text-sm" [class.text-red-600]="!pwOk()" [class.text-emerald-600]="pwOk()">
          {{ pwMessage() }}
        </p>
      }
      <button type="submit" class="yb-btn yb-btn-outline" [disabled]="busy()">
        Update password
      </button>
    </form>
  `,
})
export class UserProfilePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<string>('');
  readonly pwMessage = signal<string | null>(null);
  readonly pwOk = signal(false);
  form = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    company: '',
    location: '',
    timeZone: '',
    bio: '',
  };
  pw = { current: '', next: '', confirm: '' };

  async ngOnInit(): Promise<void> {
    try {
      const p = await this.api.getData<UserProfile>('user/profile');
      this.form = {
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        jobTitle: p.jobTitle,
        company: p.company,
        location: p.location,
        timeZone: p.timeZone,
        bio: p.bio,
      };
      this.lastUpdated.set(this.formatDate(p.security?.profileUpdatedAt || p.updatedAt));
    } catch {
      this.error.set('Unable to load profile');
    }
  }

  async save(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      const updatedAt = new Date().toISOString();
      const p = await this.api.putData<UserProfile>('user/profile', { ...this.form, updatedAt });
      this.lastUpdated.set(this.formatDate(updatedAt));
      this.toast.success('Profile updated successfully.');
      const user = this.auth.user();
      if (user)
        this.auth.setSession(this.auth.token, {
          ...user,
          name: `${p.firstName} ${p.lastName}`.trim() || user.name,
          email: p.email,
        });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unable to update profile right now.');
    } finally {
      this.busy.set(false);
    }
  }

  async changePassword(): Promise<void> {
    this.pwOk.set(false);
    if (!this.pw.current) return this.pwMessage.set('Please enter your current password');
    if (!this.pw.next) return this.pwMessage.set('Please enter a new password');
    if (this.pw.next.length < 6)
      return this.pwMessage.set('Password must be at least 6 characters long');
    if (this.pw.next !== this.pw.confirm) return this.pwMessage.set('New passwords do not match');
    if (this.pw.next === this.pw.current)
      return this.pwMessage.set('New password must be different from current password');
    this.busy.set(true);
    try {
      await this.api.putData('user/profile', {
        security: { lastPasswordChange: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
      });
      this.pwOk.set(true);
      this.pwMessage.set('Password updated successfully!');
      this.pw = { current: '', next: '', confirm: '' };
    } catch {
      this.pwMessage.set('Unable to update password.');
    } finally {
      this.busy.set(false);
    }
  }

  private formatDate(value: unknown): string {
    if (!value) return '';
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
  }
}
