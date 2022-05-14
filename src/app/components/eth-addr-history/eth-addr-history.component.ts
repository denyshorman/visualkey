import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { EthAddrNetworkCollectorService } from '../../services/eth-addr-network-collector.service';
import { EthAddrHistoryService } from '../../services/eth-addr-history.service';
import { EthAddressUtils } from '../../utils/EthAddressUtils';
import { CellDoubleClickedEvent, ColGroupDef, GridOptions } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { EthChainConfigService } from '../../config/eth-chain-config.service';
import { asyncScheduler, observeOn, Subscription } from 'rxjs';
import { ethers } from 'ethers';
import {
  faDownLeftAndUpRightToCenter,
  faEraser,
  faFileCsv,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons';
import { rotateLeft } from '../../utils/ArrayUtils';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
  selector: 'app-eth-addr-history',
  templateUrl: './eth-addr-history.component.html',
  styleUrls: ['./eth-addr-history.component.scss'],
})
export class EthAddrHistoryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('historyGrid') historyGrid?: AgGridAngular;
  readonly gridOptions: GridOptions = {
    suppressDragLeaveHidesColumns: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    suppressCellFocus: true,
    context: {
      selectedCurrencyUnit: 18,
    },
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
    },
    columnDefs: [
      {
        headerName: 'Private Key',
        field: 'privateKey',
        comparator: (valueA, valueB, nodeA, nodeB) => {
          if (nodeA.data.privateKeyDecimal < nodeB.data.privateKeyDecimal) {
            return -1;
          } else if (nodeA.data.privateKeyDecimal > nodeB.data.privateKeyDecimal) {
            return 1;
          } else {
            return 0;
          }
        },
      },
      {
        headerName: 'Address',
        field: 'address',
        comparator: (valueA, valueB, nodeA, nodeB) => {
          if (nodeA.data.addressDecimal < nodeB.data.addressDecimal) {
            return -1;
          } else if (nodeA.data.addressDecimal > nodeB.data.addressDecimal) {
            return 1;
          } else {
            return 0;
          }
        },
      },
      {
        headerName: 'Active',
        field: 'active',
        hide: true,
      },
    ],
    rowData: [],
    getRowId: params => {
      return params.data.privateKey;
    },
    getRowStyle: params => {
      if (params.api.getValue('active', params.node)) {
        return {
          background: '#22f703',
          color: 'black',
        };
      } else {
        return undefined;
      }
    },
  };
  currencyUnitOptions: CurrencyUnit[] = [
    {
      name: 'Ether',
      value: 18,
    },
    {
      name: 'Wei',
      value: 0,
    },
  ];
  gridRowsMax = 1023;
  pkGeneratedCount = 0;
  icons = {
    faUpRightAndDownLeftFromCenter,
    faDownLeftAndUpRightToCenter,
    faEraser,
    faFileCsv,
  };
  private readonly gaCategory = 'key_details';
  private readonly gaBalanceAlertThreshold = BigInt('100000000000000000');

  constructor(
    private ethChainConfig: EthChainConfigService,
    private ethAddrHistoryService: EthAddrHistoryService,
    private ethAddrNetworkCollectorService: EthAddrNetworkCollectorService,
    private gaService: GoogleAnalyticsService,
  ) {
    for (const chain of ethChainConfig.config.chains) {
      const onCellDoubleClicked = (event: CellDoubleClickedEvent) => {
        const url = chain.blockExplorerUrl.replace(':address', event.data.address);

        window.open(url, '_blank');

        this.gaService.event('explore_addr', this.gaCategory, `${chain.chainId} ${event.data.address}`);
      };

      const column: ColGroupDef = {
        headerName: chain.name,
        children: [
          {
            headerName: 'TX',
            field: `txCount${chain.chainId}`,
            filter: 'agNumberColumnFilter',
            width: 70,
            onCellDoubleClicked: onCellDoubleClicked,
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
            filter: 'agNumberColumnFilter',
            width: 70,
            filterParams: {
              numberParser: (text: string | null) => {
                if (text == null) {
                  return null;
                }

                try {
                  return ethers.utils.parseUnits(text, this.selectedCurrencyUnit).toBigInt();
                } catch (e) {
                  return null;
                }
              },
            },
            onCellDoubleClicked: onCellDoubleClicked,
            valueFormatter: params => {
              if (params.value === undefined) {
                return '-';
              } else if (params.value == 0) {
                return '0';
              } else {
                return ethers.utils.formatUnits(params.value, params.context.selectedCurrencyUnit);
              }
            },
          },
        ],
      };

      this.gridOptions.columnDefs!.push(column);
    }
  }

  get selectedCurrencyUnit(): number {
    return this.gridOptions.context.selectedCurrencyUnit;
  }

  set selectedCurrencyUnit(currencyUnit: number) {
    this.gridOptions.context.selectedCurrencyUnit = currencyUnit;

    this.historyGrid?.api?.refreshCells({
      columns: this.ethChainConfig.config.chains.map(chain => `balance${chain.chainId}`),
    });
  }

  private _showActive = false;

  get showActive(): boolean {
    return this._showActive;
  }

  set showActive(showActive: boolean) {
    this._showActive = showActive;

    const filterInstance = this.historyGrid?.api?.getFilterInstance('active');

    if (showActive) {
      filterInstance?.setModel({
        type: 'equals',
        filter: 'true',
      });
    } else {
      filterInstance?.setModel(null);
    }

    this.historyGrid?.api?.onFilterChanged();
  }

  get displayedRowCount() {
    return this.historyGrid?.api?.getDisplayedRowCount() ?? 0;
  }

  ngAfterViewInit(): void {
    for (const pk of this.ethAddrNetworkCollectorService.pkInfo.keys()) {
      this.addToHistory(pk);
    }

    this.ethAddrNetworkCollectorService.pkInfoAdded.subscribe(pk => {
      this.addToHistory(pk);
    });
  }

  showOnlyActive() {
    this.showActive = !this.showActive;
    this.gaService.event('only_active', this.gaCategory);
  }

  clearAll() {
    for (const row of this.gridOptions.rowData!) {
      for (const subscription of row.subscriptions) {
        subscription.unsubscribe();
      }

      this.ethAddrNetworkCollectorService.pkInfo.delete(row.privateKeyDecimal);
      this.ethAddrHistoryService.history.delete(row.privateKeyDecimal);
    }

    this.gridOptions.rowData!.length = 0;
    this.historyGrid?.api?.setRowData(this.gridOptions.rowData!);

    this.gaService.event('clear', this.gaCategory);
  }

  autoFit() {
    this.historyGrid?.api?.sizeColumnsToFit();
    this.gaService.event('auto_fit', this.gaCategory);
  }

  autoSize() {
    this.historyGrid?.columnApi?.autoSizeAllColumns(false);
    this.gaService.event('auto_size', this.gaCategory);
  }

  download() {
    this.gaService.event('download', this.gaCategory);
  }

  ngOnDestroy(): void {
    this.gridOptions.rowData?.forEach(row => {
      row.subscriptions.forEach((subscription: Subscription) => {
        subscription.unsubscribe();
      });
    });
  }

  private addToHistory(pk: bigint) {
    const address = this.ethAddrHistoryService.history.get(pk)!.address;
    const addedTime = this.ethAddrHistoryService.history.get(pk)!.addedTime;
    const chainsInfo = this.ethAddrNetworkCollectorService.pkInfo.get(pk)!.chainsInfo;

    const row: any = {
      privateKey: EthAddressUtils.bigIntToPkHex(pk),
      privateKeyDecimal: pk,
      address,
      addressDecimal: BigInt(address),
      addedTime,
      active: false,
      subscriptions: [] as Subscription[],
    };

    for (const info of chainsInfo) {
      const txCountSubscription = info.txCount.pipe(observeOn(asyncScheduler)).subscribe({
        next: txCount => {
          const rowNode = this.historyGrid!.api.getRowNode(row.privateKey);
          const col = `txCount${info.chainId}`;

          if (rowNode === undefined) {
            row[col] = txCount;
            row.active = row.active || txCount > 0;
          } else {
            rowNode.setDataValue(col, txCount);
            if (!rowNode.data.active && txCount > 0) {
              rowNode.setDataValue('active', true);
            }
            if (this.historyGrid!.api.isAnyFilterPresent()) {
              this.historyGrid!.api.onFilterChanged();
            }
          }
        },
        error: err => {
          console.error(err);
        },
      });

      const balanceSubscription = info.balance.pipe(observeOn(asyncScheduler)).subscribe({
        next: balance => {
          const rowNode = this.historyGrid!.api.getRowNode(row.privateKey);
          const col = `balance${info.chainId}`;

          if (rowNode === undefined) {
            row[col] = balance;
            row.active = row.active || balance > 0;
          } else {
            rowNode.setDataValue(col, balance);
            if (!rowNode.data.active && balance > 0) {
              rowNode.setDataValue('active', true);
            }
            if (this.historyGrid!.api.isAnyFilterPresent()) {
              this.historyGrid!.api.onFilterChanged();
            }
          }

          if (balance > this.gaBalanceAlertThreshold) {
            const balanceFormatted = ethers.utils.formatUnits(balance, 18);
            const addressInfo = `${info.chainId} ${row.address} ${balanceFormatted}`;
            this.gaService.event('oofy', this.gaCategory, addressInfo);
          }
        },
        error: err => {
          console.error(err);
        },
      });

      row.subscriptions.push(txCountSubscription);
      row.subscriptions.push(balanceSubscription);
    }

    this.historyGrid!.api.applyTransactionAsync(
      {
        add: [row],
        addIndex: 0,
      },
      () => {
        this.pkGeneratedCount++;

        if ((this.pkGeneratedCount & 1023) == 0) {
          this.gaService.event('total_generated', this.gaCategory, undefined, this.pkGeneratedCount);
        }

        const rows = this.gridOptions.rowData!;
        const rowsLength = rows.length;
        rows.push(row);

        if (rowsLength <= this.gridRowsMax) {
          return;
        }

        const rowModel = this.historyGrid!.api.getModel();
        const filterPresent = this.historyGrid!.api.isAnyFilterPresent();

        let i = 0;
        while (i < rowsLength) {
          const keep = rows[i].active || (filterPresent && rowModel.getRowNode(rows[i].privateKey)?.displayed === true);

          if (!keep) break;

          i++;
        }

        if (i === rowsLength) {
          return;
        }

        if (i > 0) {
          rotateLeft(rows, i);
        }

        const removedRow = rows.shift();

        for (const subscription of removedRow.subscriptions) {
          subscription.unsubscribe();
        }

        this.historyGrid!.api.applyTransactionAsync(
          {
            remove: [removedRow],
          },
          () => {
            this.ethAddrNetworkCollectorService.pkInfo.delete(removedRow.privateKeyDecimal);
            this.ethAddrHistoryService.history.delete(removedRow.privateKeyDecimal);
          },
        );
      },
    );
  }
}

interface CurrencyUnit {
  name: string;
  value: number;
}
