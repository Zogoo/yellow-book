import { Injectable, signal } from '@angular/core';

export type LoginModalSource = 'navbar' | 'info-nav' | 'unknown';

/** Global "Choose your role" login modal state (mounted once in the app shell). */
@Injectable({ providedIn: 'root' })
export class LoginModalService {
  readonly open = signal(false);
  readonly source = signal<LoginModalSource>('unknown');

  openModal(source: LoginModalSource = 'unknown'): void {
    this.source.set(source);
    this.open.set(true);
  }

  closeModal(): void {
    this.open.set(false);
    this.source.set('unknown');
  }
}
