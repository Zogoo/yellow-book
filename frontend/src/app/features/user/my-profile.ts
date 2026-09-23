import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UserProfile } from '../../core/models';
import { PASSWORD_RULE_TEXT, passwordProblem } from '../../core/utils/password-policy';

/** `/user/my-profile` — personal details + password change form. */
@Component({
  selector: 'app-user-profile-page',
  imports: [FormsModule, TranslatePipe],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-2xl font-bold text-[#212121]">{{ 'user.myProfile' | translate }}</h1>
      </div>
      @if (lastUpdated()) {
        <p class="text-xs text-gray-500">
          {{ 'user.lastUpdated' | translate: { date: lastUpdated() } }}
        </p>
      }
    </header>
    <form class="yb-card space-y-4 p-6" (ngSubmit)="save()" novalidate>
      <h2 class="text-lg font-semibold">{{ 'user.personalInformation' | translate }}</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="text-sm font-medium" for="user-firstName">{{
            'common.firstName' | translate
          }}</label
          ><input
            id="user-firstName"
            class="yb-input"
            name="firstName"
            [(ngModel)]="form.firstName"
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="user-lastName">{{
            'common.lastName' | translate
          }}</label
          ><input id="user-lastName" class="yb-input" name="lastName" [(ngModel)]="form.lastName" />
        </div>
        <div>
          <label class="text-sm font-medium" for="user-email">{{
            'common.email' | translate
          }}</label
          ><input
            id="user-email"
            class="yb-input"
            type="email"
            name="email"
            placeholder="you@example.com"
            [(ngModel)]="form.email"
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="user-phone">{{
            'common.phone' | translate
          }}</label
          ><input
            id="user-phone"
            class="yb-input"
            name="phone"
            placeholder="+976 8811 2233"
            [(ngModel)]="form.phone"
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="user-jobTitle">{{
            'common.jobTitle' | translate
          }}</label
          ><input
            id="user-jobTitle"
            class="yb-input"
            name="jobTitle"
            [attr.placeholder]="'user.jobTitlePlaceholder' | translate"
            [(ngModel)]="form.jobTitle"
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="user-company">{{
            'user.company' | translate
          }}</label
          ><input id="user-company" class="yb-input" name="company" [(ngModel)]="form.company" />
        </div>
        <div>
          <label class="text-sm font-medium" for="user-location">{{
            'common.location' | translate
          }}</label
          ><input
            id="user-location"
            class="yb-input"
            name="location"
            placeholder="Улаанбаатар"
            [(ngModel)]="form.location"
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="user-timeZone">{{
            'common.timezone' | translate
          }}</label
          ><input id="user-timeZone" class="yb-input" name="timeZone" [(ngModel)]="form.timeZone" />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium" for="user-bio">{{ 'user.bio' | translate }}</label
        ><textarea
          id="user-bio"
          class="yb-input"
          rows="3"
          name="bio"
          [attr.placeholder]="'user.bioPlaceholder' | translate"
          [(ngModel)]="form.bio"
        ></textarea>
      </div>
      @if (error()) {
        <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
      }
      <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">
        {{ busy() ? ('common.pleaseWait' | translate) : ('common.saveChanges' | translate) }}
      </button>
    </form>
    <form class="yb-card space-y-4 p-6" (ngSubmit)="changePassword()" novalidate>
      <h2 class="text-lg font-semibold">{{ 'user.changePassword' | translate }}</h2>
      <p class="text-xs text-gray-500">{{ passwordRule }}</p>
      <div class="grid gap-4 sm:grid-cols-3">
        <label class="text-sm font-medium" for="user-pw-current">{{
          'user.currentPassword' | translate
        }}</label>
        <input
          class="yb-input"
          id="user-pw-current"
          type="password"
          name="current"
          [(ngModel)]="pw.current"
        />
        <label class="text-sm font-medium" for="user-pw-next">{{
          'user.newPassword' | translate
        }}</label>
        <input
          class="yb-input"
          id="user-pw-next"
          type="password"
          name="next"
          [(ngModel)]="pw.next"
        />
        <label class="text-sm font-medium" for="user-pw-confirm">{{
          'user.confirmPassword' | translate
        }}</label>
        <input
          class="yb-input"
          id="user-pw-confirm"
          type="password"
          name="confirm"
          [(ngModel)]="pw.confirm"
        />
      </div>
      @if (pwMessage()) {
        <p class="text-sm" [class.text-red-600]="!pwOk()" [class.text-emerald-600]="pwOk()">
          {{ pwMessage() }}
        </p>
      }
      <button type="submit" class="yb-btn yb-btn-outline" [disabled]="busy()">
        {{ 'user.updatePassword' | translate }}
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
  readonly passwordRule = PASSWORD_RULE_TEXT;

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
    const problem = passwordProblem(this.pw.next);
    if (!this.pw.current) return this.pwMessage.set('Enter your current password.');
    if (problem) return this.pwMessage.set(problem);
    if (this.pw.next !== this.pw.confirm) return this.pwMessage.set('New passwords do not match.');

    this.busy.set(true);
    try {
      await this.auth.changePassword(this.pw.current, this.pw.next);
      this.pwOk.set(true);
      this.pwMessage.set('Password updated. Other devices have been signed out.');
      this.pw = { current: '', next: '', confirm: '' };
    } catch (e) {
      this.pwMessage.set(e instanceof Error ? e.message : 'Unable to update password.');
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
