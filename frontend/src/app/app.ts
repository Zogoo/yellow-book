import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DirectoryService } from './core/services/directory.service';
import { ApiConnectionBadge } from './shared/api-connection-badge';
import { LoginModal } from './shared/login-modal';
import { ToastContainer } from './shared/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginModal, ToastContainer, ApiConnectionBadge],
  template: `
    <router-outlet />
    <app-login-modal />
    <app-toast-container />
    <app-api-connection-badge />
  `,
})
export class App implements OnInit {
  private readonly directory = inject(DirectoryService);

  ngOnInit(): void {
    void this.directory.ensureHydrated();
  }
}
