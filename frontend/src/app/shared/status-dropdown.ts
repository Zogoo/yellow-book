import { Component, computed, input, output } from '@angular/core';

import { getStatusClass } from '../core/utils/status-class';

/**
 * Native select styled by the current status colour. It is fully controlled:
 * a pick is emitted but never applied locally, so a parent that cancels or
 * fails the update keeps showing the real status.
 */
@Component({
  selector: 'app-status-dropdown',
  template: `
    <select
      #select
      class="rounded-full border-0 px-3 py-1 text-xs font-semibold"
      [class]="classes()"
      [value]="value()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.data-testid]="testId()"
      (change)="onChange(select)"
    >
      @for (option of allOptions(); track option) {
        <option [value]="option" [selected]="option === value()">{{ option }}</option>
      }
    </select>
  `,
})
export class StatusDropdown {
  readonly value = input<string>('');
  readonly options = input<string[]>([]);
  readonly variant = input<'badge' | 'soft'>('badge');
  readonly disabled = input(false);
  readonly ariaLabel = input('Status');
  readonly testId = input<string | null>(null);
  readonly changed = output<string>();
  readonly allOptions = computed(() => {
    const list = [...this.options()];
    const current = this.value();
    if (current && !list.includes(current)) list.unshift(current);
    return list;
  });
  readonly classes = computed(() => getStatusClass(this.value(), this.variant()));

  onChange(select: HTMLSelectElement): void {
    const next = select.value;
    // Snap back to the authoritative value; the parent re-renders with the new
    // one only once the change is actually accepted.
    select.value = this.value();
    this.changed.emit(next);
  }
}
