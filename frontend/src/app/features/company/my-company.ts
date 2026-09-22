import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CompanyRecord } from '../../core/models';

/** `/company/my-company` — the public company record editor. */
@Component({
  selector: 'app-my-company-page',
  imports: [FormsModule],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-2xl font-bold text-[#212121]">My Company</h1>
        <p class="text-sm text-gray-500">This is what visitors see on your public agency page.</p>
      </div>
      @if (company()) {
        <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize"
          >{{ company()?.status }} · {{ company()?.verified ? 'Verified' : 'Unverified' }}</span
        >
      }
    </header>
    @if (!company() && !error()) {
      <p class="text-gray-500">Loading company...</p>
    }
    @if (error()) {
      <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
    }
    @if (company()) {
      <form class="yb-card space-y-5 p-6" (ngSubmit)="save()" novalidate>
        <section>
          <h2 class="mb-3 text-lg font-semibold">Company details</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Company name</label
              ><input class="yb-input" name="name" [(ngModel)]="form.name" />
            </div>
            <div>
              <label class="text-sm font-medium">Tagline</label
              ><input
                class="yb-input"
                name="tagline"
                placeholder="Top-rated services in Mongolia"
                [(ngModel)]="form.tagline"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Category</label>
              <select class="yb-input" name="category" [(ngModel)]="form.category">
                @for (c of categoryOptions; track c) {
                  <option [value]="c">{{ c }}</option>
                }
                @if (form.category && !categoryOptions.includes(form.category)) {
                  <option [value]="form.category">{{ form.category }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Industry</label>
              <select class="yb-input" name="industry" [(ngModel)]="form.industry">
                <option value="">Select industry</option>
                @for (i of industryOptions; track i) {
                  <option [value]="i">{{ i }}</option>
                }
                @if (form.industry && !industryOptions.includes(form.industry)) {
                  <option [value]="form.industry">{{ form.industry }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Service type</label
              ><input class="yb-input" name="service" [(ngModel)]="form.service" />
            </div>
            <div>
              <label class="text-sm font-medium">Specialization</label
              ><input class="yb-input" name="specialization" [(ngModel)]="form.specialization" />
            </div>
            <div>
              <label class="text-sm font-medium">Employees</label>
              <select class="yb-input" name="employees" [(ngModel)]="form.employees">
                <option value="">Select</option>
                @for (e of employeeOptions; track e) {
                  <option [value]="e">{{ e }}</option>
                }
                @if (
                  form.employees && !['1-10', '10-20', '21-50', '51+'].includes(form.employees)
                ) {
                  <option [value]="form.employees">{{ form.employees }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Annual revenue</label>
              <select class="yb-input" name="revenue" [(ngModel)]="form.revenue">
                <option value="">Select</option>
                @for (r of revenueOptions; track r.value) {
                  <option [value]="r.value">{{ r.label }}</option>
                }
                @if (form.revenue && !revenueValues.includes(form.revenue)) {
                  <option [value]="form.revenue">{{ form.revenue }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Consultation price (USD)</label
              ><input class="yb-input" type="number" name="price" [(ngModel)]="form.price" />
            </div>
            <div class="flex items-center gap-2 pt-6">
              <input
                id="emergency"
                type="checkbox"
                name="emergencyService"
                [(ngModel)]="form.emergencyService"
              /><label for="emergency" class="text-sm">24/7 emergency service</label>
            </div>
          </div>
          <div class="mt-4">
            <label class="text-sm font-medium">Description</label>
            <textarea
              class="yb-input"
              rows="4"
              name="description"
              placeholder="Describe your company's mission, products, and services..."
              [(ngModel)]="form.description"
            ></textarea>
          </div>
        </section>
        <section>
          <h2 class="mb-3 text-lg font-semibold">Contact</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Website</label
              ><input class="yb-input" name="website" [(ngModel)]="form.website" />
            </div>
            <div>
              <label class="text-sm font-medium">Contact email</label
              ><input
                class="yb-input"
                type="email"
                name="contactEmail"
                [(ngModel)]="form.contactEmail"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Phone</label
              ><input class="yb-input" name="mobile" [(ngModel)]="form.mobile" />
            </div>
            <div>
              <label class="text-sm font-medium">Location</label>
              <select class="yb-input" name="location" [(ngModel)]="form.location">
                <option value="">Select location</option>
                @for (l of locationOptions; track l) {
                  <option [value]="l">{{ l }}</option>
                }
                @if (form.location && !locationOptions.includes(form.location)) {
                  <option [value]="form.location">{{ form.location }}</option>
                }
              </select>
            </div>
          </div>
        </section>
        <section>
          <h2 class="mb-3 text-lg font-semibold">Owner</h2>
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="text-sm font-medium">First name</label
              ><input class="yb-input" name="firstName" [(ngModel)]="form.firstName" />
            </div>
            <div>
              <label class="text-sm font-medium">Last name</label
              ><input class="yb-input" name="lastName" [(ngModel)]="form.lastName" />
            </div>
            <div>
              <label class="text-sm font-medium">Job title</label
              ><input class="yb-input" name="jobTitle" [(ngModel)]="form.jobTitle" />
            </div>
          </div>
        </section>
        @if (saved()) {
          <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            Company profile saved.
          </p>
        }
        <div class="flex gap-2">
          <button
            type="submit"
            class="yb-btn yb-btn-gold"
            data-testid="company-profile-save"
            [disabled]="busy()"
          >
            {{ busy() ? 'Saving...' : 'Save changes' }}
          </button>
          <a
            class="yb-btn yb-btn-outline"
            [href]="'/agency?id=' + company()?.id + '&slug=' + company()?.slug"
            target="_blank"
            rel="noopener"
            >View public page ↗</a
          >
        </div>
      </form>
    }
  `,
})
export class MyCompanyPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly company = signal<CompanyRecord | null>(null);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);
  readonly categoryOptions = [
    'Travel & Tourism',
    'Hospitality',
    'Restaurants & Cafes',
    'IT & Software',
    'Beauty & Wellbeing',
    'Animals & Pets',
    'Education',
    'Home Services',
    'Retail',
    'Construction',
  ];
  readonly industryOptions = [
    'Travel Tour Operator',
    'Hotel & Lodging',
    'Food & Beverage',
    'Software Development',
    'Salon & Spa',
    'Veterinary',
    'Training & Tutoring',
    'Repair & Maintenance',
    'E-commerce',
    'Real Estate',
  ];
  readonly employeeOptions = ['1-10', '11-30', '31-50', '51-100', '100+'];
  readonly revenueOptions = [
    { value: '0-100k', label: '0 – 100K MNT' },
    { value: '100k-500k', label: '100K – 500K MNT' },
    { value: '500k-1m', label: '500K – 1M MNT' },
    { value: '1m+', label: '1M+ MNT' },
  ];
  readonly revenueValues = this.revenueOptions.map((r) => r.value);
  readonly locationOptions = [
    'Ulaanbaatar',
    'Darkhan',
    'Erdenet',
    'Choibalsan',
    'Khovd',
    'Ölgii',
    'Mörön',
    'Bayankhongor',
    'Arvaikheer',
    'Sainshand',
    'Zuunmod',
    'Remote (Mongolia)',
  ];
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
    firstName: '',
    lastName: '',
    jobTitle: '',
  };

  async ngOnInit(): Promise<void> {
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
        firstName: c.firstName ?? '',
        lastName: c.lastName ?? '',
        jobTitle: c.jobTitle ?? '',
      };
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unable to load your company.');
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
        firstName: this.form.firstName,
        lastName: this.form.lastName,
        jobTitle: this.form.jobTitle,
      });
      this.company.set(updated);
      this.saved.set(true);
      this.toast.success('Company profile updated');
    } catch {
      this.toast.alert('Failed to update company profile');
    } finally {
      this.busy.set(false);
    }
  }
}
