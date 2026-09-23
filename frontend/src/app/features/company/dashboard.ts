import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AgencyDashboard, ReviewRecord } from '../../core/models';
import { RatingStars } from '../../shared/rating-stars';

Chart.register(...registerables);

/** `/company/dashboard` — KPIs, monthly review trend and the latest reviews. */
@Component({
  selector: 'app-company-dashboard-page',
  imports: [RouterLink, RatingStars, TranslatePipe],
  template: `
    <header class="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-pink-500/10 p-6">
      <h1 class="text-2xl font-bold text-[#212121]">
        {{ 'company.welcome' | translate: { name: auth.user()?.name } }}
      </h1>
      <p class="text-sm text-gray-600">{{ 'company.howYouAreDoing' | translate }}</p>
    </header>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="yb-card p-5">
        <p class="text-sm text-gray-500">{{ 'company.totalReviews' | translate }}</p>
        <p class="text-3xl font-bold">{{ stats()?.totalReviews ?? 0 }}</p>
      </div>
      <div class="yb-card p-5">
        <p class="text-sm text-gray-500">{{ 'company.averageRating' | translate }}</p>
        <p class="text-3xl font-bold">{{ (stats()?.averageRating ?? 0).toFixed(1) }}</p>
      </div>
      <div class="yb-card p-5">
        <p class="text-sm text-gray-500">{{ 'company.verification' | translate }}</p>
        <p class="text-lg font-semibold">{{ verificationLabel() | translate }}</p>
      </div>
      <div class="yb-card p-5">
        <p class="text-sm text-gray-500">{{ 'company.profile' | translate }}</p>
        <p class="text-lg font-semibold">
          {{ (stats()?.profileComplete ? 'company.complete' : 'company.incomplete') | translate }}
        </p>
      </div>
    </div>
    <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section class="yb-card p-5">
        <h2 class="mb-3 text-lg font-semibold">{{ 'company.reviewTrend' | translate }}</h2>
        <canvas #chart height="120" [attr.aria-label]="'company.monthlyTrend' | translate"></canvas>
      </section>
      <section class="yb-card p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold">{{ 'company.recentReviews' | translate }}</h2>
          <a routerLink="/company/review" class="text-sm text-[#1877f2]">{{
            'company.viewAll' | translate
          }}</a>
        </div>
        @if (recent().length === 0) {
          <p class="text-sm text-gray-500">{{ 'company.noReviewsYet' | translate }}</p>
        }
        <ul class="space-y-3">
          @for (r of recent(); track r.id) {
            <li class="border-b border-gray-100 pb-2 last:border-0">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold">{{ r.reviewerName }}</span
                ><app-rating-stars [rating]="r.rating" size="xs" />
              </div>
              <p class="line-clamp-2 text-xs text-gray-600">{{ r.content }}</p>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class CompanyDashboardPage implements OnInit, AfterViewInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly stats = signal<AgencyDashboard | null>(null);
  /** The API sends the raw status; the panel shows it in the caller's language. */
  readonly verificationLabel = computed(() => {
    const status = String(this.stats()?.verificationStatus ?? '').toLowerCase();
    const known = ['pending', 'approved', 'rejected', 'suspended'];
    return `company.status.${known.includes(status) ? status : 'unknown'}`;
  });
  readonly recent = signal<ReviewRecord[]>([]);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('chart');
  private chart: Chart | null = null;

  async ngOnInit(): Promise<void> {
    const [stats, reviews] = await Promise.all([
      this.api
        .getData<AgencyDashboard>('agency/dashboard', undefined, { toast: { showError: false } })
        .catch(() => null),
      this.api
        .list<ReviewRecord>('agency/reviews', { limit: 5 }, { toast: { showError: false } })
        .catch(() => null),
    ]);
    this.stats.set(stats);
    this.recent.set(reviews?.items ?? []);
    this.renderChart();
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  private renderChart(): void {
    const el = this.canvas()?.nativeElement;
    const trend = this.stats()?.monthlyReviewTrend ?? [];
    if (!el || !trend.length) return;
    this.chart?.destroy();
    this.chart = new Chart(el, {
      type: 'line',
      data: {
        labels: trend.map((t) => t.month),
        datasets: [
          {
            label: 'Reviews',
            data: trend.map((t) => t.count),
            borderColor: '#fcc207',
            backgroundColor: 'rgba(252,194,7,0.2)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }
}
