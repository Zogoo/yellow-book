import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SubadminProfile } from '../../core/models';
import { PASSWORD_RULE_TEXT, passwordProblem } from '../../core/utils/password-policy';

/** `/agent/my-profile` — profile info and password tabs. */
@Component({
  selector: 'app-agent-profile-page',
  imports: [FormsModule],
  template: `
    <header
      class="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6"
    >
      <div>
        <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
          Agent workspace
        </p>
        <h1 class="text-2xl font-bold text-[#212121]">Hi {{ form.fullName || 'Agent' }}</h1>
        <p class="text-sm text-gray-600">Keep your contact details and credentials up to date.</p>
      </div>
      <div class="text-right text-xs text-gray-600">
        <p>
          <span
            class="mr-1 inline-block h-2 w-2 rounded-full"
            [class.bg-amber-400]="busy()"
            [class.animate-pulse]="busy()"
            [class.bg-green-500]="!busy()"
          ></span
          >Last saved {{ lastSaved() || 'never' }}
        </p>
        <p>Password updated {{ passwordUpdated() || 'never' }}</p>
      </div>
    </header>
    @if (banner(); as b) {
      <div
        class="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm text-white shadow-lg"
        [class.bg-emerald-600]="b.ok"
        [class.bg-rose-600]="!b.ok"
        role="status"
      >
        <strong>{{ b.ok ? 'Success' : 'Heads up' }}</strong> · {{ b.text }}
        <button type="button" class="ml-3" aria-label="Dismiss" (click)="banner.set(null)">
          ✕
        </button>
      </div>
    }
    <div class="flex gap-2">
      <button
        type="button"
        class="yb-btn"
        [class.yb-btn-gold]="tab() === 'profile'"
        [class.yb-btn-outline]="tab() !== 'profile'"
        (click)="tab.set('profile')"
      >
        Profile Info
      </button>
      <button
        type="button"
        class="yb-btn"
        [class.yb-btn-gold]="tab() === 'password'"
        [class.yb-btn-outline]="tab() !== 'password'"
        (click)="tab.set('password')"
      >
        Change Password
      </button>
    </div>
    @if (tab() === 'profile') {
      <form class="yb-card space-y-4 p-6" (ngSubmit)="saveProfile()" novalidate>
        <div>
          <h2 class="text-lg font-semibold">Profile Information</h2>
          <p class="text-sm text-gray-500">Update your personal information and contact details</p>
        </div>
        @if (formError()) {
          <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            Please fix the highlighted fields.
          </p>
        }
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-medium" for="agent-full-name">Full Name</label
            ><input
              class="yb-input"
              name="fullName"
              id="agent-full-name"
              placeholder="Your full name"
              [(ngModel)]="form.fullName"
            />
            @if (errors.fullName) {
              <p class="text-xs text-red-600">{{ errors.fullName }}</p>
            }
          </div>
          <div>
            <label class="text-sm font-medium" for="agent-email">Email</label
            ><input
              class="yb-input"
              type="email"
              name="email"
              id="agent-email"
              placeholder="you@yellowbook.local"
              [(ngModel)]="form.email"
            />
            @if (errors.email) {
              <p class="text-xs text-red-600">{{ errors.email }}</p>
            }
          </div>
          <div>
            <label class="text-sm font-medium" for="agent-mobile">Mobile</label
            ><input
              class="yb-input"
              name="mobile"
              id="agent-mobile"
              placeholder="+976 8811 2233"
              [(ngModel)]="form.mobile"
            />
            @if (errors.mobile) {
              <p class="text-xs text-red-600">{{ errors.mobile }}</p>
            }
          </div>
          <div>
            <label class="text-sm font-medium" for="agent-role">Role / Title</label
            ><select class="yb-input" name="role" id="agent-role" [(ngModel)]="form.role">
              <option value="">Select role</option>
              @for (r of roleOptions; track r) {
                <option [value]="r">{{ r }}</option>
              }
              @if (form.role && !roleOptions.includes(form.role)) {
                <option [value]="form.role">{{ form.role }}</option>
              }
            </select>
            @if (errors.role) {
              <p class="text-xs text-red-600">{{ errors.role }}</p>
            }
          </div>
          <div>
            <label class="text-sm font-medium" for="agent-location">Location</label
            ><select
              class="yb-input"
              name="location"
              id="agent-location"
              [(ngModel)]="form.location"
            >
              <option value="">Select location</option>
              @for (l of locationOptions; track l) {
                <option [value]="l">{{ l }}</option>
              }
              @if (form.location && !locationOptions.includes(form.location)) {
                <option [value]="form.location">{{ form.location }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-sm font-medium" for="agent-timezone">Timezone</label
            ><select
              class="yb-input"
              name="timezone"
              id="agent-timezone"
              [(ngModel)]="form.timezone"
            >
              <option value="">Select timezone</option>
              @for (t of timezoneOptions; track t) {
                <option [value]="t">{{ t }}</option>
              }
              @if (form.timezone && !timezoneOptions.includes(form.timezone)) {
                <option [value]="form.timezone">{{ form.timezone }}</option>
              }
            </select>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium" for="agent-bio">About you</label
          ><textarea
            class="yb-input"
            rows="3"
            maxlength="240"
            name="bio"
            id="agent-bio"
            placeholder="Write about yourself in 24 words"
            [(ngModel)]="form.bio"
          ></textarea>
          <p class="text-xs text-gray-400">{{ form.bio.length }}/240 characters</p>
        </div>
        <label class="flex items-center gap-2 text-sm"
          ><input type="checkbox" name="notifications" [(ngModel)]="form.notifications" /> Enable
          task notifications</label
        >
        <label class="flex items-center gap-2 text-sm"
          ><input type="checkbox" name="weeklyDigest" [(ngModel)]="form.weeklyDigest" /> Send weekly
          digest</label
        >
        <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">
          {{ busy() ? 'Saving…' : 'Update Profile' }}
        </button>
      </form>
    } @else {
      <form class="yb-card space-y-4 p-6" (ngSubmit)="savePassword()" novalidate>
        <div>
          <h2 class="text-lg font-semibold">Change Password</h2>
          <p class="text-sm text-gray-500">
            Secure your account by updating your password regularly
          </p>
        </div>
        <label class="text-sm font-medium" for="agent-pw-current">Current password</label>
        <input
          class="yb-input"
          id="agent-pw-current"
          type="password"
          name="current"
          [(ngModel)]="pw.current"
        />
        <label class="text-sm font-medium" for="agent-pw-next">New password</label>
        <input
          class="yb-input"
          id="agent-pw-next"
          type="password"
          name="next"
          [(ngModel)]="pw.next"
        />
        <label class="text-sm font-medium" for="agent-pw-confirm">Confirm new password</label>
        <input
          class="yb-input"
          id="agent-pw-confirm"
          type="password"
          name="confirm"
          [(ngModel)]="pw.confirm"
        />
        <ul class="list-disc pl-5 text-xs text-gray-500">
          <li>{{ passwordRule }}</li>
        </ul>
        @if (pwError()) {
          <p class="text-sm text-red-600" role="alert">{{ pwError() }}</p>
        }
        <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">
          {{ busy() ? 'Updating…' : 'Update Password' }}
        </button>
      </form>
    }
  `,
})
export class AgentProfilePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly tab = signal<'profile' | 'password'>('profile');
  readonly busy = signal(false);
  readonly lastSaved = signal('');
  readonly passwordUpdated = signal('');
  readonly banner = signal<{ ok: boolean; text: string } | null>(null);
  readonly formError = signal(false);
  readonly pwError = signal<string | null>(null);
  readonly roleOptions = [
    'Senior Verification Specialist',
    'Compliance Lead',
    'Quality Analyst',
    'Support Lead',
    'Account Manager',
  ];
  readonly locationOptions = ['Ulaanbaatar', 'Darkhan', 'Erdenet', 'Choibalsan', 'Remote / Hybrid'];
  readonly timezoneOptions = [
    'UTC+8 (Ulaanbaatar)',
    'UTC+7 (Hovd)',
    'UTC+1 (CET)',
    'UTC-5 (EST)',
    'UTC-8 (PST)',
  ];
  form = {
    fullName: '',
    email: '',
    mobile: '',
    role: '',
    location: '',
    timezone: '',
    bio: '',
    notifications: true,
    weeklyDigest: false,
  };
  errors: { fullName?: string; email?: string; mobile?: string; role?: string } = {};
  pw = { current: '', next: '', confirm: '' };
  readonly passwordRule = PASSWORD_RULE_TEXT;

  async ngOnInit(): Promise<void> {
    try {
      const p = await this.api.getData<SubadminProfile>('subadmin/profile', undefined, {
        toast: { showError: false },
      });
      this.form = {
        fullName: p.fullName ?? '',
        email: p.email ?? '',
        mobile: p.mobile || p.phone || '',
        role: p.role ?? '',
        location: p.location ?? '',
        timezone: p.timezone ?? '',
        bio: p.bio ?? '',
        notifications: p.preferences?.notifications ?? true,
        weeklyDigest: p.preferences?.weeklyDigest ?? false,
      };
      this.lastSaved.set(this.fmt(p.updatedAt));
      this.passwordUpdated.set(this.fmt(p.security?.lastPasswordChange));
    } catch {
      this.show(false, 'Unable to load profile data right now.');
    }
  }

  async saveProfile(): Promise<void> {
    this.errors = {};
    if (!this.form.fullName.trim()) this.errors.fullName = 'Full name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim()))
      this.errors.email = 'Provide a valid email.';
    if (!this.form.mobile.trim()) this.errors.mobile = 'Phone number is required.';
    if (!this.form.role) this.errors.role = 'Role / Title is required.';
    this.formError.set(Object.keys(this.errors).length > 0);
    if (this.formError()) return;
    this.busy.set(true);
    try {
      const updatedAt = new Date().toISOString();
      await this.api.putData(
        'subadmin/profile',
        {
          fullName: this.form.fullName.trim(),
          email: this.form.email.trim(),
          mobile: this.form.mobile.trim(),
          phone: this.form.mobile.trim(),
          role: this.form.role,
          location: this.form.location,
          timezone: this.form.timezone,
          bio: this.form.bio,
          preferences: {
            notifications: this.form.notifications,
            weeklyDigest: this.form.weeklyDigest,
          },
          updatedAt,
        },
        { toast: { showError: false } },
      );
      this.lastSaved.set(this.fmt(updatedAt));
      this.show(true, 'Profile updated successfully.');
      const user = this.auth.user();
      if (user)
        this.auth.setSession(this.auth.token, {
          ...user,
          name: this.form.fullName.trim(),
          email: this.form.email.trim(),
        });
    } catch {
      this.show(false, 'Unable to update profile right now.');
    } finally {
      this.busy.set(false);
    }
  }

  async savePassword(): Promise<void> {
    this.pwError.set(null);
    const problem = passwordProblem(this.pw.next);
    if (!this.pw.current) return this.pwError.set('Enter your current password.');
    if (problem) return this.pwError.set(problem);
    if (this.pw.next !== this.pw.confirm) return this.pwError.set('New passwords do not match.');

    this.busy.set(true);
    try {
      await this.auth.changePassword(this.pw.current, this.pw.next);
      this.passwordUpdated.set(this.fmt(new Date().toISOString()));
      this.pw = { current: '', next: '', confirm: '' };
      this.show(true, 'Password updated. Other devices have been signed out.');
    } catch (e) {
      this.pwError.set(e instanceof Error ? e.message : 'Unable to update password.');
    } finally {
      this.busy.set(false);
    }
  }

  private show(ok: boolean, text: string): void {
    this.banner.set({ ok, text });
    if (ok) this.toast.success(text);
    else this.toast.alert(text);
    setTimeout(() => this.banner.set(null), 3800);
  }

  private fmt(value: unknown): string {
    if (!value) return '';
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
  }
}
