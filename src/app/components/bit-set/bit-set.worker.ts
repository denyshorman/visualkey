import { getBit, invertBit, setBit } from '../../utils/big-int-utils';
import { MouseEnterStrategy } from './bit-set.component';

//#region State
let canvas: OffscreenCanvas;
let canvasCtx: OffscreenCanvasRenderingContext2D;
let gridCols: number;
let totalBitCount: number;
let bitCellSize: number;
let bitSet: bigint;
let bitColor1: string;
let bitColor0: string;
let mouseEnterStrategy: MouseEnterStrategy;
let mouseMoveDisabled: boolean;
let pointerX: number | undefined;
let pointerY: number | undefined;
let minBrushSize: number;
let maxBrushSize: number;
let brushSize: number;
let lastModifiedBits: Set<number>;
let isDrawingActive: boolean;
//#endregion

//#region Message Handler
onmessage = (event: MessageEvent<ToWorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case WorkerMessageType.Init: {
      canvas = message.payload.canvas;
      canvasCtx = canvas.getContext('2d')!;
      gridCols = message.payload.gridCols;
      totalBitCount = message.payload.totalBitCount;
      bitCellSize = message.payload.bitCellSize;
      bitSet = message.payload.bitSet;
      bitColor0 = message.payload.bitColor0;
      bitColor1 = message.payload.bitColor1;
      mouseEnterStrategy = message.payload.mouseEnterStrategy;
      mouseMoveDisabled = message.payload.mouseMoveDisabled;
      minBrushSize = calculateMinBrushSize();
      maxBrushSize = calculateMaxBrushSize();
      brushSize = minBrushSize;
      lastModifiedBits = new Set<number>();

      canvasCtx.imageSmoothingEnabled = false;

      renderBitSet();

      break;
    }

    case WorkerMessageType.UpdateData: {
      let needsRedraw = false;
      let recalculateCursorSize = false;
      const payload = message.payload;

      if (payload.gridCols !== undefined && gridCols !== payload.gridCols) {
        gridCols = payload.gridCols;
        needsRedraw = true;
      }

      if (payload.totalBitCount !== undefined && totalBitCount !== payload.totalBitCount) {
        totalBitCount = payload.totalBitCount;
        needsRedraw = true;
      }

      if (payload.bitSet !== undefined && bitSet !== payload.bitSet) {
        bitSet = payload.bitSet;
        needsRedraw = true;
      }

      if (payload.bitColor0 !== undefined && bitColor0 !== payload.bitColor0) {
        bitColor0 = payload.bitColor0;
        needsRedraw = true;
      }

      if (payload.bitColor1 !== undefined && bitColor1 !== payload.bitColor1) {
        bitColor1 = payload.bitColor1;
        needsRedraw = true;
      }

      if (payload.bitCellSize !== undefined && bitCellSize !== payload.bitCellSize) {
        bitCellSize = payload.bitCellSize;
        needsRedraw = true;
        recalculateCursorSize = true;
      }

      if (payload.canvasWidth !== undefined && canvas.width !== payload.canvasWidth) {
        canvas.width = payload.canvasWidth;
        needsRedraw = true;
        recalculateCursorSize = true;
      }

      if (payload.canvasHeight !== undefined && canvas.height !== payload.canvasHeight) {
        canvas.height = payload.canvasHeight;
        needsRedraw = true;
        recalculateCursorSize = true;
      }

      if (payload.mouseEnterStrategy !== undefined && mouseEnterStrategy !== payload.mouseEnterStrategy) {
        mouseEnterStrategy = payload.mouseEnterStrategy;
      }

      if (payload.mouseMoveDisabled !== undefined && mouseMoveDisabled !== payload.mouseMoveDisabled) {
        mouseMoveDisabled = payload.mouseMoveDisabled;
      }

      if (recalculateCursorSize) {
        minBrushSize = calculateMinBrushSize();
        maxBrushSize = calculateMaxBrushSize();
        brushSize = Math.max(minBrushSize, Math.min(brushSize, maxBrushSize));
      }

      if (needsRedraw) {
        renderBitSet();
      }

      break;
    }

    case WorkerMessageType.PointerEnter: {
      pointerX = message.payload.x;
      pointerY = message.payload.y;

      if (!mouseMoveDisabled) {
        const bits = getNewlyIntersectedBits();
        updateBitSetFor(bits);
      }

      renderBitSet();

      break;
    }

    case WorkerMessageType.PointerLeave:
    case WorkerMessageType.PointerCancel: {
      pointerX = pointerY = undefined;
      isDrawingActive = false;
      lastModifiedBits.clear();
      renderBitSet();
      break;
    }

    case WorkerMessageType.PointerMove: {
      pointerX = message.payload.x;
      pointerY = message.payload.y;

      if (isDrawingActive || !mouseMoveDisabled) {
        const bits = getNewlyIntersectedBits();
        updateBitSetFor(bits);
      }

      renderBitSet();

      break;
    }

    case WorkerMessageType.PointerDown: {
      pointerX = message.payload.x;
      pointerY = message.payload.y;

      isDrawingActive = true;

      const bits = getNewlyIntersectedBits();
      updateBitSetFor(bits);
      renderBitSet();

      break;
    }

    case WorkerMessageType.PointerUp: {
      isDrawingActive = false;
      lastModifiedBits.clear();
      break;
    }

    case WorkerMessageType.ChangeBrushSize: {
      if (message.payload.increase) {
        brushSize = Math.min(2 * brushSize, maxBrushSize);
      } else {
        brushSize = Math.max(minBrushSize, brushSize / 2);
      }

      if (isDrawingActive || !mouseMoveDisabled) {
        const bits = getNewlyIntersectedBits();
        updateBitSetFor(bits);
      }

      renderBitSet();

      break;
    }
  }
};
//#endregion

