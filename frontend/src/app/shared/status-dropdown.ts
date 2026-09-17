import { Component, computed, input, model, output } from '@angular/core';

import { getStatusClass } from '../core/utils/status-class';

/** Native select styled by the current status colour. */
@Component({
  selector: 'app-status-dropdown',
  template: `
    <select
      class="rounded-full border-0 px-3 py-1 text-xs font-semibold"
      [class]="classes()"
      [value]="value()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.data-testid]="testId()"
      (change)="onChange($event)"
    >
      @for (option of allOptions(); track option) {
        <option [value]="option" [selected]="option === value()">{{ option }}</option>
      }
    </select>
  `,
})
export class StatusDropdown {
  readonly value = model<string>('');
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

  onChange(event: Event): void {
    const next = (event.target as HTMLSelectElement).value;
    this.value.set(next);
    this.changed.emit(next);
  }
}
