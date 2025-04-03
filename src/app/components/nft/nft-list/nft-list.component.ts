import { Component, input } from '@angular/core';
import { TokenContractChain, VisualKeyContractService } from '../../../services/visual-key-contract.service';
import { ChainRegion } from '../../../config/chains-config.service';
import { filter, map, mergeMap, toArray } from 'rxjs/operators';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-nft-list',
  templateUrl: './nft-list.component.html',
})
export class NftListComponent {
  readonly address = input<string>();
  readonly region = input.required<ChainRegion>();

  readonly tokens = rxResource({
    request: () => {
      return {
        address: this.address(),
        region: this.region(),
      };
    },
    loader: ({ request }) => {
      const { address, region } = request;

      if (address === undefined) {
        return this.visualKeyContractService.tokensByRegion(region).pipe(
          mergeMap(token => {
            return this.visualKeyContractService
              .ownerOfTokenInContract(token.chainId, token.contract, token.token)
              .pipe(
                map(owner => {
                  return { token, owner } as TokenOwnerContractChain;
                }),
              );
          }),
          filter(token => token.owner !== undefined),
          toArray(),
        );
      } else {
        return this.visualKeyContractService.tokensByOwnerAndRegion(address, region).pipe(
          map(token => ({ owner: address, token })),
          toArray(),
        );
      }
    },
  });

  constructor(private visualKeyContractService: VisualKeyContractService) {}
}

interface TokenOwnerContractChain {
  token: TokenContractChain;
  owner: string;
}
