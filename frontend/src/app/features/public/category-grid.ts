import { Component, OnInit, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { DirectoryService } from '../../core/services/directory.service';
import { CategoryDefinition } from '../../core/models';

const ICONS = new Set([
  'PawPrint',
  'Sparkles',
  'Utensils',
  'Plane',
  'Laptop',
  'MoreHorizontal',
  'Home',
  'Megaphone',
  'GraduationCap',
  'Stethoscope',
]);

/** "Category's" card grid (max 8, "More" last). */
@Component({
  selector: 'app-category-grid',
  imports: [LucideAngularModule],
  template: `
    <section>
      <h2 class="mb-6 text-2xl font-bold text-[#212121]">{{ heading() }}</h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        @for (category of visible(); track category.name) {
          <button
            type="button"
            class="flex h-[150px] flex-col items-center justify-center gap-3 rounded-2xl border border-[#DCDCDC] bg-white transition hover:scale-[1.02] hover:border-[#fcc207] hover:shadow-lg md:h-[180px] lg:h-[200px]"
            [attr.aria-label]="category.name"
            (click)="open(category)"
          >
            <lucide-angular [name]="iconName(category.icon)" [size]="40" [class]="category.color" />
            <span class="px-2 text-center text-sm font-semibold text-[#212121]">{{
              category.name
            }}</span>
          </button>
        }
      </div>
    </section>
  `,
})
export class CategoryGrid implements OnInit {
  private readonly directory = inject(DirectoryService);
  private readonly router = inject(Router);
  readonly heading = input("Category's");
  readonly visible = computed(() => {
    const all = this.directory.categories();
    const more = all.find((c) => c.name.toLowerCase() === 'more');
    const primaries = all.filter((c) => c !== more);
    return more ? [...primaries.slice(0, 7), more] : primaries.slice(0, 8);
  });

  ngOnInit(): void {
    void this.directory.ensureHydrated();
  }

  iconName(icon: string): string {
    return (ICONS.has(icon) ? icon : 'MoreHorizontal')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  open(category: CategoryDefinition): void {
    if (category.name.toLowerCase() === 'more') {
      void this.router.navigateByUrl('/catagory');
      return;
    }
    void this.router.navigate(['/catagory'], { queryParams: { name: category.name } });
  }
}