//#region Utils
function calculateMinBrushSize() {
  return bitCellSize * 1.1;
}

function calculateMaxBrushSize() {
  return Math.max(canvas.width, canvas.height) / 2;
}

function updateBitSetFor(bits: Set<number>) {
  if (bits.size == 0) {
    return;
  }

  let updatedBitSet = bitSet;

  for (const bitIndex of bits) {
    const actualIndex = totalBitCount - bitIndex - 1;
    updatedBitSet = changeBit(updatedBitSet, actualIndex);
  }

  if (updatedBitSet !== bitSet) {
    bitSet = updatedBitSet;

    postMessage({
      type: FromWorkerMessageType.BitSetUpdated,
      payload: { bitSet },
    });
  }
}

function getNewlyIntersectedBits(): Set<number> {
  const bitsUnderBrush = findIntersectingBits();
  const newBits = bitsUnderBrush.difference(lastModifiedBits);
  lastModifiedBits = bitsUnderBrush;
  return newBits;
}

function findIntersectingBits(): Set<number> {
  const bitsUnderBrush = new Set<number>();
  const brushRadius = brushSize / 2;
  const brushRadiusSquared = brushRadius * brushRadius;

  const minCol = Math.max(0, Math.floor((pointerX! - brushRadius) / bitCellSize));
  const maxCol = Math.min(gridCols - 1, Math.ceil((pointerX! + brushRadius) / bitCellSize));
  const minRow = Math.max(0, Math.floor((pointerY! - brushRadius) / bitCellSize));
  const maxRow = Math.min(Math.ceil(totalBitCount / gridCols) - 1, Math.ceil((pointerY! + brushRadius) / bitCellSize));

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const bitIndex = row * gridCols + col;

      if (bitIndex >= totalBitCount) {
        continue;
      }

      const cellCenterX = bitCellSize * col + bitCellSize / 2;
      const cellCenterY = bitCellSize * row + bitCellSize / 2;

      const xDistance = pointerX! - cellCenterX;
      const yDistance = pointerY! - cellCenterY;
      const distanceSquared = xDistance * xDistance + yDistance * yDistance;

      if (distanceSquared <= brushRadiusSquared) {
        bitsUnderBrush.add(bitIndex);
      }
    }
  }

  return bitsUnderBrush;
}

function changeBit(currentBitSet: bigint, index: number): bigint {
  switch (mouseEnterStrategy) {
    case MouseEnterStrategy.Set:
      return setBit(currentBitSet, index, true);
    case MouseEnterStrategy.Clear:
      return setBit(currentBitSet, index, false);
    case MouseEnterStrategy.Flip:
      return invertBit(currentBitSet, index);
    default:
      throw new Error(`Unrecognized mouse enter strategy ${mouseEnterStrategy}`);
  }
}

