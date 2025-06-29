import { Component, computed, effect, input, model, output, untracked } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { Tooltip } from 'primeng/tooltip';
import { environment } from '../../../../environments/environment';
import {
  faCode,
  faDownLeftAndUpRightToCenter,
  faDownload,
  faTrashCan,
  faUpRightAndDownLeftFromCenter,
  faWifi,
} from '@fortawesome/free-solid-svg-icons';
import { CurrencyUnit } from './eth-addr-history.component';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { EthAccount } from '../../../models/eth-account';

@Component({
  selector: 'app-eth-addr-history-grid-header',
  imports: [FaIconComponent, FormsModule, Tooltip, Button, Select, NgClass],
  host: {
    class: 'flex justify-between gap-1 overflow-auto scrollbar-none',
  },
  template: `
    <div class="flex gap-1">
      <p-button
        variant="outlined"
        severity="secondary"
        size="small"
        class="shrink-0"
        styleClass="select-none leading-0 h-9 dark:font-semibold capitalize"
        (click)="toggleActive()"
      >
        <span [ngClass]="{ 'uppercase text-pink-600 font-bold dark:text-yellow-400': showOnlyActiveAccounts() }">
          Only active
        </span>
      </p-button>
      <p-button
        variant="outlined"
        severity="secondary"
        size="small"
        styleClass="h-9 w-24 select-none leading-0 tracking-wider font-bold"
        pTooltip="Mint this Ethereum address {{ethAccountValid() ? 'with rarity level ' + ethAccount()!.addressLeadingBitsCount : ''}} as an NFT"
        tooltipPosition="top"
        [showDelay]="700"
        [disabled]="!ethAccountValid()"
        (click)="mint()"
      >
        NFT
        @if (ethAccountValid()) {
          L{{ ethAccount()!.addressLeadingBitsCount }}
        }
      </p-button>
      <p-select
        class="shrink-0 hidden md:[display:inherit]"
        appendTo="body"
        size="small"
        id="currencyUnitOptions"
        styleClass="h-9"
        [options]="currencyUnitOptions()"
        [(ngModel)]="selectedCurrencyUnit"
        optionLabel="name"
        optionValue="value"
        pTooltip="Balance formatting"
        tooltipPosition="top"
        [showDelay]="500"
      />
      <p-button
        (click)="clearAllClick.emit()"
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
        (click)="autoFitClick.emit()"
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
        (click)="autoSizeClick.emit()"
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
        (click)="downloadClick.emit()"
        pTooltip="Export"
        tooltipPosition="top"
        [showDelay]="500"
      >
        <fa-icon [icon]="icons.faDownload"></fa-icon>
      </p-button>
      @if (!prodEnvironment) {
        <p-button
          variant="outlined"
          severity="secondary"
          size="small"
          styleClass="select-none leading-0 h-9 w-9"
          (click)="toggleNetwork()"
          [pTooltip]="networkEnabled() ? 'Network enabled' : 'Network disabled'"
          tooltipPosition="top"
          [showDelay]="500"
        >
          <fa-icon [icon]="icons.faWifi" [class.text-red-500]="!networkEnabled()"></fa-icon>
        </p-button>
      }
      <p-button
        variant="outlined"
        severity="secondary"
        size="small"
        class="shrink-0"
        styleClass="select-none leading-0 h-9 cursor-default hover:bg-(--p-button-outlined-secondary-background)"
        pTooltip="Displayed/Generated"
        tooltipPosition="top"
        [showDelay]="800"
      >
        {{ displayedRowCount() }}/{{ totalGeneratedRowCount() }}
      </p-button>
    </div>
    <div class="hidden sm:flex gap-1">
      <p-button
        variant="outlined"
        severity="secondary"
        size="small"
        link="true"
        styleClass="h-9 select-none"
        (click)="viewSourceCodeClick.emit()"
      >
        <fa-icon [icon]="icons.faCode"></fa-icon>
        <span>Source code</span>
      </p-button>
    </div>
  `,
})
export class EthAddrHistoryGridHeaderComponent {
  readonly prodEnvironment = environment.production;

  readonly icons = {
    faUpRightAndDownLeftFromCenter,
    faDownLeftAndUpRightToCenter,
    faTrashCan,
    faDownload,
    faCode,
    faWifi,
  };

  readonly ethAccount = input<EthAccount>();
  readonly currencyUnitOptions = input.required<CurrencyUnit[]>();
  readonly selectedCurrencyUnit = model<number>();
  readonly showOnlyActiveAccounts = model(false);
  readonly displayedRowCount = input(0);
  readonly totalGeneratedRowCount = input(0);
  readonly networkEnabled = model(true);
  readonly clearAllClick = output<void>();
  readonly autoFitClick = output<void>();
  readonly autoSizeClick = output<void>();
  readonly downloadClick = output<void>();
  readonly viewSourceCodeClick = output<void>();

  readonly ethAccountValid = computed(() => {
    const account = this.ethAccount();
    return account !== undefined && account.isValid;
  });

  constructor(private router: Router) {
    effect(() => {
      const currencyUnitOptions = this.currencyUnitOptions();
      const selectedCurrencyUnit = untracked(this.selectedCurrencyUnit);

      if (
        selectedCurrencyUnit === undefined ||
        !currencyUnitOptions.some(option => option.value === selectedCurrencyUnit)
      ) {
        this.selectedCurrencyUnit.set(currencyUnitOptions[0].value);
      }
    });
  }

  mint() {
    const privateKey = this.ethAccount()?.privateKeyHex;
    const address = this.ethAccount()?.address;

    if (privateKey === undefined || address === undefined) {
      return;
    }

    sessionStorage.setItem('mintNftPrivateKey', privateKey);

    this.router.navigate(['/nft/mint', address]);
  }

  toggleActive() {
    this.showOnlyActiveAccounts.update(v => !v);
  }

  toggleNetwork() {
    this.networkEnabled.update(v => !v);
  }
}
