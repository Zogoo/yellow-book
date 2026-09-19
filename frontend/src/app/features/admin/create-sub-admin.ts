import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { titleCase } from '../../core/utils/status-class';

const PERMISSIONS = [
  { key: 'users_read', label: 'View Users', hint: 'Can view user list' },
  { key: 'users_write', label: 'Manage Users', hint: 'Can create/edit users' },
  { key: 'companies_read', label: 'View Companies', hint: 'Can view company records' },
  {
    key: 'companies_write',
    label: 'Manage Companies',
    hint: 'Can approve/reject/update companies',
  },
  { key: 'categories_read', label: 'View Categories', hint: 'Can view category list' },
  { key: 'categories_write', label: 'Manage Categories', hint: 'Can create/edit categories' },
  {
    key: 'specializations_read',
    label: 'View Specializations',
    hint: 'Can view service specializations',
  },
  {
    key: 'specializations_write',
    label: 'Manage Specializations',
    hint: 'Can create/edit specializations',
  },
  { key: 'reviews_read', label: 'View Reviews', hint: 'Can access review queues' },
  {
    key: 'reviews_moderate',
    label: 'Moderate Reviews',
    hint: 'Can approve/reject/hold/ban reviews',
  },
  { key: 'admins_read', label: 'View Admins', hint: 'Can view admin and agent accounts' },
  { key: 'agents_write', label: 'Manage Agents', hint: 'Can create/edit agent accounts' },
  { key: 'settings_read', label: 'View Settings', hint: 'Can view system settings' },
  { key: 'settings_write', label: 'Manage Settings', hint: 'Can modify system settings' },
];

