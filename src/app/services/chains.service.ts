import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ChainsService {
  private chainIdChainMap: Map<number, Chain>;

  constructor() {
    this.chainIdChainMap = new Map<number, Chain>();

    chains.forEach(chain => {
      this.chainIdChainMap.set(chain.chainId, chain);
    });
  }

  getChain(id: number): Chain | undefined {
    return this.chainIdChainMap.get(id);
  }
}

//#region Chains
export const chains: Chain[] = [
  {
    chainId: 1,
    region: 'mainnet',
    name: 'Ethereum',
    currency: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    rpcUrls: [
      'https://rpc.flashbots.net',
      'https://ethereum.publicnode.com',
      'https://eth.drpc.org',
      'https://1rpc.io/eth',
      'https://0xrpc.io/eth',
      'https://rpc.payload.de',
      'https://eth.llamarpc.com',
    ],
  },
  {
    chainId: 8453,
    region: 'mainnet',
    name: 'Base',
    currency: 'ETH',
    blockExplorerUrl: 'https://basescan.org',
    rpcUrls: [
      'https://1rpc.io/base',
      'https://base-rpc.publicnode.com',
      'https://base.drpc.org',
      'https://base.meowrpc.com',
      'https://base-pokt.nodies.app',
      'https://base.llamarpc.com',
      'https://endpoints.omniatech.io/v1/base/mainnet/public',
      'https://mainnet.base.org',
    ],
  },
  {
    chainId: 42161,
    region: 'mainnet',
    name: 'Arbitrum One',
    currency: 'ETH',
    blockExplorerUrl: 'https://arbiscan.io',
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
      'https://1rpc.io/arb',
      'https://arb-pokt.nodies.app',
      'https://arbitrum.blockpi.network/v1/rpc/public',
      'https://arbitrum-one.public.blastapi.io',
      'https://arbitrum-one-rpc.publicnode.com',
      'https://arbitrum.meowrpc.com',
      'https://arbitrum.drpc.org',
      'https://arbitrum.llamarpc.com',
    ],
  },
  {
    chainId: 137,
    region: 'mainnet',
    name: 'Polygon',
    currency: 'POL',
    blockExplorerUrl: 'https://polygonscan.com',
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.quiknode.pro',
      'https://rpc.ankr.com/polygon',
      'https://polygon.drpc.org',
      'https://polygon-bor-rpc.publicnode.com',
      'https://1rpc.io/matic',
      'https://polygon.llamarpc.com',
    ],
  },
  {
    chainId: 56,
    region: 'mainnet',
    name: 'BNB Chain',
    currency: 'BNB',
    blockExplorerUrl: 'https://bscscan.com',
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed1.ninicoin.io',
      'https://bsc-dataseed2.defibit.io',
      'https://bsc-dataseed3.defibit.io',
      'https://bsc-dataseed4.defibit.io',
      'https://bsc-dataseed2.ninicoin.io',
      'https://bsc-dataseed3.ninicoin.io',
      'https://bsc-dataseed4.ninicoin.io',
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org',
      'https://bsc-dataseed4.binance.org',
      'https://bsc-dataseed.nariox.org',
      'https://bsc-dataseed.bnbchain.org',
      'https://bsc-mainnet.gateway.pokt.network',
      'https://rpc.ankr.com/bsc',
      'https://binance.llamarpc.com',
    ],
  },
  {
    chainId: 130,
    region: 'mainnet',
    name: 'Unichain',
    currency: 'ETH',
    blockExplorerUrl: 'https://unichain.blockscout.com',
    rpcUrls: [
      'https://mainnet.unichain.org',
      'https://unichain.drpc.org',
      'https://unichain.api.onfinality.io/public',
      'https://unichain-rpc.publicnode.com',
      'https://0xrpc.io/uni',
      'https://rpc.therpc.io/unichain',
    ],
  },
  {
    chainId: 10,
    region: 'mainnet',
    name: 'OP Mainnet',
    currency: 'ETH',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://optimism.blockpi.network/v1/rpc/public',
      'https://optimism-mainnet.public.blastapi.io',
      'https://endpoints.omniatech.io/v1/op/mainnet/public',
      'https://rpc.ankr.com/optimism',
      'https://1rpc.io/op',
      'https://optimism.llamarpc.com',
      'https://op-pokt.nodies.app',
      'https://optimism-rpc.publicnode.com',
      'https://optimism.drpc.org',
    ],
  },
  {
    chainId: 43114,
    region: 'mainnet',
    name: 'Avalanche',
    currency: 'AVAX',
    blockExplorerUrl: 'https://snowtrace.io',
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avalanche.public-rpc.com',
      'https://rpc.ankr.com/avalanche',
      'https://avalanche-c-chain-rpc.publicnode.com',
      'https://1rpc.io/avax/c',
      'https://avax.meowrpc.com',
      'https://avalanche.drpc.org',
    ],
  },
  {
    chainId: 100,
    region: 'mainnet',
    name: 'Gnosis',
    currency: 'xDAI',
    blockExplorerUrl: 'https://blockscout.com/xdai/mainnet',
    rpcUrls: [
      'https://rpc.gnosischain.com',
      'https://rpc.ankr.com/gnosis',
      'https://gnosis.drpc.org',
      'https://gnosis-rpc.publicnode.com',
      'https://1rpc.io/gnosis',
    ],
  },
  {
    chainId: 25,
    region: 'mainnet',
    name: 'Cronos',
    currency: 'CRO',
    blockExplorerUrl: 'https://cronoscan.com',
    rpcUrls: [
      'https://evm.cronos.org',
      'https://evm-cronos.crypto.org',
      'https://cronos-evm-rpc.publicnode.com',
      'https://cronos.blockpi.network/v1/rpc/public',
      'https://1rpc.io/cro',
      'https://cronos.drpc.org',
    ],
  },
  {
    chainId: 42220,
    region: 'mainnet',
    name: 'Celo',
    currency: 'CELO',
    blockExplorerUrl: 'https://explorer.celo.org',
    rpcUrls: ['https://forno.celo.org', 'https://rpc.ankr.com/celo', 'https://1rpc.io/celo', 'https://celo.drpc.org'],
  },
  {
    chainId: 11155111,
    region: 'testnet',
    name: 'Ethereum Sepolia',
    currency: 'ETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    rpcUrls: [
      'https://eth-sepolia.public.blastapi.io',
      'https://sepolia.drpc.org',
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://1rpc.io/sepolia',
    ],
  },
  {
    chainId: 97,
    region: 'testnet',
    name: 'BNB Chain Testnet',
    currency: 'BNB',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    rpcUrls: [
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545',
      'https://data-seed-prebsc-1-s2.binance.org:8545',
      'https://data-seed-prebsc-2-s2.binance.org:8545',
      'https://data-seed-prebsc-1-s3.binance.org:8545',
      'https://data-seed-prebsc-2-s3.binance.org:8545',
      'https://bsc-testnet.public.blastapi.io',
      'https://bsc-testnet-rpc.publicnode.com',
    ],
  },
  {
    chainId: 31337,
    region: 'localnet',
    name: 'Hardhat',
    currency: 'ETH',
    blockExplorerUrl: 'http://localhost:10000',
    rpcUrls: ['http://localhost:8545', 'http://192.168.0.14:8545'],
  },
] as const;
//#endregion

//#region Models
export interface Chain {
  chainId: number;
  region: ChainRegion;
  name: string;
  currency: string;
  blockExplorerUrl: string;
  rpcUrls: string[];
}

export type ChainRegion = 'mainnet' | 'testnet' | 'localnet'
//#endregion
