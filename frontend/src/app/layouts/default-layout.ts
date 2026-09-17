import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Footer } from './footer';
import { Navbar } from './navbar';

@Component({
  selector: 'app-default-layout',
  imports: [RouterOutlet, Navbar, Footer],
  template: `
    <div class="flex min-h-screen flex-col bg-white text-gray-800">
      <app-navbar />
      <main class="container mx-auto flex-1 px-4"><router-outlet /></main>
      <app-footer />
    </div>
  `,
})
export class DefaultLayout {}