/** `/admin/create-sub-admin` — two-step wizard. */
@Component({
  selector: 'app-create-sub-admin-page',
  imports: [FormsModule, RouterLink],
  template: `
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[#212121]">Create Sub-Admin</h1>
        <p class="text-sm text-gray-500">
          Fill out the form below to create a New Sub-Admin profile in the system.
        </p>
      </div>
      <a routerLink="/admin/admin-management" class="yb-btn yb-btn-outline">Back to List</a>
    </header>
    <div class="yb-card p-6">
      <div class="h-2 rounded-full bg-gray-100">
        <div
          class="h-2 rounded-full bg-[#fcc207] transition-all"
          [style.width.%]="step() * 50"
        ></div>
      </div>
      <p class="mt-1 text-xs text-gray-500">
        Step {{ step() }} of 2 · {{ step() === 1 ? 'Basic Info' : 'Account Security' }}
      </p>
      <form class="mt-6 space-y-4" (ngSubmit)="step() === 1 ? next() : submit()" novalidate>
        @if (step() === 1) {
          <div>
            <label class="text-sm font-medium">Full Name *</label
            ><input
              class="yb-input"
              name="name"
              placeholder="Enter Full Name"
              [(ngModel)]="form.name"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Email Address *</label
            ><input
              class="yb-input"
              type="email"
              name="email"
              placeholder="Enter email address"
              [(ngModel)]="form.email"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Phone Number (optional)</label
            ><input
              class="yb-input"
              name="phone"
              placeholder="+976 8811 2233"
              [(ngModel)]="form.phone"
            />
          </div>
          @if (error()) {
            <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
          }
          <div class="flex justify-end gap-2">
            <a routerLink="/admin/admin-management" class="yb-btn yb-btn-outline">Cancel</a>
            <button type="submit" class="yb-btn yb-btn-gold">Continue to Security</button>
          </div>
        } @else {
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Password *</label>
              <div class="relative">
                <input
                  class="yb-input pr-14"
                  [type]="showPw() ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="form.password"
                /><button
                  type="button"
                  class="absolute top-1/2 right-3 -translate-y-1/2 text-xs"
                  (click)="showPw.set(!showPw())"
                >
                  {{ showPw() ? 'Hide' : 'Show' }}
                </button>
              </div>
              <p class="text-xs text-gray-400">
                Minimum 12 characters with upper/lower case, a number and a symbol
              </p>
            </div>
            <div>
              <label class="text-sm font-medium">Confirm Password *</label
              ><input
                class="yb-input"
                id="subadmin-confirm"
                type="password"
                name="confirm"
                aria-label="Confirm password"
                [(ngModel)]="form.confirm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Role *</label
              ><select class="yb-input" name="role" [(ngModel)]="form.role">
                <option value="">Select Role</option>
                @for (r of ['agent', 'moderator', 'support', 'viewer']; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Status *</label
              ><select class="yb-input" name="status" [(ngModel)]="form.status">
                <option value="">Select Status</option>
                @for (s of ['active', 'inactive', 'suspended']; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
            </div>
          </div>
          <fieldset>
            <legend class="text-sm font-medium">Permissions</legend>
            <div class="mt-2 grid gap-2 sm:grid-cols-2">
              @for (p of permissions; track p.key) {
                <label class="flex items-start gap-2 rounded-lg border border-gray-100 p-3 text-sm">
                  <input
                    type="checkbox"
                    [checked]="form.permissions.has(p.key)"
                    (change)="togglePermission(p.key)"
                  />
                  <span
                    ><span class="block font-medium">{{ p.label }}</span
                    ><span class="text-xs text-gray-500">{{ p.hint }}</span></span
                  >
                </label>
              }
            </div>
          </fieldset>
          @if (error()) {
            <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
          }
          @if (success()) {
            <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
              Sub-admin created successfully!
            </p>
          }
          <div class="flex flex-wrap justify-between gap-2">
            <button type="button" class="yb-btn yb-btn-outline" (click)="step.set(1)">
              Back to Basic Info
            </button>
            <div class="flex gap-2">
              <a routerLink="/admin/admin-management" class="yb-btn yb-btn-outline">Cancel</a>
              <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">
                {{ busy() ? 'Submitting...' : 'Create Sub-Admin' }}
              </button>
            </div>
          </div>
        }
      </form>
    </div>
  `,
})
export class CreateSubAdminPage {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly step = signal(1);
  readonly busy = signal(false);
  readonly showPw = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly permissions = PERMISSIONS;
  form = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    role: '',
    status: '',
    permissions: new Set<string>(),
  };

  next(): void {
    this.error.set(null);
    if (!this.form.name.trim()) return this.error.set('Full name is required');
    if (!this.form.email.trim()) return this.error.set('Email address is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim()))
      return this.error.set('Please enter a valid email address');
    this.step.set(2);
  }

  togglePermission(key: string): void {
    if (this.form.permissions.has(key)) this.form.permissions.delete(key);
    else this.form.permissions.add(key);
  }

  async submit(): Promise<void> {
    this.error.set(null);
    if (!this.form.password) return this.error.set('Password is required');
    if (this.form.password.length < 6)
      return this.error.set('Password must be at least 6 characters long');
    if (this.form.password !== this.form.confirm) return this.error.set('Passwords do not match');
    if (!this.form.role) return this.error.set('Role is required');
    if (!this.form.status) return this.error.set('Status is required');
    this.busy.set(true);
    try {
      await this.api.postData(
        'admins',
        {
          name: this.form.name.trim(),
          email: this.form.email.trim(),
          phone: this.form.phone,
          role: titleCase(this.form.role || 'Agent'),
          status: titleCase(this.form.status || 'Active'),
          verified: true,
          permissions: [...this.form.permissions],
          password: this.form.password,
          createdOn: new Date().toISOString(),
          lastLogin: null,
        },
        { toast: { showError: false } },
      );
      this.success.set(true);
      this.toast.success('Sub-admin created successfully!');
      setTimeout(() => void this.router.navigateByUrl('/admin/admin-management'), 2000);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'An error occurred. Please try again.');
      this.toast.alert('An error occurred. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