function renderBrush() {
  if (pointerX === undefined || pointerY === undefined) {
    return;
  }

  const brushRadius = brushSize / 2;

  canvasCtx.fillStyle = 'rgba(0,0,0,0.4)';
  canvasCtx.beginPath();
  canvasCtx.arc(pointerX, pointerY, brushRadius, 0, 2 * Math.PI);
  canvasCtx.fill();
}

function renderBitSet() {
  if (totalBitCount === 0 || gridCols === 0) {
    return;
  }

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  for (let bitIndex = 0; bitIndex < totalBitCount; bitIndex++) {
    const cellX = bitCellSize * (bitIndex % gridCols);
    const cellY = bitCellSize * Math.floor(bitIndex / gridCols);

    const bitValue = getBit(bitSet, totalBitCount - bitIndex - 1);

    canvasCtx.fillStyle = bitValue ? bitColor1 : bitColor0;
    canvasCtx.fillRect(cellX, cellY, bitCellSize, bitCellSize);

    canvasCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    canvasCtx.lineWidth = 0.5;
    canvasCtx.strokeRect(cellX, cellY, bitCellSize, bitCellSize);
  }

  renderBrush();
}
//#endregion

//#region Models

export enum WorkerMessageType {
  Init,
  UpdateData,
  PointerEnter,
  PointerLeave,
  PointerMove,
  PointerDown,
  PointerUp,
  PointerCancel,
  ChangeBrushSize,
}

export enum FromWorkerMessageType {
  BitSetUpdated,
}

export interface InitPayload {
  canvas: OffscreenCanvas;
  gridCols: number;
  totalBitCount: number;
  bitCellSize: number;
  bitSet: bigint;
  bitColor0: string;
  bitColor1: string;
  mouseEnterStrategy: MouseEnterStrategy;
  mouseMoveDisabled: boolean;
}

export interface UpdateDataPayload {
  gridCols?: number;
  totalBitCount?: number;
  bitCellSize?: number;
  bitSet?: bigint;
  bitColor0?: string;
  bitColor1?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  mouseEnterStrategy?: MouseEnterStrategy;
  mouseMoveDisabled?: boolean;
}

export interface PointerPosition {
  x: number;
  y: number;
}

export interface ChangeBrushSizePayload {
  increase: boolean;
}

export interface BitUpdatedPayload {
  bitSet: bigint;
}

interface WorkerMessageBase<T extends WorkerMessageType, P = undefined> {
  type: T;
  payload: P;
}

interface FromWorkerMessageBase<T extends FromWorkerMessageType, P = undefined> {
  type: T;
  payload: P;
}

export type InitWorkerMessage = WorkerMessageBase<WorkerMessageType.Init, InitPayload>;
export type UpdateDataWorkerMessage = WorkerMessageBase<WorkerMessageType.UpdateData, UpdateDataPayload>;
export type PointerEnterWorkerMessage = WorkerMessageBase<WorkerMessageType.PointerEnter, PointerPosition>;
export type PointerLeaveWorkerMessage = WorkerMessageBase<WorkerMessageType.PointerLeave>;
export type PointerCancelWorkerMessage = WorkerMessageBase<WorkerMessageType.PointerCancel>;
export type PointerMoveWorkerMessage = WorkerMessageBase<WorkerMessageType.PointerMove, PointerPosition>;
export type PointerDownWorkerMessage = WorkerMessageBase<WorkerMessageType.PointerDown, PointerPosition>;
export type PointerUpWorkerMessage = WorkerMessageBase<WorkerMessageType.PointerUp, PointerPosition>;
export type ChangeBrushSizeWorkerMessage = WorkerMessageBase<WorkerMessageType.ChangeBrushSize, ChangeBrushSizePayload>;
export type BitUpdatedWorkerMessage = FromWorkerMessageBase<FromWorkerMessageType.BitSetUpdated, BitUpdatedPayload>;

export type ToWorkerMessage =
  | InitWorkerMessage
  | UpdateDataWorkerMessage
  | PointerMoveWorkerMessage
  | PointerEnterWorkerMessage
  | PointerLeaveWorkerMessage
  | PointerCancelWorkerMessage
  | PointerUpWorkerMessage
  | PointerDownWorkerMessage
  | ChangeBrushSizeWorkerMessage;

export type FromWorkerMessage = BitUpdatedWorkerMessage;
//#endregion
