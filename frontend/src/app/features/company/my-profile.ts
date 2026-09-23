import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CompanyProfile } from '../../core/models';

/** `/company/my-profile` — owner-facing contact profile with avatar upload. */
@Component({
  selector: 'app-company-profile-page',
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <header>
      <h1 class="text-2xl font-bold text-[#212121]">{{ 'company.contactDetails' | translate }}</h1>
      <p class="text-sm text-gray-500">
        {{ 'company.contactLead' | translate }}
        <a routerLink="/company/my-company" class="text-[#1877f2]">
          {{ 'company.myCompany' | translate }}
        </a>
      </p>
    </header>
    <form class="yb-card grid gap-6 p-6 md:grid-cols-[220px_1fr]" (ngSubmit)="save()" novalidate>
      <div class="text-center">
        <label class="block cursor-pointer">
          <input
            type="file"
            class="hidden"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            (change)="onFile($event)"
          />
          <div
            class="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50"
          >
            @if (form.avatar) {
              <img [src]="form.avatar" alt="Avatar" class="h-full w-full object-cover" />
            } @else {
              <span class="text-xs text-gray-400">{{ 'common.noPhoto' | translate }}</span>
            }
          </div>
          <span class="mt-2 block text-xs text-gray-500">{{
            'company.photoHint' | translate
          }}</span>
          <span class="yb-btn mt-2 bg-blue-600 text-white">{{
            (form.avatar ? 'company.changePhoto' : 'company.uploadPhoto') | translate
          }}</span>
        </label>
      </div>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium" for="cp-full-name">{{
            'company.fullName' | translate
          }}</label
          ><input
            class="yb-input"
            id="cp-full-name"
            name="fullName"
            [attr.placeholder]="'company.fullNamePlaceholder' | translate"
            [(ngModel)]="form.fullName"
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="cp-phone">{{ 'common.phone' | translate }}</label
          ><input
            class="yb-input"
            id="cp-phone"
            name="phoneNumber"
            placeholder="88112233"
            [(ngModel)]="form.phoneNumber"
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="cp-email">{{ 'common.email' | translate }}</label
          ><input
            class="yb-input"
            id="cp-email"
            type="email"
            name="email"
            placeholder="you@company.mn"
            [(ngModel)]="form.email"
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="cp-location">{{
            'common.location' | translate
          }}</label
          ><input
            class="yb-input"
            id="cp-location"
            name="location"
            placeholder="Улаанбаатар"
            [(ngModel)]="form.location"
          />
        </div>
        <div>
          <label class="text-sm font-medium" for="cp-about">{{
            'company.aboutYou' | translate
          }}</label>
          <textarea
            class="yb-input"
            id="cp-about"
            rows="3"
            name="about"
            maxlength="200"
            [attr.placeholder]="'company.aboutYouPlaceholder' | translate"
            [(ngModel)]="form.about"
          ></textarea>
          <p class="text-xs text-gray-400">{{ form.about.length }}/200 characters</p>
        </div>
        @if (success()) {
          <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {{ 'company.profileUpdated' | translate }}
          </p>
        }
        <button type="submit" class="yb-btn bg-emerald-600 text-white" [disabled]="busy()">
          {{ busy() ? ('common.pleaseWait' | translate) : ('common.saveChanges' | translate) }}
        </button>
      </div>
    </form>
  `,
})
export class CompanyProfilePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  readonly busy = signal(false);
  readonly success = signal(false);
  form = { fullName: '', phoneNumber: '', email: '', location: '', about: '', avatar: '' };

  async ngOnInit(): Promise<void> {
    try {
      const p = await this.api.getData<CompanyProfile>('company/profile');
      this.form = {
        fullName: p.fullName ?? '',
        phoneNumber: p.phoneNumber ?? '',
        email: p.email ?? '',
        location: p.location ?? '',
        about: p.about ?? '',
        avatar: p.avatar ?? '',
      };
    } catch {
      this.toast.alert(this.translate.instant('company.loadFailed'));
    }
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      this.toast.alert('Please upload a valid image file (JPG, PNG, GIF).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toast.alert('File size must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => (this.form.avatar = String(reader.result));
    reader.readAsDataURL(file);
  }

  async save(): Promise<void> {
    this.busy.set(true);
    this.success.set(false);
    try {
      await this.api.putData('company/profile', {
        ...this.form,
        updatedAt: new Date().toISOString(),
      });
      this.success.set(true);
      this.toast.success(this.translate.instant('company.profileUpdated'));
      setTimeout(() => this.success.set(false), 3000);
    } catch {
      this.toast.alert(this.translate.instant('company.saveFailed'));
    } finally {
      this.busy.set(false);
    }
  }
}
