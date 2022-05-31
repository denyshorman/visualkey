import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { BigIntUtils } from '../../utils/BigIntUtils';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
  selector: 'app-bit-set',
  template: `<canvas
    #canvas
    (selectstart)="$event.preventDefault()"
    (contextmenu)="$event.preventDefault()"
    (touchstart)="bitSetTouchStart($event)"
    (touchmove)="bitSetTouchMove($event)"
    (mouseenter)="bitSetMouseEnter()"
    (mousemove)="bitSetMouseMove($event)"
    (mouseleave)="bitSetMouseLeave()"
    (mousedown)="bitMouseDown($event)"
  ></canvas>`,
  styleUrls: ['./bit-set.component.scss'],
})
export class BitSetComponent implements OnChanges, AfterViewInit {
  @Input() bitSet = BigInt(0);
  @Output() bitSetChange = new EventEmitter<bigint>();
  @Input() cols!: number;
  @Input() size!: number;
  @Input() bitSize = DefaultBitSize;
  @Input() falseStateColor = DefaultFalseStateColor;
  @Input() trueStateColor = DefaultTrueStateColor;
  @Input() mouseEnterStrategy = DefaultMouseEnterStrategy;
  @Input() readOnly = false;
  @Input() mouseMoveDisabled = false;
  @Input() gaLabel?: string;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  private bitSetCanvasContext?: CanvasRenderingContext2D;
  private readonly gaCategory = 'bit_set';
  private currentBitIndex?: number;

  constructor(private gaService: GoogleAnalyticsService) {}

  private static isLeftButtonPressed(e: MouseEvent): boolean {
    return e.buttons === 1 || e.button === 1;
  }

  ngAfterViewInit(): void {
    this.bitSetCanvasContext = this.canvas!.nativeElement.getContext('2d', { alpha: false })!;
    this.renderBitSet();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cols'] || changes['size'] || changes['bitSize'] || changes['bitSet']) {
      this.renderBitSet();
    }
  }

  bitSetTouchStart(e: TouchEvent) {
    if (this.readOnly) {
      return;
    }

    e.preventDefault();

    this.down(e);
  }

  bitSetTouchMove(e: TouchEvent) {
    if (this.readOnly) {
      return;
    }

    e.preventDefault();

    this.move(e);
  }

  bitSetMouseEnter() {
    if (this.readOnly) {
      return;
    }

    this.gaService.event('bitset_enter', this.gaCategory, this.gaLabel);
  }

  bitSetMouseLeave() {
    if (this.readOnly) {
      return;
    }

    this.gaService.event('bitset_leave', this.gaCategory, this.gaLabel);
  }

  bitSetMouseMove(e: MouseEvent) {
    if (this.readOnly || (this.mouseMoveDisabled && !BitSetComponent.isLeftButtonPressed(e))) {
      return;
    }

    this.move(e);
  }

  bitMouseDown(e: MouseEvent) {
    if (this.readOnly || !BitSetComponent.isLeftButtonPressed(e)) {
      return;
    }

    this.down(e);
  }

  private down(e: MouseEvent | TouchEvent) {
    const bitIndex = this.coordinateToBitIndex(e);

    if (bitIndex === undefined) {
      this.currentBitIndex = undefined;
      return;
    }

    this.updateRenderNotify(bitIndex);
  }

  private move(e: MouseEvent | TouchEvent) {
    const bitIndex = this.coordinateToBitIndex(e);

    if (bitIndex === undefined) {
      this.currentBitIndex = undefined;
      return;
    }

    if (this.currentBitIndex === bitIndex) {
      return;
    }

    this.updateRenderNotify(bitIndex);
  }

  private updateRenderNotify(bitIndex: number) {
    this.currentBitIndex = bitIndex;
    this.updateBit(this.size - bitIndex - 1);
    this.renderBit(bitIndex);
    this.notifyBitSetChanged();
  }

  private notifyBitSetChanged() {
    const bitSet = this.bitSet;

    setTimeout(() => {
      this.bitSetChange.emit(bitSet);
    }, 0);
  }

  private updateBit(bitIndex: number) {
    switch (this.mouseEnterStrategy) {
      case MouseEnterStrategy.Set:
        this.bitSet = BigIntUtils.setBit(this.bitSet, bitIndex, true);
        break;
      case MouseEnterStrategy.Clear:
        this.bitSet = BigIntUtils.setBit(this.bitSet, bitIndex, false);
        break;
      case MouseEnterStrategy.Flip:
        this.bitSet = BigIntUtils.invertBit(this.bitSet, bitIndex);
        break;
      default:
        throw new Error(`Unrecognized mouse enter strategy ${this.mouseEnterStrategy}`);
    }
  }

  private renderBitSet() {
    if (this.bitSetCanvasContext === undefined || this.canvas === undefined) {
      return;
    }

    const canvas = this.canvas!.nativeElement;
    canvas.height = this.bitSize * Math.ceil(this.size / this.cols);
    canvas.width = this.bitSize * this.cols;
    canvas.parentElement!.style.width = canvas.width + 'px';
    canvas.parentElement!.style.height = canvas.height + 'px';

    for (let bitIndex = 0; bitIndex < this.size; bitIndex++) {
      this.renderBit(bitIndex);
    }
  }

  private renderBit(bitIndex: number) {
    const ctx = this.bitSetCanvasContext!;

    const x = this.bitSize * (bitIndex % this.cols);
    const y = this.bitSize * Math.floor(bitIndex / this.cols);

    const bitValue = BigIntUtils.getBit(this.bitSet, this.size - bitIndex - 1);

    ctx.fillStyle = bitValue ? this.trueStateColor : this.falseStateColor;
    ctx.fillRect(x, y, this.bitSize, this.bitSize);

    ctx.strokeStyle = '#44464d';
    ctx.strokeRect(x, y, this.bitSize, this.bitSize);
  }

  private coordinateToBitIndex(e: MouseEvent | TouchEvent): number | undefined {
    let x: number;
    let y: number;

    if (e instanceof MouseEvent) {
      x = e.clientX;
      y = e.clientY;
    } else {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    const { x: cx, y: cy, width: cw, height: ch } = this.canvas!.nativeElement.getBoundingClientRect();

    if (x < cx || x >= cx + cw || y < cy || y >= cy + ch) {
      return undefined;
    }

    const bitIndex = Math.floor((y - cy) / this.bitSize) * this.cols + Math.floor((x - cx) / this.bitSize);

    if (bitIndex < 0 || bitIndex >= this.size) {
      return undefined;
    }

    return bitIndex;
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
