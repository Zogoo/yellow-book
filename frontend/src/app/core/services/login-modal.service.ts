import { Injectable, signal } from '@angular/core';

export type LoginModalSource = 'navbar' | 'info-nav' | 'review' | 'favourite' | 'unknown';

export interface LoginModalOptions {
  /** A line explaining why sign-in is being asked for, shown above the form. */
  reason?: string;
  /** Where to go after signing in. Empty means: stay where you are. */
  redirectTo?: string;
}

/**
 * The global sign-in dialog. It carries the reason it was opened so the user is
 * never asked to sign in without being told what for.
 */
@Injectable({ providedIn: 'root' })
export class LoginModalService {
  readonly open = signal(false);
  readonly source = signal<LoginModalSource>('unknown');
  readonly reason = signal('');
  readonly redirectOnSuccess = signal('');

  openModal(source: LoginModalSource = 'unknown', options: LoginModalOptions = {}): void {
    this.source.set(source);
    this.reason.set(options.reason ?? '');
    this.redirectOnSuccess.set(options.redirectTo ?? '');
    this.open.set(true);
  }

  closeModal(): void {
    this.open.set(false);
    this.source.set('unknown');
    this.reason.set('');
    this.redirectOnSuccess.set('');
  }
}
