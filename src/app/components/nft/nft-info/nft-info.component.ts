import { Component, input, model } from '@angular/core';
import { BigIntToEthAddressPipe } from '../../../pipes/big-int-to-eth-address.pipe';
import { BitSetComponent } from '../../bit-set/bit-set.component';
import { InternationalDateTimePipe } from '../../../pipes/international-date-time.pipe';
import { NftIncreasablePowerComponent } from '../nft-increasable-power/nft-increasable-power.component';
import { EtherTxStatusComponent } from '../../ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-nft-info',
  imports: [
    BigIntToEthAddressPipe,
    BitSetComponent,
    InternationalDateTimePipe,
    NftIncreasablePowerComponent,
    EtherTxStatusComponent,
  ],
  host: {
    class: 'flex flex-col p-4 sm:p-5 border-2 border-neutral-300  dark:border-neutral-800 dark:bg-neutral-900 rounded-lg',
  },
  template: `
    <app-bit-set
      [bitCount]="160"
      [gridCols]="16"
      [bitSet]="tokenId()"
      [bitCellSize]="bitCellSize()"
      [readOnly]="true"
      class="self-center"
    />
    <div class="mt-5 flex flex-col gap-2 overflow-auto whitespace-nowrap scrollbar-none text-sm md:text-base">
      <div class="flex flex-row items-baseline">
        <div class="font-bold select-none">ID:</div>
        <div class="ml-2 grow">{{ tokenId() | bigIntToEthAddress }}</div>
      </div>
      <div class="flex flex-row items-baseline">
        <div class="font-bold select-none">Owner:</div>
        <div class="ml-2 grow">{{ owner() }}</div>
      </div>
      <div class="flex flex-row items-baseline">
        <div class="font-bold select-none">Level:</div>
        <div class="ml-2 grow">{{ level() }}</div>
      </div>
      <div class="flex flex-row items-baseline">
        <div class="font-bold select-none">Power:</div>
        <div class="ml-2 grow">
          <app-nft-increasable-power [tokenId]="tokenId()" [(power)]="power" [txStatus]="txStatus"></app-nft-increasable-power>
        </div>
      </div>
      <div class="flex flex-row items-baseline">
        <div class="font-bold select-none">Creation date:</div>
        <div class="ml-2 grow">{{ createdAt() | internationalDateTime }}</div>
      </div>
    </div>

    <app-ether-tx-status #txStatus class="mt-3" />
  `,
})
export class NftInfoComponent {
  readonly tokenId = input.required<bigint>();
  readonly owner = input.required<string>();
  readonly level = input.required<number>();
  readonly power = model.required<bigint>();
  readonly createdAt = input.required<bigint>();
  readonly bitCellSize = input.required<number>();
}
