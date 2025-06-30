import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  CellDoubleClickedEvent,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ColGroupDef,
  ColumnAutoSizeModule,
  CsvExportModule,
  ExternalFilterModule,
  type GridApi,
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
import { AgGridAngular } from 'ag-grid-angular';
import { chains } from '../../../services/chains.service';
import { AnalyticsService } from '../../../services/analytics.service';
import { environment } from '../../../../environments/environment';
import { filter, first, map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { EthAccount } from '../../../models/eth-account';
import { TxBalanceService } from '../../../services/tx-balance.service';
import { EthAddrHistoryGridHeaderComponent } from './eth-addr-history-grid-header.component';
import { concatMap, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { DoublyLinkedList } from '@datastructures-js/linked-list';
import { formatUnits } from 'viem';

@Component({
  selector: 'app-eth-addr-history',
  imports: [AgGridAngular, FormsModule, EthAddrHistoryGridHeaderComponent],
  host: {
    class: 'flex flex-col gap-1',
  },
  template: `
    <app-eth-addr-history-grid-header
      [ethAccount]="ethAccount()"
      [displayedRowCount]="displayedRowCount()"
      [totalGeneratedRowCount]="totalGeneratedRowCount()"
      [currencyUnitOptions]="currencyUnitOptions"
      [(selectedCurrencyUnit)]="selectedCurrencyUnit"
      [(networkEnabled)]="networkEnabled"
      [(showOnlyActiveAccounts)]="showOnlyActiveAccounts"
      (clearAllClick)="clearAllClick()"
      (autoFitClick)="autoFitClick()"
      (autoSizeClick)="autoSizeClick()"
      (downloadClick)="downloadClick()"
      (viewSourceCodeClick)="viewSourceCodeClick()"
    ></app-eth-addr-history-grid-header>
    <div #agGrid>
      <ag-grid-angular
        class="h-full w-full"
        [modules]="gridModules"
        [gridOptions]="gridOptions"
      ></ag-grid-angular>
    </div>
  `,
})
export class EthAddrHistoryComponent {
  //#region Component Inputs

  //#region Ethereum account that will be rendered in the grid
  readonly ethAccount = input<EthAccount>();
  //#endregion

  //#region Maximum number of rows to keep in the grid
  // When this limit is exceeded, inactive rows will be removed
  readonly maxRowCount = input(1024);
  //#endregion

  //#region Network connection control
  // When disabled, balances won't be fetched for newly added rows
  readonly networkEnabled = model(true);
  //#endregion

  //#endregion

  //#region Grid State Properties
  readonly displayedRowCount = signal(0);
  readonly totalGeneratedRowCount = signal(0);
  //#endregion

  //#region Grid Filter Properties
  readonly showOnlyActiveAccounts = signal(false);
  //#endregion

  //#region Grid Formatting Options
  readonly currencyUnitOptions: CurrencyUnit[] = [
    {
      name: 'Ether',
      value: 18,
    },
    {
      name: 'Wei',
      value: 0,
    },
  ];

  readonly selectedCurrencyUnit = signal(this.currencyUnitOptions[0].value);
  //#endregion

  //#region Grid Configuration
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
    ...(environment.production ? [] : [ValidationModule]),
  ];

  readonly gridOptions: GridOptions<GridRow> = {
    theme: themeBalham,
    suppressDragLeaveHidesColumns: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    suppressCellFocus: true,
    suppressRowHoverHighlight: true,
    asyncTransactionWaitMillis: 90,
    context: {
      selectedCurrencyUnit: this.selectedCurrencyUnit(),
    },
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 30,
    },
    columnDefs: [
      {
        headerName: 'Private Key',
        field: 'privateKey',
        comparator: (_valueA, _valueB, nodeA, nodeB) => {
          if (nodeA.data!.privateKeyDecimal < nodeB.data!.privateKeyDecimal) {
            return -1;
          } else if (nodeA.data!.privateKeyDecimal > nodeB.data!.privateKeyDecimal) {
            return 1;
          } else {
            return 0;
          }
        },
      },
      {
        headerName: 'Address',
        field: 'address',
        comparator: (_valueA, _valueB, nodeA, nodeB) => {
          if (nodeA.data!.addressDecimal < nodeB.data!.addressDecimal) {
            return -1;
          } else if (nodeA.data!.addressDecimal > nodeB.data!.addressDecimal) {
            return 1;
          } else {
            return 0;
          }
        },
      },
      {
        headerName: 'Level',
        field: 'level',
        cellDataType: 'number',
        width: 102,
        headerTooltip: 'Address rarity level',
      },
      {
        headerName: 'Active',
        field: 'active',
        hide: true,
      },
    ],
    rowData: [],
    onGridReady: event => {
      this.gridApi.set(event.api);
    },
    onGridPreDestroyed: () => {
      this.requestsCancelled$.next();
      this.gridApi.set(undefined);
    },
    getRowId: params => {
      return params.data.privateKey;
    },
    getRowStyle: params => {
      if (params.data!.active) {
        return {
          background: '#22f703',
          color: 'black',
        };
      } else {
        return undefined;
      }
    },
    onModelUpdated: event => {
      this.displayedRowCount.set(event.api.getDisplayedRowCount());
    },
    isExternalFilterPresent: () => {
      return this.showOnlyActiveAccounts();
    },
    doesExternalFilterPass: node => {
      return node.data!.active;
    },
    onFirstDataRendered: event => {
      if (window.innerWidth > 1500) {
        event.api.setGridOption('alwaysShowVerticalScroll', true);
        event.api.sizeColumnsToFit();
      }
    },
  };
  //#endregion

  //#region Row Lifecycle Management

  // Keeps track of row insertion order to support eviction of oldest entries
  private readonly rowIdList = new DoublyLinkedList<string>();

  // Tracks row IDs to avoid inserting duplicates
  private readonly rowIdSet = new Set<string>();
  //#endregion

  //#region Analytics Configuration
  private readonly significantBalanceThreshold = BigInt('100000000000000000');
  //#endregion

  //#region Reactive Stream Management

  /**
   * Observable version of the networkEnabled input property.
   * Used to reactively respond to network connectivity changes.
   */
  private readonly networkEnabled$ = toObservable(this.networkEnabled);

  /**
   * Subject used to cancel in-flight network requests when:
   * - The grid is cleared (via user action)
   * - The component is being destroyed
   * This prevents memory leaks and unnecessary network calls.
   */
  private readonly requestsCancelled$ = new Subject<void>();
  //#endregion

  constructor(
    private txBalanceService: TxBalanceService,
    private analyticsService: AnalyticsService,
    destroyRef: DestroyRef,
  ) {
    //#region Extend grid with dynamic columns
    this.gridOptions.columnDefs!.push(...this.generateDynamicChainRelatedColumns());
    //#endregion

    //#region Resize grid
    afterNextRender(() => {
      this.resizeGrid();

      const resizeObserver = new ResizeObserver(() => this.resizeGrid());
      resizeObserver.observe(document.body);

      destroyRef.onDestroy(() => {
        resizeObserver?.disconnect();
      });
    });
    //#endregion

    //#region Apply active accounts filter
    effect(() => {
      this.showOnlyActiveAccounts();
      untracked(this.gridApi)?.onFilterChanged();
    });
    //#endregion

    //#region Update cell formatting when the currency unit is changed
    effect(() => {
      this.gridOptions.context.selectedCurrencyUnit = this.selectedCurrencyUnit();
      untracked(this.gridApi)?.refreshCells();
    });
    //#endregion

    //#region Add a new row to the grid
    effect(() => {
      const gridApi = this.gridApi();
      const account = this.ethAccount();

      //#region Exit if the row cannot be added
      if (
        gridApi === undefined ||
        account === undefined ||
        !account.isValid ||
        this.rowIdSet.has(account.privateKeyHex)
      ) {
        return;
      }
      //#endregion

      //#region Track row to prevent duplicate entries
      this.rowIdSet.add(account.privateKeyHex);
      //#endregion

      untracked(() => {
        //#region Construct row
        const row: GridRow = {
          privateKey: account.privateKeyHex,
          privateKeyDecimal: account.privateKey,
          address: account.address,
          addressDecimal: BigInt(account.address),
          level: account.addressLeadingBitsCount,
          active: false,
        };
        //#endregion

        //#region Send txCount and balance requests
        const rowAdded$ = new ReplaySubject<void>(1);

        for (const chain of chains) {
          if (chain.region !== 'mainnet') {
            continue;
          }

          const txCount$ = this.txBalanceService
            .getTxCount(chain.chainId, account.address)
            .pipe(shareReplay({ bufferSize: 1, refCount: true }));

          const balance$ = txCount$.pipe(
            concatMap(txCount => {
              if (txCount == 0) {
                return of(BigInt(0));
              } else {
                return this.txBalanceService.getBalance(chain.chainId, account.address).pipe(
                  tap({
                    next: balance => {
                      // Track addresses with significant balances for analytics
                      if (balance > this.significantBalanceThreshold) {
                        this.analyticsService.trackEvent('oofy', {
                          chainId: chain.chainId,
                          address: account.address,
                          balance: formatUnits(balance, 18),
                        });
                      }
                    },
                  }),
                );
              }
            }),
          );

          //TODO: Remove subscriptions when a row is removed from the grid
          this.networkEnabled$
            .pipe(
              filter(Boolean),
              first(),
              switchMap(() => txCount$),
              switchMap(it => rowAdded$.pipe(map(() => it))),
              takeUntil(this.requestsCancelled$),
            )
            .subscribe(txCount => {
              if (txCount > 0) row.active = true;
              row[`txCount${chain.chainId}`] = txCount;
              gridApi.applyTransactionAsync({ update: [row] });
            });

          this.networkEnabled$
            .pipe(
              filter(Boolean),
              first(),
              switchMap(() => balance$),
              switchMap(it => rowAdded$.pipe(map(() => it))),
              takeUntil(this.requestsCancelled$),
            )
            .subscribe(balance => {
              if (balance > 0) row.active = true;
              row[`balance${chain.chainId}`] = balance;
              gridApi.applyTransactionAsync({ update: [row] });
            });
        }
        //#endregion

        //#region Send the row to the grid
        gridApi.applyTransactionAsync(
          {
            add: [row],
            addIndex: 0,
          },
          () => {
            //#region Send rowAdded event
            // Columns will be updated only when the row is added to the grid
            rowAdded$.next();
            rowAdded$.complete();
            //#endregion

            //#region Update total generated row count metadata
            this.totalGeneratedRowCount.update(it => it + 1);
            //#endregion

            //#region Track inserted row for further removal
            this.rowIdList.insertLast(row.privateKey);
            //#endregion

            //#region Get total number of rows in the grid
            const totalRowCount = this.rowIdList.count();
            //#endregion

            //#region Exit if the total row count does not exceed the maximum allowed grid rows
            if (totalRowCount <= this.maxRowCount()) {
              return;
            }
            //#endregion

            //#region Remove the oldest row if needed

            //#region Find a row to remove
            const filterPresent = gridApi.isAnyFilterPresent();

            const rowIdToRemove = this.rowIdList.find(node => {
              const rowId = node.getValue();
              const rowNode = gridApi.getRowNode(rowId);

              if (rowNode === undefined) {
                return false;
              }

              const keep = rowNode.data!.active || (filterPresent && rowNode.displayed);

              return !keep;
            });
            //#endregion

            //#region Exit if there is no suitable row to remove
            if (rowIdToRemove === null) {
              return;
            }
            //#endregion

            //#region Remove the row from the tracking list
            this.rowIdList.remove(rowIdToRemove);
            //#endregion

            //#region Remove the row from the grid
            gridApi.applyTransactionAsync(
              {
                remove: [
                  // Only id is needed for removal
                  { privateKey: rowIdToRemove.getValue() } as any, // eslint-disable-line
                ],
              },
              () => {
                // Allow this row to be added to the grid again
                this.rowIdSet.delete(rowIdToRemove.getValue());
              },
            );
            //#endregion

            //#endregion
          },
        );
        //#endregion
      });
    });
    //#endregion
  }

  //#region User Event Handlers
  clearAllClick() {
    this.rowIdList.clear();
    this.rowIdSet.clear();
    this.requestsCancelled$.next();
    this.gridApi()?.setGridOption('rowData', []);

    this.analyticsService.trackEvent('eth_addr_history_clear_all');
  }

  autoFitClick() {
    this.gridApi()?.sizeColumnsToFit();
    this.analyticsService.trackEvent('eth_addr_history_auto_fit');
  }

  autoSizeClick() {
    this.gridApi()?.autoSizeAllColumns(false);
    this.analyticsService.trackEvent('eth_addr_history_auto_size');
  }

  downloadClick() {
    this.gridApi()?.exportDataAsCsv();
    this.analyticsService.trackEvent('eth_addr_history_download_csv');
  }

  viewSourceCodeClick() {
    this.analyticsService.trackEvent('eth_addr_history_view_source_code');
    window.open(environment.sourceCodeRepositoryUrl, '_blank');
  }
  //#endregion

  //#region Grid Height Management
  private resizeGrid() {
    const grid = this.agGridRef().nativeElement as HTMLElement;
    const rect = grid.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const newHeight = Math.max(220, window.innerHeight - top - 18);
    grid.style.height = `${newHeight}px`;
  }
  //#endregion

  //#region Grid Utility Methods
  private generateDynamicChainRelatedColumns(): ColGroupDef[] {
    return chains
      .filter(chain => chain.region === 'mainnet')
      .map(chain => {
        const onCellDoubleClicked = (event: CellDoubleClickedEvent) => {
          const url = `${chain.blockExplorerUrl}/address/${event.data.address}`;
          window.open(url, '_blank');

          this.analyticsService.trackEvent('eth_addr_history_explore_address', {
            chainId: chain.chainId,
            address: event.data.address,
          });
        };

        return {
          headerName: chain.name,
          children: [
            {
              headerName: 'TX',
              field: `txCount${chain.chainId}`,
              filter: false,
              width: 70,
              onCellDoubleClicked,
              valueFormatter: params => {
                if (params.value === undefined) {
                  return '-';
                } else {
                  return params.value;
                }
              },
            },
            {
              headerName: chain.currency,
              field: `balance${chain.chainId}`,
              filter: false,
              width: 70,
              onCellDoubleClicked,
              valueFormatter: params => {
                if (params.value === undefined) {
                  return '-';
                } else {
                  if (params.value === 0n) {
                    return params.value;
                  } else {
                    return formatUnits(params.value, params.context.selectedCurrencyUnit);
                  }
                }
              },
            },
          ],
        };
      });
  }
  //#endregion
}

//#region Component Type Definitions
export interface CurrencyUnit {
  name: string;
  value: number;
}

interface GridRow {
  privateKey: string;
  privateKeyDecimal: bigint;
  address: string;
  addressDecimal: bigint;
  level: number;
  active: boolean;
  [key: `txCount${number}`]: Observable<number> | number;
  [key: `balance${number}`]: Observable<bigint> | bigint;
}
//#endregion
