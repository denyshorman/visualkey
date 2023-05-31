import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { faBoltLightning } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-load-bit-set-modal',
  templateUrl: './load-bit-set-dialog.component.html',
  styleUrls: ['./load-bit-set-dialog.component.scss'],
})
export class LoadBitSetDialogComponent {
  @Output() bitSetChange = new EventEmitter<bigint>();
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() min = BigInt(0);
  @Input() max = BigInt(0);
  @Input() gaLabel?: string;
  valid = false;
  instantBitSetChange = false;

  breakpoints = {
    '1360px': '70vw',
    '1280px': '75vw',
    '1024px': '80vw',
    '640px': '95vw',
  };

  icons = {
    faBoltLightning,
  };

  constructor(private gaService: GoogleAnalyticsService) {}

  private _visible = false;

  @Input()
  get visible(): boolean {
    return this._visible;
  }

  set visible(visible: boolean) {
    if (this._visible != visible) {
      this._visible = visible;
      this.visibleChange.emit(visible);

      if (!visible) {
        this.bitSetString = undefined;
        this.valid = false;
      }
    }
  }

  private _bitSetString?: string;

  get bitSetString(): string | undefined {
    return this._bitSetString;
  }

  set bitSetString(bitSetStr: string | undefined) {
    this._bitSetString = bitSetStr;

    if (bitSetStr) {
      try {
        const num = BigInt(bitSetStr);
        this.valid = num >= this.min && num < this.max;

        if (this.instantBitSetChange && this.valid) {
          this.bitSetChange.emit(num);
        }
      } catch (e) {
        this.valid = false;
      }
    }
  }

  loadKey() {
    if (!this.valid) return;
    const bitSet = BigInt(this.bitSetString!);
    this.bitSetChange.emit(bitSet);
    this.visible = false;
    this.gaService.event('load_bit_set', 'bit_set_controller', this.gaLabel);
  }
}
