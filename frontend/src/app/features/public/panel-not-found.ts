import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-panel-not-found-page',
  template: `
    <section class="yb-card p-10 text-center">
      <h1 class="text-2xl font-bold text-[#212121]">Page not found</h1>
      <p class="mt-2 text-gray-500">No matching {{ panel }} component for this route.</p>
    </section>
  `,
})
export class PanelNotFoundPage {
  readonly panel = String(inject(ActivatedRoute).snapshot.data['panel'] ?? 'panel');
}
