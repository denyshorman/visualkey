import { afterNextRender, Component, DestroyRef, ElementRef, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CellStyleModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  CsvExportModule,
  ExternalFilterModule,
  GridApi,
  GridOptions,
  NumberFilterModule,
  RenderApiModule,
  RowApiModule,
  RowStyleModule,
  TextFilterModule,
  themeBalham,
  TooltipModule,
  ValidationModule,
} from 'ag-grid-community';
import { environment } from '../../../../environments/environment';
import { AgGridAngular } from 'ag-grid-angular';
import { InputNumber } from 'primeng/inputnumber';
import { Button } from 'primeng/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faDownLeftAndUpRightToCenter,
  faDownload,
  faPlay,
  faStop,
  faTrashCan,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'primeng/tooltip';
import { MintButtonRendererComponent } from './mint-button-renderer.component';
import { AnalyticsService } from '../../../services/analytics.service';
import { DecimalPipe } from '@angular/common';
import { bytesToHex } from 'viem'
import { isWasmSupported } from '../../../utils/wasm-utils';

@Component({
  selector: 'app-find-rare',
  standalone: true,
  imports: [AgGridAngular, FormsModule, InputNumber, Button, FaIconComponent, Tooltip, DecimalPipe],
  host: {
    class: 'flex flex-col grow',
  },
  template: `
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900 shadow-lg px-10 py-8 gap-4 border-b border-neutral-200 dark:border-neutral-700"
    >
      <div class="flex flex-col gap-1">
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">Find Rare Keys</h1>
        <h2 class="text-lg font-medium text-neutral-500 dark:text-neutral-300">
          Use your CPU power to discover addresses with a high rarity level
        </h2>
      </div>
    </div>
    <div class="grow flex flex-col gap-2 m-2">
      <div class="flex gap-1 overflow-auto scrollbar-none">
        <p-inputnumber
          prefix="Level: "
          inputId="levelThreshold"
          [(ngModel)]="levelThreshold"
          [min]="0"
          [max]="160"
          [disabled]="isRunning()"
          size="small"
          inputStyleClass="h-9 w-30"
          [maxlength]="3"
          (keydown.enter)="toggle()"
        />
        <p-button
          (click)="toggle()"
          severity="secondary"
          styleClass="select-none leading-0 h-9 w-9"
          [outlined]="true"
          size="small"
        >
          <fa-icon
            [icon]="isRunning() ? icons.faStop : icons.faPlay"
            [class.text-red-500]="isRunning()"
          ></fa-icon>
        </p-button>
        <p-button
          (click)="clearAll()"
          variant="outlined"
          severity="secondary"
          size="small"
          styleClass="select-none leading-0 h-9 w-9"
          pTooltip="Clear the table"
          tooltipPosition="top"
          [showDelay]="500"
        >
          <fa-icon [icon]="icons.faTrashCan"></fa-icon>
        </p-button>
        <p-button
          (click)="autoFit()"
          variant="outlined"
          severity="secondary"
          size="small"
          styleClass="select-none leading-0 h-9 w-9"
          pTooltip="Shrink columns to fit screen"
          tooltipPosition="top"
          [showDelay]="500"
        >
          <fa-icon [icon]="icons.faDownLeftAndUpRightToCenter"></fa-icon>
        </p-button>
        <p-button
          (click)="autoSize()"
          variant="outlined"
          severity="secondary"
          size="small"
          styleClass="select-none leading-0 h-9 w-9"
          pTooltip="Expand columns to fit content"
          tooltipPosition="top"
          [showDelay]="500"
        >
          <fa-icon [icon]="icons.faUpRightAndDownLeftFromCenter"></fa-icon>
        </p-button>
        <p-button
          variant="outlined"
          severity="secondary"
          size="small"
          styleClass="select-none leading-0 h-9 w-9"
          (click)="download()"
          pTooltip="Export as CSV"
          tooltipPosition="top"
          [showDelay]="500"
        >
          <fa-icon [icon]="icons.faDownload"></fa-icon>
        </p-button>
        @if (isRunning()) {
          <p-button
            variant="outlined"
            severity="secondary"
            size="small"
            class="shrink-0"
            styleClass="select-none leading-0 h-9 cursor-default hover:bg-(--p-button-outlined-secondary-background)"
          >
            {{ hashRate() | number: '1.0-0' }} h/s
          </p-button>
        }
      </div>
      <div #agGrid class="grow">
        <ag-grid-angular class="h-full w-full" [modules]="gridModules" [gridOptions]="gridOptions"></ag-grid-angular>
      </div>
    </div>
  `,
})
export class FindRareComponent {
  readonly icons = {
    faPlay,
    faStop,
    faDownload,
    faTrashCan,
    faUpRightAndDownLeftFromCenter,
    faDownLeftAndUpRightToCenter,
  };

