import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { BigIntUtils } from '../../utils/BigIntUtils';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
  selector: 'app-bit-set',
  template: `
    <div
      #bitSet
      class="bit-set"
      (contextmenu)="$event.preventDefault()"
      (touchmove)="bitSetTouchMove($event)"
      (touchstart)="bitSetTouchStart($event)"
      (mouseenter)="bitSetMouseEnter()"
      (mouseleave)="bitSetMouseLeave()"
    ></div>
  `,
  styleUrls: ['./bit-set.component.scss'],
})
export class BitSetComponent implements OnChanges, AfterViewInit {
  @Output() bitSetChange = new EventEmitter<bigint>();
  @Input() cols!: number;
  @Input() size!: number;
  @Input() falseStateColor = DefaultFalseStateColor;
  @Input() trueStateColor = DefaultTrueStateColor;
  @Input() mouseEnterStrategy = DefaultMouseEnterStrategy;
  @Input() mouseMoveDisabled = false;
  @Input() gaLabel?: string;
  @ViewChild('bitSet') bitSetGui?: ElementRef<HTMLDivElement>;

  private prevTouchBitGui?: Element;
  private readonly gaCategory = 'bit_set';

  constructor(private renderer: Renderer2, private gaService: GoogleAnalyticsService) {}

  private _readOnly = false;

  get readOnly(): boolean {
    return this._readOnly;
  }

  @Input()
  set readOnly(readOnly: boolean) {
    if (this._readOnly === readOnly) {
      return;
    }

    this._readOnly = readOnly;

    if (this.bitSetGui) {
      this.updateCursorGui();
    }
  }

  private _bitSet = BigInt(0);

  get bitSet(): bigint {
    return this._bitSet;
  }

  @Input()
  set bitSet(bitSet: bigint) {
    if (this._bitSet === bitSet) {
      return;
    }

    this._bitSet = bitSet;

    if (this.bitSetGui) {
      for (let bitIndex = 0; bitIndex < this.size; bitIndex++) {
        this.updateBitColorGui(bitIndex);
      }
    }
  }

  private _bitSize = DefaultBitSize;

  get bitSize(): number {
    return this._bitSize;
  }

  @Input()
  set bitSize(bitSize: number) {
    if (this._bitSize === bitSize) {
      return;
    }

    this._bitSize = bitSize;

    if (this.bitSetGui) {
      this.updateCursorGui();

      for (let bitIndex = 0; bitIndex < this.size; bitIndex++) {
        this.updateBitSizeGui(bitIndex);
      }
    }
  }

  private static isLeftButtonPressed(e: MouseEvent): boolean {
    return e.buttons === 1 || e.button === 1;
  }

