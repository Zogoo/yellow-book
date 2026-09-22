import { Component, OnInit, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';

import { DirectoryService } from '../../core/services/directory.service';
import { LocaleService } from '../../core/services/locale.service';
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
  'Car',
  'Hammer',
  'Truck',
  'Scale',
  'DollarSign',
  'Building2',
  'ShoppingBag',
  'PartyPopper',
]);

/**
 * The category grid. `limit` caps it on the home page; the category index passes
 * nothing and gets every category with its listing count.
 */
@Component({
  selector: 'app-category-grid',
  imports: [LucideAngularModule, RouterLink, TranslatePipe],
  template: `
    <section>
      <div class="mb-6 flex items-end justify-between gap-4">
        <h2 class="text-2xl font-bold text-[#212121]">{{ heading() | translate }}</h2>
        @if (limit() && directory.categories().length > limit()) {
          <a routerLink="/catagory" class="text-sm font-semibold text-[#1877f2]">
            {{ 'home.viewAllCategories' | translate }} →
          </a>
        }
      </div>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        @for (category of visible(); track category.slug || category.name) {
          <button
            type="button"
            class="flex h-[150px] flex-col items-center justify-center gap-3 rounded-2xl border border-[#DCDCDC] bg-white transition hover:scale-[1.02] hover:border-[#fcc207] hover:shadow-lg md:h-[170px]"
            [attr.aria-label]="label(category)"
            (click)="open(category)"
          >
            <lucide-angular [name]="iconName(category.icon)" [size]="38" [class]="category.color" />
            <span class="px-2 text-center text-sm font-semibold text-[#212121]">{{
              label(category)
            }}</span>
            @if (category.companyCount !== undefined) {
              <span class="text-xs text-gray-500">
                {{ 'home.companiesCount' | translate: { count: category.companyCount } }}
              </span>
            }
          </button>
        }
      </div>
    </section>
  `,
})
export class CategoryGrid implements OnInit {
  readonly directory = inject(DirectoryService);
  private readonly locale = inject(LocaleService);
  private readonly router = inject(Router);
  readonly heading = input('home.categories');
  /** 0 means "all of them". */
  readonly limit = input(0);
  readonly visible = computed(() => {
    const all = this.directory.categories();
    return this.limit() ? all.slice(0, this.limit()) : all;
  });

  ngOnInit(): void {
    void this.directory.ensureHydrated();
  }

  label(category: CategoryDefinition): string {
    return this.locale.locale() === 'en'
      ? (category.name ?? category.nameMn ?? '')
      : (category.nameMn ?? category.name ?? '');
  }

  iconName(icon: string): string {
    return (ICONS.has(icon) ? icon : 'Building2').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  open(category: CategoryDefinition): void {
    void this.router.navigate(['/catagory'], { queryParams: { name: category.name } });
  }
}