  readonly levelThreshold = signal(15);
  readonly isRunning = signal(false);
  readonly hashRate = signal(0);

  readonly agGridRef = viewChild.required<ElementRef>('agGrid');

  readonly gridApi = signal<GridApi<GridRow> | undefined>(undefined);

  readonly gridModules = [
    ClientSideRowModelModule,
    ClientSideRowModelApiModule,
    RowApiModule,
    RowStyleModule,
    RenderApiModule,
    TextFilterModule,
    NumberFilterModule,
    ExternalFilterModule,
    ColumnAutoSizeModule,
    CsvExportModule,
    TooltipModule,
    CellStyleModule,
    ...(environment.production ? [] : [ValidationModule]),
  ];

  readonly gridOptions: GridOptions<GridRow> = {
    theme: themeBalham,
    suppressDragLeaveHidesColumns: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    suppressCellFocus: true,
    suppressRowHoverHighlight: true,
    autoSizeStrategy: {
      type: 'fitCellContents',
    },
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 30,
    },
    columnDefs: [
      {
        headerName: 'Level',
        field: 'level',
        cellDataType: 'number',
        headerTooltip: 'Address rarity level',
      },
      {
        headerName: 'Private Key',
        field: 'privateKeyHex',
        comparator: (_valueA, _valueB, nodeA, nodeB) => {
          if (nodeA.data!.privateKeyNumber < nodeB.data!.privateKeyNumber) {
            return -1;
          } else if (nodeA.data!.privateKeyNumber > nodeB.data!.privateKeyNumber) {
            return 1;
          } else {
            return 0;
          }
        },
      },
      {
        headerName: 'Address',
        field: 'addressHex',
        comparator: (_valueA, _valueB, nodeA, nodeB) => {
          if (nodeA.data!.addressNumber < nodeB.data!.addressNumber) {
            return -1;
          } else if (nodeA.data!.addressNumber > nodeB.data!.addressNumber) {
            return 1;
          } else {
            return 0;
          }
        },
      },
      {
        headerName: 'Mint',
        cellRenderer: MintButtonRendererComponent,
        filter: false,
        sortable: false,
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
    ],
    rowData: [],
    onGridReady: event => {
      this.gridApi.set(event.api);
    },
    onGridPreDestroyed: () => {
      this.gridApi.set(undefined);
    },
    getRowId: params => {
      return params.data.privateKeyHex;
    },
    onFirstDataRendered: event => {
      if (window.innerWidth > 1500) {
        event.api.setGridOption('alwaysShowVerticalScroll', true);
      }
    },
  };

  private workers: Worker[] = [];
  private totalHashesThisRun = 0;
  private hashesPerSecond = 0;
  private hashingStartTime = 0;
  private lastHashUpdateTime = 0;
  private readonly hashesPerBatch = 1000;

  constructor(
    private analyticsService: AnalyticsService,
    destroyRef: DestroyRef,
  ) {
    afterNextRender(() => {
      this.resizeGrid();

      const resizeObserver = new ResizeObserver(() => this.resizeGrid());
      resizeObserver.observe(document.body);

      destroyRef.onDestroy(() => {
        resizeObserver?.disconnect();
      });
    });

    destroyRef.onDestroy(() => {
      this.stop();
    });
  }

