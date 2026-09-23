import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CompanyRecord } from '../../core/models';
import {
  EMPLOYEE_OPTIONS,
  LOCATION_OPTIONS,
  REVENUE_OPTIONS,
  UB_DISTRICTS,
} from '../../core/utils/mongolia';

/** `/company/my-company` — the public company record editor. */
@Component({
  selector: 'app-my-company-page',
  imports: [FormsModule, TranslatePipe],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-2xl font-bold text-[#212121]">{{ 'company.myCompany' | translate }}</h1>
        <p class="text-sm text-gray-500">{{ 'company.myCompanyLead' | translate }}</p>
      </div>
      @if (company()) {
        <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold"
          >{{ statusLabel() | translate }} ·
          {{ (company()?.verified ? 'company.verified' : 'company.unverified') | translate }}</span
        >
      }
    </header>
    @if (!company() && !error()) {
      <p class="text-gray-500">{{ 'company.loadingCompany' | translate }}</p>
    }
    @if (error()) {
      <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
    }
    @if (company()) {
      <form class="yb-card space-y-5 p-6" (ngSubmit)="save()" novalidate>
        <section>
          <h2 class="mb-3 text-lg font-semibold">{{ 'company.details' | translate }}</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-medium" for="mc-name">{{
                'company.name' | translate
              }}</label
              ><input class="yb-input" id="mc-name" name="name" [(ngModel)]="form.name" />
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-tagline">{{
                'company.tagline' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-tagline"
                name="tagline"
                [attr.placeholder]="'company.taglinePlaceholder' | translate"
                [(ngModel)]="form.tagline"
              />
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-category">{{
                'common.category' | translate
              }}</label>
              <select class="yb-input" id="mc-category" name="category" [(ngModel)]="form.category">
                <option value="">{{ 'company.select' | translate }}</option>
                @for (c of categoryOptions(); track c) {
                  <option [value]="c">{{ c }}</option>
                }
                @if (form.category && !categoryOptions().includes(form.category)) {
                  <option [value]="form.category">{{ form.category }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-industry">{{
                'company.industry' | translate
              }}</label>
              <input
                class="yb-input"
                id="mc-industry"
                name="industry"
                [(ngModel)]="form.industry"
              />
              <p class="text-xs text-gray-400">{{ 'company.industryHint' | translate }}</p>
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-service">{{
                'company.serviceType' | translate
              }}</label
              ><input class="yb-input" id="mc-service" name="service" [(ngModel)]="form.service" />
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-specialization">{{
                'company.specialization' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-specialization"
                name="specialization"
                [(ngModel)]="form.specialization"
              />
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-employees">{{
                'business.employees' | translate
              }}</label>
              <select
                class="yb-input"
                id="mc-employees"
                name="employees"
                [(ngModel)]="form.employees"
              >
                <option value="">{{ 'company.select' | translate }}</option>
                @for (e of employeeOptions; track e) {
                  <option [value]="e">{{ e }}</option>
                }
                @if (form.employees && !employeeOptions.includes(form.employees)) {
                  <option [value]="form.employees">{{ form.employees }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-revenue">{{
                'business.revenue' | translate
              }}</label>
              <select class="yb-input" id="mc-revenue" name="revenue" [(ngModel)]="form.revenue">
                <option value="">{{ 'company.select' | translate }}</option>
                @for (r of revenueOptions; track r) {
                  <option [value]="r">{{ r }}</option>
                }
                @if (form.revenue && !revenueValues.includes(form.revenue)) {
                  <option [value]="form.revenue">{{ form.revenue }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-price">{{
                'company.price' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-price"
                type="number"
                name="price"
                [(ngModel)]="form.price"
              />
              <p class="text-xs text-gray-400">{{ 'company.priceHint' | translate }}</p>
            </div>
            <div class="flex items-center gap-2 pt-6">
              <input
                id="emergency"
                type="checkbox"
                name="emergencyService"
                [(ngModel)]="form.emergencyService"
              /><label for="emergency" class="text-sm">{{ 'company.emergency' | translate }}</label>
            </div>
          </div>
          <div class="mt-4">
            <label class="text-sm font-medium" for="mc-description">{{
              'company.description' | translate
            }}</label>
            <textarea
              class="yb-input"
              id="mc-description"
              rows="4"
              name="description"
              [attr.placeholder]="'company.descriptionPlaceholder' | translate"
              [(ngModel)]="form.description"
            ></textarea>
          </div>
        </section>
        <section>
          <h2 class="mb-3 text-lg font-semibold">{{ 'company.contact' | translate }}</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-medium" for="mc-website">{{
                'common.website' | translate
              }}</label
              ><input class="yb-input" id="mc-website" name="website" [(ngModel)]="form.website" />
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-email">{{
                'common.email' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-email"
                type="email"
                name="contactEmail"
                [(ngModel)]="form.contactEmail"
              />
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-phone">{{
                'common.phone' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-phone"
                name="mobile"
                placeholder="88112233"
                [(ngModel)]="form.mobile"
              />
              <p class="text-xs text-gray-400">{{ 'company.phoneHint' | translate }}</p>
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-location">{{
                'common.location' | translate
              }}</label>
              <select class="yb-input" id="mc-location" name="location" [(ngModel)]="form.location">
                <option value="">{{ 'company.select' | translate }}</option>
                @for (l of locationOptions; track l) {
                  <option [value]="l">{{ l }}</option>
                }
                @if (form.location && !locationOptions.includes(form.location)) {
                  <option [value]="form.location">{{ form.location }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-district">{{
                'common.district' | translate
              }}</label>
              <select class="yb-input" id="mc-district" name="district" [(ngModel)]="form.district">
                <option value="">{{ 'company.select' | translate }}</option>
                @for (d of districtOptions; track d) {
                  <option [value]="d">{{ d }}</option>
                }
                @if (form.district && !districtOptions.includes(form.district)) {
                  <option [value]="form.district">{{ form.district }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-facebook">{{
                'company.facebookUrl' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-facebook"
                name="facebookUrl"
                placeholder="https://facebook.com/..."
                [(ngModel)]="form.facebookUrl"
              />
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-registration">{{
                'company.registrationNumber' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-registration"
                name="registrationNumber"
                inputmode="numeric"
                placeholder="6012345"
                [(ngModel)]="form.registrationNumber"
              />
              <p class="text-xs text-gray-400">{{ 'company.registrationHint' | translate }}</p>
            </div>
          </div>
        </section>
        <section>
          <h2 class="mb-3 text-lg font-semibold">{{ 'company.owner' | translate }}</h2>
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="text-sm font-medium" for="mc-first-name">{{
                'common.firstName' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-first-name"
                name="firstName"
                [(ngModel)]="form.firstName"
              />
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-last-name">{{
                'common.lastName' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-last-name"
                name="lastName"
                [(ngModel)]="form.lastName"
              />
            </div>
            <div>
              <label class="text-sm font-medium" for="mc-job-title">{{
                'common.jobTitle' | translate
              }}</label
              ><input
                class="yb-input"
                id="mc-job-title"
                name="jobTitle"
                [(ngModel)]="form.jobTitle"
              />
            </div>
          </div>
        </section>
        @if (saved()) {
          <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {{ 'company.saved' | translate }}
          </p>
        }
        <div class="flex gap-2">
          <button
            type="submit"
            class="yb-btn yb-btn-gold"
            data-testid="company-profile-save"
            [disabled]="busy()"
          >
            {{ busy() ? ('common.pleaseWait' | translate) : ('common.saveChanges' | translate) }}
          </button>
          <a
            class="yb-btn yb-btn-outline"
            [href]="'/agency?id=' + company()?.id + '&slug=' + company()?.slug"
            target="_blank"
            rel="noopener"
            >{{ 'company.viewPublicPage' | translate }}</a
          >
        </div>
      </form>
    }
  `,
})
export class MyCompanyPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  readonly company = signal<CompanyRecord | null>(null);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);
  /** The same list the registration wizard offers, in the caller's language. */
  readonly categoryOptions = signal<string[]>([]);
  readonly employeeOptions = EMPLOYEE_OPTIONS;
  readonly revenueOptions = REVENUE_OPTIONS;
  readonly revenueValues = REVENUE_OPTIONS;
  readonly locationOptions = LOCATION_OPTIONS;
  readonly districtOptions = UB_DISTRICTS;
  readonly statusLabel = computed(() => {
    const status = String(this.company()?.status ?? '').toLowerCase();
    const known = ['pending', 'approved', 'rejected', 'suspended'];
    return `company.status.${known.includes(status) ? status : 'unknown'}`;
  });
  form = {
    name: '',
    tagline: '',
    category: '',
    industry: '',
    service: '',
    specialization: '',
    employees: '',
    revenue: '',
    price: null as number | null,
    emergencyService: false,
    description: '',
    website: '',
    contactEmail: '',
    mobile: '',
    location: '',
    district: '',
    facebookUrl: '',
    registrationNumber: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
  };

  async ngOnInit(): Promise<void> {
    void this.api
      .getData<{ categories: string[] }>('company-registration-options', undefined, {
        toast: { showError: false },
      })
      .then((data) => this.categoryOptions.set(data?.categories ?? []))
      .catch(() => undefined);
    try {
      const c = await this.api.getData<CompanyRecord>('agency/company', undefined, {
        toast: { showError: false },
      });
      this.company.set(c);
      this.form = {
        name: c.name,
        tagline: c.tagline ?? '',
        category: c.category ?? '',
        industry: c.industry ?? '',
        service: c.serviceType ?? '',
        specialization: c.specialization ?? '',
        employees: c.employees ?? '',
        revenue: c.revenue ?? '',
        price: c.price ?? null,
        emergencyService: Boolean(c.emergencyService),
        description: c.description ?? '',
        website: c.website ?? '',
        contactEmail: c.contactEmail ?? c.email ?? '',
        mobile: c.mobile ?? c.phoneNumber ?? '',
        location: c.location ?? '',
        district: c.district ?? '',
        facebookUrl: c.facebookUrl ?? '',
        registrationNumber: c.registrationNumber ?? '',
        firstName: c.firstName ?? '',
        lastName: c.lastName ?? '',
        jobTitle: c.jobTitle ?? '',
      };
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : this.translate.instant('company.loadFailed'));
    }
  }

  async save(): Promise<void> {
    this.busy.set(true);
    this.saved.set(false);
    try {
      const updated = await this.api.putData<CompanyRecord>('agency/company', {
        name: this.form.name,
        tagline: this.form.tagline,
        category: this.form.category,
        industry: this.form.industry,
        service: this.form.service,
        specialization: this.form.specialization,
        employees: this.form.employees,
        revenue: this.form.revenue,
        price: this.form.price,
        emergencyService: this.form.emergencyService,
        description: this.form.description,
        website: this.form.website,
        contactEmail: this.form.contactEmail,
        mobile: this.form.mobile,
        location: this.form.location,
        district: this.form.district,
        facebookUrl: this.form.facebookUrl,
        registrationNumber: this.form.registrationNumber,
        firstName: this.form.firstName,
        lastName: this.form.lastName,
        jobTitle: this.form.jobTitle,
      });
      this.company.set(updated);
      this.saved.set(true);
      this.toast.success(this.translate.instant('company.saved'));
    } catch {
      this.toast.alert(this.translate.instant('company.saveFailed'));
    } finally {
      this.busy.set(false);
    }
  }
}
