import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { faBoltLightning } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Dialog } from 'primeng/dialog';
import { Tooltip } from 'primeng/tooltip';
import { InputText } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-load-bit-set-dialog',
  templateUrl: './load-bit-set-dialog.component.html',
  imports: [FaIconComponent, Dialog, Tooltip, InputText, FormsModule, Button],
})
export class LoadBitSetDialogComponent {
  readonly bitSetChange = output<bigint>();
  readonly min = input(BigInt(0));
  readonly max = input(BigInt(0));
  readonly visible = model<boolean>(false);

  readonly bitSetInstantUpdate = signal(false);
  readonly bitSetInput = signal<string | undefined>(undefined);

  readonly bitSet = computed(() => {
    const bitSetInput = this.bitSetInput();

    if (bitSetInput === undefined) {
      return undefined;
    }

    try {
      return BigInt(bitSetInput);
    } catch {
      return undefined;
    }
  });

  readonly bitSetValid = computed(() => {
    const bitSet = this.bitSet();

    if (bitSet === undefined) {
      return false;
    }

    return bitSet >= this.min() && bitSet < this.max();
  });

  readonly icons = {
    faBoltLightning,
  };

  constructor(private analyticsService: AnalyticsService) {
    effect(() => {
      if (this.bitSetInstantUpdate() && this.bitSetValid()) {
        this.bitSetChange.emit(this.bitSet()!);
      }
    });
  }

  loadKey() {
    if (!this.bitSetValid()) {
      return;
    }

    this.bitSetChange.emit(this.bitSet()!);
    this.visible.set(false);
    this.analyticsService.trackEvent('bitset_load');
  }
}