  detach() {
    if (this.isRunning()) {
      this.stop();
    }
  }

  toggle(): void {
    if (this.isRunning()) {
      this.stop();
    } else {
      this.start();
    }
  }

  start(): void {
    this.isRunning.set(true);

    const workerCount = navigator.hardwareConcurrency ?? 1;
    const wasmSupported = isWasmSupported();

    for (let i = 0; i < workerCount; i++) {
      const worker = wasmSupported ? this.startWasmWorker() : this.startJsWorker();
      this.workers.push(worker);
    }

    this.totalHashesThisRun = 0;
    this.hashesPerSecond = 0;
    this.hashingStartTime = Date.now();
    this.lastHashUpdateTime = this.hashingStartTime;

    for (const worker of this.workers) {
      worker.postMessage({ levelThreshold: this.levelThreshold(), batchSize: this.hashesPerBatch });
    }

    this.analyticsService.trackEvent('find_rare_start', {
      workerCount,
      levelThreshold: this.levelThreshold(),
    });
  }

  stop(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers = [];

    this.isRunning.set(false);

    this.analyticsService.trackEvent('find_rare_stop', {
      elapsedTime: Date.now() - this.hashingStartTime,
      hashCount: this.totalHashesThisRun,
    });
  }

  clearAll() {
    this.gridApi()?.setGridOption('rowData', []);
    this.analyticsService.trackEvent('find_rare_clear_all');
  }

  autoFit() {
    this.gridApi()?.sizeColumnsToFit();
    this.analyticsService.trackEvent('find_rare_auto_fit');
  }

  autoSize() {
    this.gridApi()?.autoSizeAllColumns(false);
    this.analyticsService.trackEvent('find_rare_auto_size');
  }

  download() {
    this.gridApi()?.exportDataAsCsv({ columnKeys: ['level', 'privateKeyHex', 'addressHex'] });
    this.analyticsService.trackEvent('find_rare_download_csv');
  }

  private resizeGrid() {
    const grid = this.agGridRef().nativeElement as HTMLElement;
    const rect = grid.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const newHeight = Math.max(220, window.innerHeight - top - 18);
    grid.style.height = `${newHeight}px`;
  }

  private calcHashRate() {
    this.totalHashesThisRun += this.hashesPerBatch;
    this.hashesPerSecond += this.hashesPerBatch;

    const now = Date.now();
    const timeDiff = now - this.lastHashUpdateTime;

    if (timeDiff > 1000) {
      this.hashRate.set((this.hashesPerSecond / timeDiff) * 1000);
      this.hashesPerSecond = 0;
      this.lastHashUpdateTime = now;
    }
  }

  private startWasmWorker() {
    const worker = new Worker(new URL('./rare-wasm.worker', import.meta.url), { type: 'module' });

    worker.onmessage = ({ data }) => {
      this.calcHashRate();

      for (const key of data) {
        const privateKeyHex = bytesToHex(key.privateKey);
        const privateKeyNumber = BigInt(privateKeyHex);
        const addressHex = bytesToHex(key.address);
        const addressNumber = BigInt(addressHex);

        const row: GridRow = {
          privateKeyHex,
          privateKeyNumber,
          addressHex,
          addressNumber,
          level: key.level,
        };

        this.gridApi()?.applyTransactionAsync({ add: [row] });
      }
    };

    return worker;
  }

  private startJsWorker() {
    const worker = new Worker(new URL('./rare-js.worker', import.meta.url), { type: 'module' });

    worker.onmessage = ({ data }) => {
      this.calcHashRate();

      for (const key of data) {
        const row: GridRow = {
          privateKeyHex: key.privateKeyHex,
          privateKeyNumber: key.privateKeyNumber,
          addressHex: key.addressHex,
          addressNumber: key.addressNumber,
          level: key.level,
        };

        this.gridApi()?.applyTransactionAsync({ add: [row] });
      }
    };

    return worker;
  }
}

export interface GridRow {
  privateKeyHex: string;
  privateKeyNumber: bigint;
  addressHex: string;
  addressNumber: bigint;
  level: number;
}
