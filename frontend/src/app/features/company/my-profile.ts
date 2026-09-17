import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CompanyProfile } from '../../core/models';

/** `/company/my-profile` — owner-facing contact profile with avatar upload. */
@Component({
  selector: 'app-company-profile-page',
  imports: [FormsModule],
  template: `
    <header>
      <h1 class="text-2xl font-bold text-[#212121]">Welcome {{ form.fullName || 'there' }}</h1>
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
              <span class="text-xs text-gray-400">Click to upload</span>
            }
          </div>
          <span class="mt-2 block text-xs text-gray-500">{{
            form.avatar ? 'Click to change photo' : 'JPG, GIF or PNG. Max size 2MB.'
          }}</span>
          <span class="yb-btn mt-2 bg-blue-600 text-white">{{
            form.avatar ? 'Change Photo' : 'Upload New Photo'
          }}</span>
        </label>
      </div>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Full name</label
          ><input
            class="yb-input"
            name="fullName"
            placeholder="Tech Solutions Inc."
            [(ngModel)]="form.fullName"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Phone Number</label
          ><input
            class="yb-input"
            name="phoneNumber"
            placeholder="+1 (555) 123-4567"
            [(ngModel)]="form.phoneNumber"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Email</label
          ><input
            class="yb-input"
            type="email"
            name="email"
            placeholder="contact@techsolutions.com"
            [(ngModel)]="form.email"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Location</label
          ><input
            class="yb-input"
            name="location"
            placeholder="City, Country"
            [(ngModel)]="form.location"
          />
        </div>
        <div>
          <label class="text-sm font-medium">About yourself</label>
          <textarea
            class="yb-input"
            rows="3"
            name="about"
            maxlength="200"
            placeholder="Tell customers about yourself (max 24 words)"
            [(ngModel)]="form.about"
            (ngModelChange)="clampWords()"
          ></textarea>
          <p class="text-xs text-gray-400">
            {{ wordCount() }}/24 words · {{ form.about.length }}/200 characters
          </p>
        </div>
        @if (success()) {
          <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            Profile updated successfully!
          </p>
        }
        <button type="submit" class="yb-btn bg-emerald-600 text-white" [disabled]="busy()">
          {{ busy() ? 'Saving...' : 'Update Profile' }}
        </button>
      </div>
    </form>
  `,
})
export class CompanyProfilePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
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
      this.toast.alert('Unable to load profile');
    }
  }

  wordCount(): number {
    return this.form.about.trim() ? this.form.about.trim().split(/\s+/).length : 0;
  }

  clampWords(): void {
    const words = this.form.about.trim().split(/\s+/).filter(Boolean);
    if (words.length > 24) this.form.about = words.slice(0, 24).join(' ');
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
      this.toast.success('Profile updated successfully!');
      setTimeout(() => this.success.set(false), 3000);
    } catch {
      this.toast.alert('Error updating profile. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
