import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { resolvePostLoginRedirect } from '../../core/utils/role-access';
import { PASSWORD_RULE_TEXT } from '../../core/utils/password-policy';
import {
  EMPLOYEE_OPTIONS,
  LOCATION_OPTIONS,
  REVENUE_OPTIONS,
  UB_DISTRICTS,
} from '../../core/utils/mongolia';

interface RegistrationOptions {
  categories: string[];
  services: string[];
  destinations: string[];
}

/** `/business/signup` — three-step business registration. */
@Component({
  selector: 'app-register-page',
  imports: [RouterLink, FormsModule, TranslatePipe],
  template: `
    <div class="mx-auto max-w-2xl py-10">
      <div class="yb-card p-8">
        <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
          {{ 'business.registration' | translate }}
        </p>
        <h1 class="mt-2 text-2xl font-bold text-[#212121]">{{ 'business.title' | translate }}</h1>
        <p class="mt-1 text-sm text-gray-600">{{ 'business.lead' | translate }}</p>
        <div class="mt-6 h-2 rounded-full bg-gray-100">
          <div
            class="h-2 rounded-full bg-[#fcc207] transition-all"
            [style.width.%]="(step() / 3) * 100"
          ></div>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          {{ 'business.step' | translate: { current: step(), total: 3 } }}
        </p>

        <form class="mt-6 space-y-4" (ngSubmit)="next()" novalidate>
          @if (step() === 1) {
            <div>
              <label class="text-sm font-medium" for="biz-name"
                >{{ 'business.companyName' | translate }} *</label
              >
              <input
                class="yb-input"
                id="biz-name"
                name="companyName"
                [(ngModel)]="form.companyName"
                required
              />
            </div>
            <div>
              <label class="text-sm font-medium" for="biz-category">{{
                'business.category' | translate
              }}</label>
              <select
                class="yb-input"
                id="biz-category"
                name="category"
                [(ngModel)]="form.category"
              >
                <option value="">{{ 'business.category' | translate }}</option>
                @for (c of options().categories; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="text-sm font-medium" for="biz-location">{{
                  'common.location' | translate
                }}</label>
                <select
                  class="yb-input"
                  id="biz-location"
                  name="location"
                  [(ngModel)]="form.location"
                >
                  @for (l of locationOptions; track l) {
                    <option [value]="l">{{ l }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-sm font-medium" for="biz-district">{{
                  'business.district' | translate
                }}</label>
                <select
                  class="yb-input"
                  id="biz-district"
                  name="district"
                  [(ngModel)]="form.district"
                >
                  <option value="">—</option>
                  @for (d of districtOptions; track d) {
                    <option [value]="d">{{ d }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="text-sm font-medium" for="biz-facebook">{{
                  'business.facebookPage' | translate
                }}</label>
                <input
                  class="yb-input"
                  id="biz-facebook"
                  name="facebookUrl"
                  placeholder="https://facebook.com/..."
                  [(ngModel)]="form.facebookUrl"
                />
              </div>
              <div>
                <label class="text-sm font-medium" for="biz-website">{{
                  'business.website' | translate
                }}</label>
                <input
                  class="yb-input"
                  id="biz-website"
                  name="website"
                  placeholder="https://"
                  [(ngModel)]="form.website"
                />
              </div>
            </div>
          } @else if (step() === 2) {
            <div>
              <label class="text-sm font-medium" for="biz-registration">
                {{ 'business.registrationNumber' | translate }}
              </label>
              <input
                class="yb-input"
                id="biz-registration"
                name="registrationNumber"
                inputmode="numeric"
                placeholder="6012345"
                [(ngModel)]="form.registrationNumber"
              />
              <p class="mt-1 text-xs text-gray-500">
                {{ 'business.registrationHint' | translate }}
              </p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="text-sm font-medium" for="biz-employees">{{
                  'business.employees' | translate
                }}</label>
                <select
                  class="yb-input"
                  id="biz-employees"
                  name="employees"
                  [(ngModel)]="form.employees"
                >
                  <option value="">—</option>
                  @for (e of employeeOptions; track e) {
                    <option [value]="e">{{ e }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-sm font-medium" for="biz-revenue">{{
                  'business.revenue' | translate
                }}</label>
                <select class="yb-input" id="biz-revenue" name="revenue" [(ngModel)]="form.revenue">
                  <option value="">—</option>
                  @for (r of revenueOptions; track r) {
                    <option [value]="r">{{ r }}</option>
                  }
                </select>
              </div>
            </div>
            <div>
              <label class="text-sm font-medium" for="biz-description">{{
                'business.description' | translate
              }}</label>
              <textarea
                class="yb-input"
                id="biz-description"
                rows="4"
                name="description"
                [(ngModel)]="form.description"
              ></textarea>
            </div>
          } @else {
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="text-sm font-medium" for="biz-first-name"
                  >{{ 'business.firstName' | translate }} *</label
                ><input
                  class="yb-input"
                  id="biz-first-name"
                  name="firstName"
                  [attr.placeholder]="'business.firstName' | translate"
                  [(ngModel)]="form.firstName"
                  required
                />
              </div>
              <div>
                <label class="text-sm font-medium" for="biz-last-name"
                  >{{ 'business.lastName' | translate }} *</label
                ><input
                  class="yb-input"
                  id="biz-last-name"
                  name="lastName"
                  [attr.placeholder]="'business.lastName' | translate"
                  [(ngModel)]="form.lastName"
                  required
                />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium" for="biz-job-title">{{
                'business.jobTitle' | translate
              }}</label
              ><input
                class="yb-input"
                id="biz-job-title"
                name="jobTitle"
                [attr.placeholder]="'business.jobTitle' | translate"
                [(ngModel)]="form.jobTitle"
              />
            </div>
            <div class="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                <label class="text-sm font-medium" for="biz-country">{{
                  'business.country' | translate
                }}</label>
                <select
                  class="yb-input"
                  id="biz-country"
                  name="country"
                  [(ngModel)]="form.countryCode"
                >
                  @for (c of countries; track c.code) {
                    <option [value]="c.code">{{ c.flag }} {{ c.code }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-sm font-medium" for="biz-phone">{{
                  'business.phoneNumber' | translate
                }}</label
                ><input
                  class="yb-input"
                  id="biz-phone"
                  name="phone"
                  placeholder="88112233"
                  [(ngModel)]="form.phone"
                />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium" for="biz-email"
                >{{ 'business.workEmail' | translate }} *</label
              ><input
                class="yb-input"
                type="email"
                id="biz-email"
                name="email"
                placeholder="you@company.mn"
                [(ngModel)]="form.email"
                required
              />
            </div>
            <div>
              <label class="text-sm font-medium" for="biz-password"
                >{{ 'business.password' | translate }} *</label
              ><input
                class="yb-input"
                type="password"
                id="biz-password"
                name="password"
                [attr.placeholder]="ruleText"
                [(ngModel)]="form.password"
                required
              />
            </div>
            <p class="text-xs text-gray-500">
              {{ ruleText }}
            </p>
          }
          @if (error()) {
            <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {{ error() }}
            </p>
          }
          <div class="flex items-center justify-between pt-2">
            <button
              type="button"
              class="yb-btn yb-btn-outline"
              [disabled]="step() === 1 || busy()"
              (click)="prev()"
            >
              {{ 'common.previous' | translate }}
            </button>
            <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">
              {{
                step() === 3
                  ? busy()
                    ? ('common.pleaseWait' | translate)
                    : ('common.submit' | translate)
                  : ('common.next' | translate)
              }}
            </button>
          </div>
        </form>
        <div class="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-600">
          <p>
            {{ 'auth.alreadyRegistered' | translate }}
            <a routerLink="/auth/login" class="text-[#1877f2]">{{
              'business.signIn' | translate
            }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly step = signal(1);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly options = signal<RegistrationOptions>({
    categories: [],
    services: [],
    destinations: [],
  });
  readonly employeeOptions = EMPLOYEE_OPTIONS;
  readonly districtOptions = UB_DISTRICTS;
  readonly locationOptions = LOCATION_OPTIONS;
  readonly revenueOptions = REVENUE_OPTIONS;
  readonly countries = [
    { code: '+976', flag: '🇲🇳', name: 'Монгол' },
    { code: '+86', flag: '🇨🇳', name: 'Хятад' },
    { code: '+7', flag: '🇷🇺', name: 'Орос' },
  ];
  readonly ruleText = PASSWORD_RULE_TEXT;
  form = {
    companyName: '',
    website: '',
    category: '',
    service: '',
    destination: '',
    employees: '',
    revenue: '',
    description: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    countryCode: '+976',
    phone: '',
    email: '',
    password: '',
    district: '',
    location: 'Улаанбаатар',
    facebookUrl: '',
    registrationNumber: '',
  };
  readonly progress = computed(() => (this.step() / 3) * 100);

  ngOnInit(): void {
    void this.api
      .getData<RegistrationOptions>('company-registration-options', undefined, {
        toast: { showError: false },
      })
      .then((data) => this.options.set(data ?? { categories: [], services: [], destinations: [] }))
      .catch(() => undefined);
  }

  prev(): void {
    this.error.set(null);
    this.step.update((s) => Math.max(1, s - 1));
  }

  async next(): Promise<void> {
    this.error.set(null);
    if (this.step() === 1 && !this.form.companyName.trim()) {
      this.error.set('Company name is required');
      return;
    }
    if (this.step() < 3) {
      this.step.update((s) => s + 1);
      return;
    }
    if (!this.form.firstName.trim() || !this.form.lastName.trim()) {
      this.error.set('First and last name are required');
      return;
    }
    if (!this.form.email.trim() || !this.form.password) {
      this.error.set('Email and password are required');
      return;
    }
    this.busy.set(true);
    try {
      const country = this.countries.find((c) => c.code === this.form.countryCode);
      await this.auth.register({
        email: this.form.email,
        password: this.form.password,
        companyName: this.form.companyName.trim(),
        ownerName: `${this.form.firstName} ${this.form.lastName}`.trim(),
        phone: this.form.phone ? `${this.form.countryCode}${this.form.phone}` : '',
        district: this.form.district,
        location: this.form.location,
        facebookUrl: this.form.facebookUrl,
        registrationNumber: this.form.registrationNumber,
        website: this.form.website,
        category: this.form.category,
        description: this.form.description,
        service: this.form.service,
        destination: this.form.destination,
        employees: this.form.employees,
        revenue: this.form.revenue,
        firstName: this.form.firstName,
        lastName: this.form.lastName,
        jobTitle: this.form.jobTitle,
        countryCode: this.form.countryCode,
        country: country?.name ?? '',
        phoneNumber: this.form.phone,
        contactEmail: this.form.email,
      });
      await this.router.navigateByUrl(
        resolvePostLoginRedirect(this.auth.user(), null, '/company/dashboard'),
      );
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      this.busy.set(false);
    }
  }
}
