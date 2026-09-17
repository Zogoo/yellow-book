import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { resolvePostLoginRedirect } from '../../core/utils/role-access';

interface RegistrationOptions {
  categories: string[];
  services: string[];
  destinations: string[];
}

/** `/auth/register` — three-step business registration. */
@Component({
  selector: 'app-register-page',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="mx-auto max-w-2xl py-10">
      <div class="yb-card p-8">
        <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
          Business registration
        </p>
        <h1 class="mt-2 text-2xl font-bold text-[#212121]">List your agency on Yellow Book</h1>
        <p class="mt-1 text-sm text-gray-600">
          Create a company account in three quick steps. You can complete the profile later.
        </p>
        <div class="mt-6 h-2 rounded-full bg-gray-100">
          <div
            class="h-2 rounded-full bg-[#fcc207] transition-all"
            [style.width.%]="(step() / 3) * 100"
          ></div>
        </div>
        <p class="mt-1 text-xs text-gray-500">Step {{ step() }} of 3</p>

        <form class="mt-6 space-y-4" (ngSubmit)="next()" novalidate>
          @if (step() === 1) {
            <div>
              <label class="text-sm font-medium">Company Name *</label
              ><input
                class="yb-input"
                name="companyName"
                placeholder="e.g., Yellow.Book Travel Agency"
                [(ngModel)]="form.companyName"
                required
              />
            </div>
            <div>
              <label class="text-sm font-medium">Website</label
              ><input
                class="yb-input"
                name="website"
                placeholder="https://www.yourcompany.com"
                [(ngModel)]="form.website"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Category</label>
              <select class="yb-input" name="category" [(ngModel)]="form.category">
                <option value="">Select Category</option>
                @for (c of options().categories; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Service</label>
              <select class="yb-input" name="service" [(ngModel)]="form.service">
                <option value="">Select Service</option>
                @for (s of options().services; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Destination</label>
              <select class="yb-input" name="destination" [(ngModel)]="form.destination">
                <option value="">Select Destination</option>
                @for (d of options().destinations; track d) {
                  <option [value]="d">{{ d }}</option>
                }
              </select>
            </div>
          } @else if (step() === 2) {
            <div>
              <label class="text-sm font-medium">Number of Employees</label>
              <select class="yb-input" name="employees" [(ngModel)]="form.employees">
                <option value="">Select</option>
                @for (e of employeeOptions; track e) {
                  <option [value]="e">{{ e }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Annual Revenue</label>
              <select class="yb-input" name="revenue" [(ngModel)]="form.revenue">
                <option value="">Select</option>
                @for (r of revenueOptions; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Company Description</label
              ><textarea
                class="yb-input"
                rows="4"
                name="description"
                placeholder="Brief description of the company..."
                [(ngModel)]="form.description"
              ></textarea>
            </div>
          } @else {
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="text-sm font-medium">First Name *</label
                ><input
                  class="yb-input"
                  name="firstName"
                  placeholder="John"
                  [(ngModel)]="form.firstName"
                  required
                />
              </div>
              <div>
                <label class="text-sm font-medium">Last Name *</label
                ><input
                  class="yb-input"
                  name="lastName"
                  placeholder="Doe"
                  [(ngModel)]="form.lastName"
                  required
                />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium">Job Title</label
              ><input
                class="yb-input"
                name="jobTitle"
                placeholder="e.g., CEO, Travel Agent"
                [(ngModel)]="form.jobTitle"
              />
            </div>
            <div class="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                <label class="text-sm font-medium">Country</label>
                <select class="yb-input" name="country" [(ngModel)]="form.countryCode">
                  @for (c of countries; track c.code) {
                    <option [value]="c.code">{{ c.flag }} {{ c.code }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-sm font-medium">Phone Number</label
                ><input
                  class="yb-input"
                  name="phone"
                  placeholder="88112233"
                  [(ngModel)]="form.phone"
                />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium">Work Email *</label
              ><input
                class="yb-input"
                type="email"
                name="email"
                placeholder="you@company.com"
                [(ngModel)]="form.email"
                required
              />
            </div>
            <div>
              <label class="text-sm font-medium">Password *</label
              ><input
                class="yb-input"
                type="password"
                name="password"
                placeholder="At least 12 characters with a symbol"
                [(ngModel)]="form.password"
                required
              />
            </div>
            <p class="text-xs text-gray-500">
              Use at least 12 characters, including upper and lower case letters, a number and a
              symbol.
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
              Previous
            </button>
            <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">
              {{ step() === 3 ? (busy() ? 'Submitting...' : 'Submit') : 'Next' }}
            </button>
          </div>
        </form>
        <div class="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-600">
          <p>
            Already registered?
            <a routerLink="/auth/company/login" class="text-[#1877f2]">Company sign in</a>
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            @for (p of ['google', 'facebook', 'apple']; track p) {
              <button
                type="button"
                class="yb-btn border border-gray-200 bg-white text-xs capitalize"
                (click)="social(p)"
              >
                Sign up with {{ p }}
              </button>
            }
          </div>
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
  readonly employeeOptions = ['1–10', '11–30', '31–50'];
  readonly revenueOptions = ['< 10M MNT', '10M - 50M MNT', '> 50M MNT'];
  readonly countries = [
    { code: '+976', flag: '🇲🇳', name: 'Mongolia' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
    { code: '+7', flag: '🇷🇺', name: 'Russia' },
  ];
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

  async social(provider: string): Promise<void> {
    try {
      await this.auth.startOauthLogin(provider, { intent: 'register', next: '/company/dashboard' });
    } catch {
      this.toast.alert('Unable to continue with social signup');
    }
  }
}
