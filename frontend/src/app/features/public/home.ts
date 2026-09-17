import { Component } from '@angular/core';

import { CategoryGrid } from './category-grid';
import { FrequentFaq } from './frequent-faq';
import { PopularListings } from './popular-listings';
import { StarBand } from './star-band';

@Component({
  selector: 'app-home-page',
  imports: [CategoryGrid, PopularListings, StarBand, FrequentFaq],
  template: `
    <div class="flex flex-col gap-10 py-8">
      <app-category-grid />
      <app-popular-listings [limit]="8" />
      <app-star-band />
      <app-frequent-faq />
    </div>
  `,
})
export class HomePage {}
