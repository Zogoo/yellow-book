import { Component, OnInit, inject } from '@angular/core';

import { ApiConnectionService } from '../core/services/api-connection.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-api-connection-badge',
  template: `
    @if (show) {
      <div
        class="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-sm"
        [class.border-emerald-200]="conn.status() === 'connected'"
        [class.bg-emerald-50]="conn.status() === 'connected'"
        [class.text-emerald-700]="conn.status() === 'connected'"
        [class.border-slate-200]="conn.status() === 'checking'"
        [class.bg-slate-50]="conn.status() === 'checking'"
        [class.text-slate-600]="conn.status() === 'checking'"
        [class.border-rose-200]="conn.status() === 'error'"
        [class.bg-rose-50]="conn.status() === 'error'"
        [class.text-rose-700]="conn.status() === 'error'"
        [attr.title]="
          conn.lastError() ? conn.message() + ' (' + conn.lastError() + ')' : conn.message()
        "
      >
        <span
          class="h-2 w-2 rounded-full"
          [class.bg-emerald-500]="conn.status() === 'connected'"
          [class.bg-slate-400]="conn.status() === 'checking'"
          [class.animate-pulse]="conn.status() === 'checking'"
          [class.bg-rose-500]="conn.status() === 'error'"
        ></span>
        <span>{{ conn.message() }}</span>
        @if (conn.status() === 'error') {
          <button type="button" class="font-semibold underline" (click)="conn.probe()">
            Retry
          </button>
        }
      </div>
    }
  `,
})
export class ApiConnectionBadge implements OnInit {
  readonly conn = inject(ApiConnectionService);
  /** A connection badge is a development aid, not something customers should see. */
  readonly show = !environment.production;

  ngOnInit(): void {
    if (this.show) void this.conn.probe();
  }
}
