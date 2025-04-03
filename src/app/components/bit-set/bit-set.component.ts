import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { ThemeService } from '../../services/theme.service';
import {
  FromWorkerMessage,
  FromWorkerMessageType,
  ToWorkerMessage,
  UpdateDataPayload,
  WorkerMessageType,
} from './bit-set.worker';

@Component({
  selector: 'app-bit-set',
  host: {
    class: 'touch-none select-none',
    '[style.width.px]': 'canvasSize().width',
    '[style.height.px]': 'canvasSize().height',
    '[class.cursor-none]': '!readOnly()',
    '[class.cursor-default]': 'readOnly()',
    '(contextmenu)': '$event.preventDefault()',
    '(pointerdown)': 'canvasPointerDown($event)',
    '(pointerup)': 'canvasPointerUp($event)',
    '(pointerenter)': 'canvasPointerEnter($event)',
    '(pointerleave)': 'canvasPointerLeave($event)',
    '(pointermove)': 'canvasPointerMove($event)',
    '(pointercancel)': 'canvasPointerCancel($event)',
    '(wheel)': 'canvasWheel($event)',
  },
  template: `<canvas #bitSetCanvas></canvas>`,
})
export class BitSetComponent implements OnChanges, OnDestroy {
  readonly gridCols = input.required<number>();
  readonly bitCount = input.required<number>();
  readonly mouseEnterStrategy = input(DefaultMouseEnterStrategy);
  readonly mouseMoveDisabled = input(false);
  readonly readOnly = input(false);
  readonly bitSet = model(BigInt(0));
  readonly bitCellSize = input(DefaultBitSize);
  readonly bitSetCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('bitSetCanvas');

  readonly canvasSize = computed(() => {
    const cellSize = this.bitCellSize();
    const gridCols = this.gridCols();
    const bitCount = this.bitCount();
    const width = cellSize * gridCols;
    const height = cellSize * Math.ceil(bitCount / gridCols);
    return { width, height };
  });

  private readonly colors = computed(() => {
    this.themeService.theme();
    const style = getComputedStyle(document.documentElement);
    const bitColor0 = style.getPropertyValue('--app-bit-color-0').trim();
    const bitColor1 = style.getPropertyValue('--app-bit-color-1').trim();
    return { bitColor0, bitColor1 };
  });

  private worker?: Worker;
  private activePointerId?: number;

