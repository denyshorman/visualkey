import { Component } from '@angular/core';
import { ChainsService } from '../../../services/chains.service';
import { base, sepolia, hardhat } from 'viem/chains';
import { environment } from '../../../../environments/environment';
import {
  BASE_VISUAL_KEY_NFT_ADDRESS,
  HARDHAT_VISUAL_KEY_NFT_ADDRESS,
  SEPOLIA_VISUAL_KEY_NFT_ADDRESS,
} from '../../../services/nft-contract.service';

@Component({
  selector: 'app-about-nft',
  imports: [],
  templateUrl: './about-nft.component.html',
})
export class AboutNftComponent {
  readonly contracts;

  constructor(private chainsService: ChainsService) {
    this.contracts = [
      {
        chainId: base.id,
        chainName: base.name,
        contractAddress: BASE_VISUAL_KEY_NFT_ADDRESS,
        explorerUrl: `${chainsService.getChain(base.id)?.blockExplorerUrl}/address/${BASE_VISUAL_KEY_NFT_ADDRESS}`,
      },
      {
        chainId: sepolia.id,
        chainName: sepolia.name,
        contractAddress: SEPOLIA_VISUAL_KEY_NFT_ADDRESS,
        explorerUrl: `${chainsService.getChain(sepolia.id)?.blockExplorerUrl}/address/${SEPOLIA_VISUAL_KEY_NFT_ADDRESS}`,
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
        contractAddress: HARDHAT_VISUAL_KEY_NFT_ADDRESS,
        explorerUrl: `${this.chainsService.getChain(hardhat.id)?.blockExplorerUrl}/address/${HARDHAT_VISUAL_KEY_NFT_ADDRESS}`,
      },
    ];
  }
}
