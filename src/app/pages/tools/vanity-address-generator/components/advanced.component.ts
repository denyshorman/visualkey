import { afterNextRender, Component, DestroyRef, ElementRef, input, model, signal, viewChild } from '@angular/core';
import { BitSetComponent } from '../../../../components/bit-set/bit-set.component';
import { Panel } from 'primeng/panel';
import { ETH_ADDR_BIT_COUNT } from '../../../../utils/eth-utils';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { PopoverHelpButtonComponent } from '../../../../components/popover-help-button/popover-help-button.component';
import { Button } from 'primeng/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-vanity-address-generator-advanced',
  standalone: true,
  imports: [Panel, BitSetComponent, PopoverHelpButtonComponent, Button, FaIconComponent],
  host: {
    class: 'contents',
  },
  template: `
    <p-panel header="Advanced" toggler="header" [toggleable]="true" [collapsed]="true" transitionOptions="100ms">
      <div class="flex flex-col gap-4" #container>
        <div>
          <h4 class="font-semibold">
            Value Mask

            <app-popover-help-button>
              <strong>Value Mask</strong> specifies the exact bits you want to match in the address.<br />
              Only the bits enabled in the <strong>Care Mask</strong> are compared.
            </app-popover-help-button>
          </h4>
          <app-bit-set
            [(bitSet)]="valueMask"
            [gridCols]="gridCols()"
            [bitCount]="bitsCount"
            [readOnly]="readOnly()"
            [mouseMoveDisabled]="true"
            [bitCellSize]="bitCellSize()"
          ></app-bit-set>
        </div>
        <div>
          <h4 class="font-semibold">
            Care Mask

            <app-popover-help-button>
              <strong>Care Mask</strong> determines which bits in the address must match the Value Mask.<br />
              Bits not set here are ignored during matching.
            </app-popover-help-button>
          </h4>
          <app-bit-set
            [(bitSet)]="careMask"
            [gridCols]="gridCols()"
            [bitCount]="bitsCount"
            [readOnly]="readOnly()"
            [mouseMoveDisabled]="true"
            [bitCellSize]="bitCellSize()"
          ></app-bit-set>
        </div>
        <p-button
          (click)="reset()"
          severity="secondary"
          styleClass="select-none w-full"
          [outlined]="true"
          size="small"
        >
          <fa-icon [icon]="faRotateLeft"></fa-icon> Reset
        </p-button>
      </div>
    </p-panel>
  `,
})
export class AdvancedComponent {
  readonly faRotateLeft = faRotateLeft;
  readonly bitsCount = ETH_ADDR_BIT_COUNT;
  readonly gridCols = signal(40);
  readonly valueMask = model(0n);
  readonly careMask = model(0n);
  readonly readOnly = input(false);
  readonly bitCellSize = signal(0);
  readonly containerRef = viewChild.required<ElementRef>('container');

  constructor(destroyRef: DestroyRef) {
    afterNextRender(() => {
      this.changeBitSize();
      const resizeObserver = new ResizeObserver(() => this.changeBitSize());
      resizeObserver.observe(document.body);
      destroyRef.onDestroy(() => resizeObserver.disconnect());
    });
  }

  reset() {
    this.valueMask.set(0n);
    this.careMask.set(0n);
  }

  private changeBitSize() {
    const containerWidth = this.containerRef()?.nativeElement.clientWidth;

    if (containerWidth) {
      const bitSize = containerWidth / this.gridCols();
      this.bitCellSize.set(bitSize);
    }

    const viewportWidth = window.innerWidth;

    if (viewportWidth >= 640) {
      this.gridCols.set(40);
    } else {
      this.gridCols.set(20);
    }
  }
}
