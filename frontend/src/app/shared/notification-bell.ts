import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ApiService } from '../core/services/api.service';
import { NotificationRecord } from '../core/models';

/** The header bell: a real inbox, with a real unread count. */
@Component({
  selector: 'app-notification-bell',
  imports: [TranslatePipe],
  template: `
    <div class="relative">
      <button
        type="button"
        class="relative rounded-full p-2 text-gray-500 hover:bg-gray-100"
        [attr.aria-label]="'notifications.title' | translate"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        (click)="toggle()"
      >
        <span aria-hidden="true">🔔</span>
        @if (unread() > 0) {
          <span
            class="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
            >{{ unread() > 9 ? '9+' : unread() }}</span
          >
          <span class="sr-only">{{ 'notifications.unread' | translate: { count: unread() } }}</span>
        }
      </button>

      @if (open()) {
        <div
          class="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-gray-100 bg-white shadow-lg"
          role="menu"
        >
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-gray-900">
              {{ 'notifications.title' | translate }}
            </h2>
            @if (unread() > 0) {
              <button type="button" class="text-xs text-[#1877f2]" (click)="markAllRead()">
                {{ 'notifications.markAllRead' | translate }}
              </button>
            }
          </div>
          @if (loading()) {
            <p class="px-4 py-6 text-sm text-gray-500">{{ 'common.loading' | translate }}</p>
          } @else if (items().length === 0) {
            <p class="px-4 py-6 text-sm text-gray-500">{{ 'notifications.empty' | translate }}</p>
          } @else {
            <ul class="max-h-80 divide-y divide-gray-100 overflow-y-auto">
              @for (item of items(); track item.id) {
                <li>
                  <button
                    type="button"
                    class="flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    role="menuitem"
                    (click)="openItem(item)"
                  >
                    <span class="mt-0.5 text-lg" aria-hidden="true">{{ icon(item.icon) }}</span>
                    <span class="flex-1">
                      <span class="block text-sm font-medium text-gray-900">{{ item.title }}</span>
                      <span class="line-clamp-2 block text-xs text-gray-600">{{
                        item.message
                      }}</span>
                    </span>
                    @if (item.unread) {
                      <span
                        class="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                        [attr.aria-label]="'notifications.unread' | translate"
                      ></span>
                    }
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationBell implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly items = signal<NotificationRecord[]>([]);
  readonly unread = computed(() => this.items().filter((n) => n.unread).length);

  ngOnInit(): void {
    void this.load();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.api.list<NotificationRecord>(
        'notifications',
        { limit: 20 },
        { toast: { showError: false } },
      );
      this.items.set(result.items);
    } catch {
      this.items.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  toggle(): void {
    this.open.set(!this.open());
    if (this.open()) void this.load();
  }

  icon(name: string | null | undefined): string {
    const map: Record<string, string> = {
      Star: '⭐',
      Bell: '🔔',
      CheckCircle: '✅',
      XCircle: '⛔',
      BadgeCheck: '✔',
      Building2: '🏢',
      Megaphone: '📣',
      MessageCircle: '💬',
      MessageSquare: '💬',
    };
    return map[name ?? ''] ?? '🔔';
  }

  async openItem(item: NotificationRecord): Promise<void> {
    if (item.unread) {
      try {
        await this.api.patchData(
          `notifications/${item.id}/read`,
          {},
          { toast: { showError: false } },
        );
        this.items.update((list) =>
          list.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
        );
      } catch {
        // A failed read receipt must not block opening the item.
      }
    }
    this.open.set(false);
  }

  async markAllRead(): Promise<void> {
    const unread = this.items().filter((n) => n.unread);
    this.items.update((list) => list.map((n) => ({ ...n, unread: false })));
    for (const item of unread) {
      try {
        await this.api.patchData(
          `notifications/${item.id}/read`,
          {},
          { toast: { showError: false } },
        );
      } catch {
        await this.load();
        return;
      }
    }
  }
}
