import { Component, computed, input } from '@angular/core';

/** Initials avatar. We never show a stock portrait for a real person. */
@Component({
  selector: 'app-avatar',
  template: `
    <span
      class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.fontSize.px]="size() / 2.6"
      [style.background]="colour()"
      role="img"
      [attr.aria-label]="name() || 'Account'"
    >
      {{ initials() }}
    </span>
  `,
})
export class Avatar {
  readonly name = input<string | null | undefined>('');
  readonly size = input(40);
  readonly initials = computed(() => {
    const words = String(this.name() ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  });
  readonly colour = computed(() => {
    const palette = ['#0f766e', '#b45309', '#4338ca', '#9d174d', '#15803d', '#1d4ed8', '#7c2d12'];
    const name = String(this.name() ?? '');
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 9973;
    return palette[hash % palette.length];
  });
}
