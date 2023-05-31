import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TokenContractChain, VisualKeyContractService } from '../../../services/visual-key-contract.service';
import { ChainRegion } from '../../../config/chains-config.service';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-nft-list',
  templateUrl: './nft-list.component.html',
  styleUrls: [],
})
export class NftListComponent implements OnInit, OnDestroy {
  @Input({ required: false }) address?: string;
  @Input({ required: true }) region!: ChainRegion;

  tokens: TokenOwnerContractChain[] = [];
  tokensSubscription = Subscription.EMPTY;

  constructor(private visualKeyContractService: VisualKeyContractService) {}

  ngOnInit() {
    if (this.address === undefined) {
      this.tokensSubscription = this.visualKeyContractService
        .tokensByRegion(this.region)
        .pipe(
          mergeMap(token => {
            return this.visualKeyContractService
              .ownerOfTokenInContract(token.chainId, token.contract, token.token)
              .pipe(
                map(owner => {
                  return { token, owner };
                }),
              );
          }),
          filter(token => token.owner !== undefined),
        )
        .subscribe(token => {
          this.tokens.push(token as TokenOwnerContractChain);
        });
    } else {
      this.tokensSubscription = this.visualKeyContractService
        .tokensByOwnerAndRegion(this.address, this.region)
        .subscribe(token => {
          this.tokens.push({ owner: this.address!, token });
        });
    }
  }

  ngOnDestroy() {
    this.tokensSubscription.unsubscribe();
  }
}

interface TokenOwnerContractChain {
  token: TokenContractChain;
  owner: string;
}
