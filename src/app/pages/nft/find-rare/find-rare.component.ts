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
import { RareWorkerOutput } from './rare.worker';
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

@Component({
  selector: 'app-find-rare',
  standalone: true,
  imports: [AgGridAngular, FormsModule, InputNumber, Button, FaIconComponent, Tooltip],
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
      <div class="flex justify-between gap-1">
        <div class="flex gap-1">
          <p-inputnumber
            prefix="Level: "
            inputId="levelThreshold"
            [(ngModel)]="levelThreshold"
            [min]="0"
            [max]="160"
            [disabled]="isRunning()"
            size="small"
            inputStyleClass="h-9 w-30"
            maxlength="3"
            (keydown.enter)="toggle()"
          />
          <p-button
            (click)="toggle()"
            severity="secondary"
            styleClass="select-none leading-0 h-9 w-9"
            [outlined]="true"
            size="small"
          >
            <fa-icon [icon]="isRunning() ? icons.faStop : icons.faPlay"></fa-icon>
          </p-button>
        </div>
        <div class="flex gap-1">
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
        </div>
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

  constructor(destroyRef: DestroyRef) {
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
    for (let i = 0; i < workerCount; i++) {
      this.startWorker();
    }
  }

  stop(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.isRunning.set(false);
  }

  clearAll() {
    this.gridApi()?.setGridOption('rowData', []);
  }

  autoFit() {
    this.gridApi()?.sizeColumnsToFit();
  }

  autoSize() {
    this.gridApi()?.autoSizeAllColumns(false);
  }

  download() {
    this.gridApi()?.exportDataAsCsv();
  }

  private resizeGrid() {
    const grid = this.agGridRef().nativeElement as HTMLElement;
    const rect = grid.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const newHeight = Math.max(220, window.innerHeight - top - 18);
    grid.style.height = `${newHeight}px`;
  }

  private startWorker(): void {
    const worker = new Worker(new URL('./rare.worker', import.meta.url), { type: 'module' });

    worker.onmessage = ({ data }: MessageEvent<RareWorkerOutput>) => {
      const row: GridRow = {
        privateKeyHex: data.privateKeyHex,
        privateKeyNumber: data.privateKeyNumber,
        addressHex: data.addressHex,
        addressNumber: data.addressNumber,
        level: data.level,
      };

      this.gridApi()?.applyTransactionAsync({ add: [row] });
    };

    worker.postMessage({ levelThreshold: this.levelThreshold() });

    this.workers.push(worker);
  }
}

export interface GridRow {
  privateKeyHex: string;
  privateKeyNumber: bigint;
  addressHex: string;
  addressNumber: bigint;
  level: number;
}
