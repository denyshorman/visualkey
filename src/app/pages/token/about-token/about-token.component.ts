import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChainsService } from '../../../services/chains.service';
import { base, hardhat, sepolia } from 'viem/chains';
import { environment } from '../../../../environments/environment';
import {
  BASE_VISUAL_KEY_TOKEN_ADDRESS,
  HARDHAT_VISUAL_KEY_TOKEN_ADDRESS,
  SEPOLIA_VISUAL_KEY_TOKEN_ADDRESS,
} from '../../../services/token-contract.service';

@Component({
  selector: 'app-about-token',
  imports: [RouterLink],
  templateUrl: './about-token.component.html',
})
export class AboutTokenComponent {
  readonly contracts;

  constructor(private chainsService: ChainsService) {
    this.contracts = [
      {
        chainId: base.id,
        chainName: base.name,
        contractAddress: BASE_VISUAL_KEY_TOKEN_ADDRESS,
        explorerUrl: `${chainsService.getChain(base.id)?.blockExplorerUrl}/address/${BASE_VISUAL_KEY_TOKEN_ADDRESS}`,
      },
      {
        chainId: sepolia.id,
        chainName: sepolia.name,
        contractAddress: SEPOLIA_VISUAL_KEY_TOKEN_ADDRESS,
        explorerUrl: `${chainsService.getChain(sepolia.id)?.blockExplorerUrl}/address/${SEPOLIA_VISUAL_KEY_TOKEN_ADDRESS}`,
      },
      ...this.hardhatContract(),
    ];
  }

  private hardhatContract() {
    if (environment.production) {
      return [];
    }

    return [
      {
        chainId: hardhat.id,
        chainName: hardhat.name,
        contractAddress: HARDHAT_VISUAL_KEY_TOKEN_ADDRESS,
        explorerUrl: `${this.chainsService.getChain(hardhat.id)?.blockExplorerUrl}/address/${HARDHAT_VISUAL_KEY_TOKEN_ADDRESS}`,
      },
    ];
  }
}
