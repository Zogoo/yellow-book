import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificationRecord } from '../../core/models';

/** `/company/notification` — list, mark all read, clear all. */
@Component({
  selector: 'app-company-notification-page',
  imports: [TranslatePipe],
  template: `
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[#212121]">{{ 'company.notifications' | translate }}</h1>
        <p class="text-sm text-gray-500">{{ unreadCount() }} unread · {{ items().length }} total</p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="yb-btn yb-btn-outline"
          data-testid="company-mark-notifications-read"
          [disabled]="unreadCount() === 0 || busy()"
          (click)="markAllRead()"
        >
          {{ 'company.markAllRead' | translate }}
        </button>
        <button
          type="button"
          class="yb-btn bg-red-50 text-red-700"
          data-testid="company-clear-notifications"
          [disabled]="items().length === 0 || busy()"
          (click)="clearAll()"
        >
          {{ 'company.clearAll' | translate }}
        </button>
      </div>
    </header>
    @if (loading()) {
      <p class="text-gray-500">{{ 'common.loading' | translate }}</p>
    } @else if (items().length === 0) {
      <div class="yb-card p-10 text-center">
        <h2 class="text-lg font-semibold">{{ 'company.noNotifications' | translate }}</h2>
        <p class="text-sm text-gray-500">{{ 'company.allCaughtUp' | translate }}</p>
      </div>
    } @else {
      <ul class="yb-card divide-y divide-gray-100" data-testid="company-notification-list">
        @for (n of items(); track n.id) {
          <li class="flex items-start gap-3 p-4" data-testid="company-notification-item">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-full text-lg"
              [class]="(n.bgColor || 'bg-gray-100') + ' ' + (n.iconColor || 'text-gray-600')"
              >{{ iconFor(n.icon) }}</span
            >
            <div class="flex-1">
              <p class="font-semibold text-[#212121]">{{ n.title }}</p>
              <p class="line-clamp-2 text-sm text-gray-600">{{ n.message }}</p>
              <p class="text-xs text-gray-400">{{ n.timeLabel || n.time }}</p>
            </div>
            @if (n.unread) {
              <span
                class="mt-2 h-2 w-2 rounded-full bg-blue-500"
                [attr.aria-label]="'notifications.unread' | translate"
              ></span>
            }
          </li>
        }
      </ul>
    }
  `,
})
export class CompanyNotificationPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly items = signal<NotificationRecord[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly unreadCount = computed(() => this.items().filter((n) => n.unread).length);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.api.list<NotificationRecord>(
        'agency/notifications',
        { limit: 100 },
        { toast: { showError: false } },
      );
      this.items.set(result.items);
    } catch {
      this.toast.alert('Failed to load notifications');
    } finally {
      this.loading.set(false);
    }
  }

  iconFor(icon: string | null | undefined): string {
    const map: Record<string, string> = {
      Star: '⭐',
      Bell: '🔔',
      CheckCircle: '✅',
      BadgeCheck: '✔',
      Building2: '🏢',
      Megaphone: '📣',
      MessageCircle: '💬',
      DollarSign: '💲',
    };
    return map[icon ?? ''] ?? '💬';
  }

  async markAllRead(): Promise<void> {
    this.busy.set(true);
    try {
      for (const n of this.items().filter((i) => i.unread)) {
        await this.api.putData(
          `agency/notifications/${n.id}`,
          { unread: false },
          { toast: { showError: false } },
        );
      }
      this.items.update((list) => list.map((n) => ({ ...n, unread: false })));
    } catch {
      this.toast.alert('Unable to mark notifications as read');
    } finally {
      this.busy.set(false);
    }
  }

  async clearAll(): Promise<void> {
    if (!window.confirm('Clear all notifications?')) return;
    this.busy.set(true);
    try {
      for (const n of this.items()) {
        await this.api.deleteData(`agency/notifications/${n.id}`, { toast: { showError: false } });
      }
      this.items.set([]);
    } catch {
      this.toast.alert('Unable to clear notifications');
      await this.load();
    } finally {
      this.busy.set(false);
    }
  }
}
