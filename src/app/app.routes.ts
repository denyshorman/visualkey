import { Routes } from '@angular/router';
import { EthAddrGeneratorComponent } from './pages/eth-addr-generator/eth-addr-generator.component';
import { MintNftComponent } from './pages/nft/mint-nft/mint-nft.component';
import { NftComponent } from './pages/nft/nft.component';
import { ViewMyNftsComponent } from './pages/nft/view-my-nfts/view-my-nfts.component';
import { TokenComponent } from './pages/token/token.component';
import { ViewAllNftsComponent } from './pages/nft/view-all-nfts/view-all-nfts.component';
import { AcquireTokenComponent } from './pages/token/acquire-token/acquire-token.component';
import { BurnTokenComponent } from './pages/token/burn-token/burn-token.component';
import { ToolsComponent } from './pages/tools/tools.component';

export const routes: Routes = [
  {
    path: '',
    title: 'A Visual Ethereum Wallet Generator, Balance Checker & NFT Ecosystem',
    component: EthAddrGeneratorComponent,
    data: {
      reuseRoute: true,
      description:
        'VisualKey is the ultimate visual Ethereum wallet generator that allows creating a private key and address displayed as unique 16×16 (private key) and 10×16 (address) grids. Instantly check balances and activity across major EVM-compatible blockchains like Ethereum, Base, Arbitrum One, Polygon, BNB Chain, Unichain, OP Mainnet, Avalanche, Gnosis, Cronos, and Celo. Turn your discoveries into NFTs: mint a Visual Key NFT based on the generated address. Rarity is determined by the number of leading zero bits in the address and enhanced by VisualKey (VKEY) tokens. Use VisualKey to discover rare addresses, check balances, mint NFTs, and manage VKEY tokens through buying, burning, and power boosting.',
    },
  },
  {
    path: 'token',
    title: 'VKEY Token',
    component: TokenComponent,
    data: {
      description:
        'Learn about the VKEY token, how to acquire it, and its role within the Visual Key ecosystem. Get details on tokenomics and utility.',
    },
    children: [
      {
        path: 'acquire',
        title: 'Get VKEY Tokens',
        component: AcquireTokenComponent,
        data: {
          description:
            'Acquire VKEY tokens to participate in the Visual Key ecosystem. Find out how to get tokens to mint NFTs and access special features.',
        },
      },
      {
        path: 'burn',
        title: 'Burn VKEY Tokens',
        component: BurnTokenComponent,
        data: {
          description:
            'Use the burn mechanism for VKEY tokens. Understand the process and implications of burning tokens within the Visual Key platform.',
        },
      },
      {
        path: 'about',
        title: 'About VKEY',
        loadComponent: () => import('./pages/token/about-token/about-token.component').then(m => m.AboutTokenComponent),
        data: {
          description:
            'Explore the fundamentals of the VKEY token, including its purpose, contract details, and the value it brings to the Visual Key project.',
        },
      },
    ],
  },
  {
    path: 'nft',
    component: NftComponent,
    title: 'Visual Key NFT',
    data: {
      description:
        'Discover the Visual Key NFT collection. Browse, mint, and manage your unique, visually generated Ethereum-based NFTs.',
    },
    children: [
      {
        path: 'mint/:id',
        title: 'Mint Visual Key NFT',
        component: MintNftComponent,
        data: {
          description:
            'Mint your own unique Visual Key NFT. Follow the steps to create a new, visually distinct NFT and add it to your collection.',
        },
      },
      {
        path: 'view/:id',
        title: route => `Visual Key ${route.params['id']}`,
        loadComponent: () => import('./pages/nft/view-nft/view-nft.component').then(m => m.ViewNftComponent),
        data: {
          description:
            'View the details of a specific Visual Key NFT. See its visual representation, properties, and ownership information.',
        },
      },
      {
        path: 'my',
        title: 'My Visual Keys',
        component: ViewMyNftsComponent,
        data: {
          description:
            'View and manage all the Visual Key NFTs you own. Access your personal collection and see the unique visual keys in your wallet.',
        },
      },
      {
        path: 'all',
        title: 'All Visual Keys',
        component: ViewAllNftsComponent,
        data: {
          description:
            'Browse the complete collection of all minted Visual Key NFTs. Explore the variety of visual designs and find specific NFTs.',
        },
      },
      {
        path: 'find-rare',
        title: 'Find Rare Visual Keys',
        loadComponent: () => import('./pages/nft/find-rare/find-rare.component').then(m => m.FindRareComponent),
        data: {
          reuseRoute: true,
          description:
            'Use our tool to find rare Visual Key NFTs. Analyze traits and properties to identify the most unique and valuable NFTs in the collection.',
        },
      },
      {
        path: 'about',
        title: 'About Visual Keys',
        loadComponent: () => import('./pages/nft/about-nft/about-nft.component').then(m => m.AboutNftComponent),
        data: {
          description:
            'Learn about the Visual Key NFT project, the concept behind visually generated keys, and the technology that powers our unique NFT ecosystem.',
        },
      },
    ],
  },
  {
    path: 'tools',
    component: ToolsComponent,
    title: 'Visual Key Tools',
    data: {
      description:
        'Access a suite of powerful tools for the Ethereum blockchain, including a vanity address generator and other utilities for developers and users.',
    },
    children: [
      {
        path: 'vanity-address-generator',
        title: 'Vanity Ethereum Address Generator',
        loadComponent: () =>
          import('./pages/tools/vanity-address-generator/vanity-address-generator.component').then(
            m => m.VanityAddressGeneratorComponent,
          ),
        data: {
          description:
            'Create a custom Ethereum address with a specific prefix or suffix. Our tool makes it easy to generate a personalized vanity address.',
        },
      },
    ],
  },
  {
    path: 'source-code',
    title: 'Source Code',
    loadComponent: () => import('./pages/source-code/source-code.component').then(m => m.SourceCodeComponent),
    data: {
      description:
        'Explore the open-source code for the Visual Key project. Review our contracts and UI code on GitHub to see how it all works.',
    },
  },
  {
    path: 'admin',
    title: 'VisualKey Admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    data: {
      description:
        'Admin panel for managing the Visual Key project. Access to this area is restricted to authorized personnel.',
    },
  },
];
