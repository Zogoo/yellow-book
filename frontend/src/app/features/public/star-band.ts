import { Component } from '@angular/core';

@Component({
  selector: 'app-star-band',
  template: `
    <section class="-mx-4 bg-[#fcc207] px-4 py-10">
      <div class="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
        @for (stat of stats; track stat.label) {
          <div
            class="flex flex-col items-center gap-2 rounded-2xl bg-[#e5b106] px-4 py-6 text-center"
          >
            <img [src]="stat.icon" alt="" class="h-10 w-10" />
            <span class="text-2xl font-bold text-[#212121]">{{ stat.value }}</span>
            <span class="text-sm text-[#424242]">{{ stat.label }}</span>
          </div>
        }
      </div>
    </section>
  `,
})
export class StarBand {
  readonly stats = [
    { icon: '/Frame(7).svg', value: '1548', label: 'Verified agencies' },
    { icon: '/Frame(8).svg', value: '5000+', label: 'Users' },
    { icon: '/Frame(9).svg', value: '25k+', label: 'Reviews' },
    { icon: '/Frame(10).svg', value: '145+', label: 'Category' },
  ];
}