  constructor(
    private analyticsService: AnalyticsService,
    private themeService: ThemeService,
  ) {
    effect(() => {
      const { bitColor0, bitColor1 } = this.colors();

      if (this.worker) {
        const updateMessage: ToWorkerMessage = {
          type: WorkerMessageType.UpdateData,
          payload: {
            bitColor0,
            bitColor1,
          },
        };

        this.worker.postMessage(updateMessage);
      }
    });

    effect(() => {
      const { width, height } = this.canvasSize();

      if (this.worker) {
        const updateMessage: ToWorkerMessage = {
          type: WorkerMessageType.UpdateData,
          payload: {
            canvasWidth: width,
            canvasHeight: height,
          },
        };

        this.worker.postMessage(updateMessage);
      }
    });

    afterNextRender(() => {
      const offscreenCanvas = this.bitSetCanvas().nativeElement.transferControlToOffscreen();
      offscreenCanvas.width = this.canvasSize().width;
      offscreenCanvas.height = this.canvasSize().height;

      const initMessage: ToWorkerMessage = {
        type: WorkerMessageType.Init,
        payload: {
          canvas: offscreenCanvas,
          gridCols: this.gridCols(),
          totalBitCount: this.bitCount(),
          bitCellSize: this.bitCellSize(),
          bitSet: this.bitSet(),
          bitColor0: this.colors().bitColor0,
          bitColor1: this.colors().bitColor1,
          mouseEnterStrategy: this.mouseEnterStrategy(),
          mouseMoveDisabled: this.mouseMoveDisabled(),
        },
      };

      this.worker = new Worker(new URL('./bit-set.worker', import.meta.url), { type: 'module' });

      this.worker.onmessage = (event: MessageEvent<FromWorkerMessage>) => {
        const message = event.data;

        if (message.type === FromWorkerMessageType.BitSetUpdated) {
          this.bitSet.set(message.payload.bitSet);
        }
      };

      this.worker.postMessage(initMessage, [offscreenCanvas]);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.worker) return;

    const payload: UpdateDataPayload = {};
    let needsUpdate = false;

    const gridCols = changes['gridCols'];

    if (gridCols && !gridCols.firstChange) {
      payload.gridCols = gridCols.currentValue;
      needsUpdate = true;
    }

    const bitCount = changes['bitCount'];

    if (bitCount && !bitCount.firstChange) {
      payload.totalBitCount = bitCount.currentValue;
      needsUpdate = true;
    }

    const mouseEnterStrategy = changes['mouseEnterStrategy'];

    if (mouseEnterStrategy && !mouseEnterStrategy.firstChange) {
      payload.mouseEnterStrategy = mouseEnterStrategy.currentValue;
      needsUpdate = true;
    }

    const mouseMoveDisabled = changes['mouseMoveDisabled'];

    if (mouseMoveDisabled && !mouseMoveDisabled.firstChange) {
      payload.mouseMoveDisabled = mouseMoveDisabled.currentValue;
      needsUpdate = true;
    }

    const bitCellSize = changes['bitCellSize'];

    if (bitCellSize && !bitCellSize.firstChange) {
      payload.bitCellSize = bitCellSize.currentValue;
      needsUpdate = true;
    }

    const bitSet = changes['bitSet'];

    if (bitSet && !bitSet.firstChange) {
      payload.bitSet = bitSet.currentValue;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const updateMessage: ToWorkerMessage = {
        type: WorkerMessageType.UpdateData,
        payload,
      };

      this.worker.postMessage(updateMessage);
    }
  }

  ngOnDestroy() {
    this.destroyWorker();
  }

  canvasPointerEnter(event: PointerEvent) {
    if (this.readOnly() || !this.worker) return;
    this.analyticsService.trackEvent('bitset_pointer_enter');

    this.activePointerId = event.pointerId;

    if (event.target instanceof Element) {
      event.target.setPointerCapture(event.pointerId);
    }

    const rect = this.bitSetCanvas().nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const enterMessage: ToWorkerMessage = {
      type: WorkerMessageType.PointerEnter,
      payload: { x, y },
    };

    this.worker.postMessage(enterMessage);
  }

  canvasPointerLeave(event: PointerEvent) {
    if (this.readOnly() || !this.worker) return;
    if (this.activePointerId !== undefined && event.pointerId !== this.activePointerId) return;

    this.analyticsService.trackEvent('bitset_pointer_leave');
    this.activePointerId = undefined;

    const leaveMessage: ToWorkerMessage = { type: WorkerMessageType.PointerLeave, payload: undefined };
    this.worker.postMessage(leaveMessage);
  }

  canvasPointerMove(event: PointerEvent) {
    if (this.readOnly() || !this.worker) return;
    if (this.activePointerId !== undefined && event.pointerId !== this.activePointerId) return;

    const rect = this.bitSetCanvas().nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const moveMessage: ToWorkerMessage = {
      type: WorkerMessageType.PointerMove,
      payload: { x, y },
    };

    this.worker.postMessage(moveMessage);
  }

  canvasPointerCancel(event: PointerEvent) {
    if (this.readOnly() || !this.worker) return;
    if (this.activePointerId !== undefined && event.pointerId !== this.activePointerId) return;

    this.activePointerId = undefined;

    const moveMessage: ToWorkerMessage = {
      type: WorkerMessageType.PointerCancel,
      payload: undefined,
    };

    this.worker.postMessage(moveMessage);
  }

  canvasPointerDown(event: PointerEvent) {
    if (this.readOnly() || !this.worker) return;

    this.activePointerId = event.pointerId;

    if (event.target instanceof Element) {
      event.target.setPointerCapture(event.pointerId);
    }

    const rect = this.bitSetCanvas().nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const moveMessage: ToWorkerMessage = {
      type: WorkerMessageType.PointerDown,
      payload: { x, y },
    };

    this.worker.postMessage(moveMessage);
  }

  canvasPointerUp(event: PointerEvent) {
    if (this.readOnly() || !this.worker) return;
    if (this.activePointerId !== undefined && event.pointerId !== this.activePointerId) return;

    this.activePointerId = undefined;

    const rect = this.bitSetCanvas().nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const moveMessage: ToWorkerMessage = {
      type: WorkerMessageType.PointerUp,
      payload: { x, y },
    };

    this.worker.postMessage(moveMessage);
  }

  canvasWheel(e: WheelEvent) {
    if (this.readOnly() || !this.worker) return;

    e.preventDefault();

    let increase: boolean | undefined = undefined;

    if (e.deltaY < 0) {
      increase = true;
    } else if (e.deltaY > 0) {
      increase = false;
    }

    if (increase !== undefined) {
      const wheelMessage: ToWorkerMessage = {
        type: WorkerMessageType.ChangeBrushSize,
        payload: { increase },
      };

      this.worker.postMessage(wheelMessage);
    }
  }

  private destroyWorker() {
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.terminate();
      this.worker = undefined;
    }
  }
}

export enum MouseEnterStrategy {
  Set,
  Clear,
  Flip,
}

export const DefaultMouseEnterStrategy = MouseEnterStrategy.Flip;
export const DefaultBitSize = 20;