  ngAfterViewInit(): void {
    this.createBitSetGui();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cols'] || changes['size']) {
      this.createBitSetGui();
    }
  }

  bitSetTouchMove(e: TouchEvent) {
    if (this._readOnly) {
      return;
    }

    e.preventDefault();

    for (let i = 0; i < e.touches.length; i++) {
      const el = document.elementFromPoint(e.touches[i].pageX, e.touches[i].pageY);
      if (el && this.prevTouchBitGui != el) {
        this.prevTouchBitGui = el;
        el.dispatchEvent(new MouseEvent('mouseenter', { buttons: 1 }));
      }
    }
  }

  bitSetTouchStart(e: TouchEvent) {
    if (this._readOnly) {
      return;
    }

    e.preventDefault();

    if (this.prevTouchBitGui === undefined) {
      e.target?.dispatchEvent(new MouseEvent('mousedown'));
    }

    this.prevTouchBitGui = undefined;
  }

  bitSetMouseEnter() {
    if (this._readOnly) {
      return;
    }

    this.gaService.event('bitset_enter', this.gaCategory, this.gaLabel);
  }

  bitSetMouseLeave() {
    if (this._readOnly) {
      return;
    }

    this.gaService.event('bitset_leave', this.gaCategory, this.gaLabel);
  }

  bitMouseEnter(e: MouseEvent, bitIndex: number) {
    if (this._readOnly || (this.mouseMoveDisabled && !BitSetComponent.isLeftButtonPressed(e))) {
      return;
    }

    this.updateBitAndNotify(bitIndex);
  }

  bitMouseDown(bitIndex: number) {
    if (this._readOnly) {
      return;
    }

    this.updateBitAndNotify(bitIndex);
  }

  private updateBitAndNotify(bitIndex: number) {
    this.updateBit(this.size - bitIndex - 1);
    this.updateBitColorGui(bitIndex);
    this.bitSetChange.emit(this._bitSet);
  }

  private createBitSetGui() {
    if (this.bitSetGui === undefined) {
      return;
    }

    this.bitSetGui!.nativeElement.innerHTML = '';
    this.updateCursorGui();

    for (let bitIndex = 0; bitIndex < this.size; bitIndex++) {
      this.createBitGui(bitIndex);
    }
  }

  private createBitGui(bitIndex: number) {
    const rowIndex = Math.floor(bitIndex / this.cols) + 1;
    const colIndex = (bitIndex % this.cols) + 1;

    const bitState = BigIntUtils.getBit(this._bitSet, this.size - bitIndex - 1);
    const bitColor = this.getBitColor(bitState);
    const bitSize = this._bitSize + 'px';

    const bit = this.renderer.createElement('div');
    this.renderer.setAttribute(bit, 'class', 'bit');
    this.renderer.setStyle(bit, 'grid-row', rowIndex.toString());
    this.renderer.setStyle(bit, 'grid-column', colIndex.toString());
    this.renderer.setStyle(bit, 'width', bitSize);
    this.renderer.setStyle(bit, 'height', bitSize);
    this.renderer.setStyle(bit, 'background-color', bitColor);
    this.renderer.listen(bit, 'mouseenter', (e: MouseEvent) => this.bitMouseEnter(e, bitIndex));
    this.renderer.listen(bit, 'mousedown', () => this.bitMouseDown(bitIndex));
    this.renderer.appendChild(this.bitSetGui!.nativeElement, bit);
  }

  private updateBitColorGui(bitIndex: number) {
    const bitState = BigIntUtils.getBit(this._bitSet, this.size - bitIndex - 1);
    const bitColor = this.getBitColor(bitState);
    const bit = this.bitSetGui!.nativeElement.children[bitIndex];
    this.renderer.setStyle(bit, 'background-color', bitColor);
  }

  private updateBitSizeGui(bitIndex: number) {
    const bitSize = this._bitSize + 'px';
    const bit = this.bitSetGui!.nativeElement.children[bitIndex];
    this.renderer.setStyle(bit, 'width', bitSize);
    this.renderer.setStyle(bit, 'height', bitSize);
  }

  private updateCursorGui() {
    if (!this._readOnly) {
      const sz = this.bitSize * 0.75;
      const xyr = sz / 2;
      const cursorSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${sz}' height='${sz}'><circle cx='${xyr}' cy='${xyr}' r='${xyr}' fill='black' fill-opacity='0.8' shape-rendering='geometricPrecision'/></svg>`;
      const cursor = `url("data:image/svg+xml;utf8,${cursorSvg}") ${xyr} ${xyr}, default`;

      this.renderer.setStyle(this.bitSetGui!.nativeElement, 'cursor', cursor);
    } else {
      this.renderer.setStyle(this.bitSetGui!.nativeElement, 'cursor', 'default');
    }
  }

  private updateBit(bitIndex: number) {
    switch (this.mouseEnterStrategy) {
      case MouseEnterStrategy.Set:
        this._bitSet = BigIntUtils.setBit(this._bitSet, bitIndex, true);
        break;
      case MouseEnterStrategy.Clear:
        this._bitSet = BigIntUtils.setBit(this._bitSet, bitIndex, false);
        break;
      case MouseEnterStrategy.Flip:
        this._bitSet = BigIntUtils.invertBit(this._bitSet, bitIndex);
        break;
      default:
        throw new Error(`Unrecognized mouse enter strategy ${this.mouseEnterStrategy}`);
    }
  }

  private getBitColor(bitValue: boolean): string {
    return bitValue ? this.trueStateColor : this.falseStateColor;
  }
}

export enum MouseEnterStrategy {
  Set,
  Clear,
  Flip,
}

export const DefaultMouseEnterStrategy = MouseEnterStrategy.Flip;
export const DefaultFalseStateColor = '#ff0040';
export const DefaultTrueStateColor = '#30ff12';
export const DefaultBitSize = 20;
