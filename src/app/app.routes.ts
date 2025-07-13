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
        'Explore the VKEY token — the core utility token of the VisualKey ecosystem. Learn about VKEY tokenomics, its role in NFT minting, rarity boosting, and how to acquire, use, or burn VKEY for enhanced NFT value. Unlock exclusive features and maximize your VisualKey experience with VKEY.',
    },
    children: [
      {
        path: 'acquire',
        title: 'Get VKEY Tokens',
        component: AcquireTokenComponent,
        data: {
          description:
            'Acquire VKEY tokens to mint rare Visual Key NFTs, boost NFT rarity, and access exclusive features on the VisualKey platform. Secure your VKEY today and start building a valuable NFT collection powered by blockchain technology.',
        },
      },
      {
        path: 'burn',
        title: 'Burn VKEY Tokens',
        component: BurnTokenComponent,
        data: {
          description:
            'Burn VKEY tokens to decrease supply and increase scarcity, directly impacting the value of VKEY within the VisualKey NFT ecosystem. Support a deflationary token model and enhance the rarity of your digital assets.',
        },
      },
      {
        path: 'about',
        title: 'About VKEY',
        loadComponent: () => import('./pages/token/about-token/about-token.component').then(m => m.AboutTokenComponent),
        data: {
          description:
            'Discover everything about the VKEY token: its purpose, smart contract details, and how it empowers the VisualKey NFT ecosystem. Learn how VKEY drives rarity, value, and innovation in blockchain-based digital collectibles.',
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
        'Visual Key NFTs are unique, Ethereum-based digital collectibles generated from visual wallet addresses. Browse the NFT gallery, mint your own Visual Key NFT, and manage your blockchain art collection. Experience on-chain rarity, provable uniqueness, and the intersection of cryptography and digital art.',
    },
    children: [
      {
        path: 'mint/:id',
        title: 'Mint Visual Key NFT',
        component: MintNftComponent,
        data: {
          description:
            'Mint a one-of-a-kind Visual Key NFT from your unique Ethereum address. Secure your place in the VisualKey collection and own a provably rare digital asset on the blockchain.',
        },
      },
      {
        path: 'view/:id',
        title: route => `Visual Key ${route.params['id']}`,
        loadComponent: () => import('./pages/nft/view-nft/view-nft.component').then(m => m.ViewNftComponent),
        data: {
          description:
            'View detailed information about a specific Visual Key NFT, including its visual grid, on-chain rarity score, blockchain properties, and current owner.',
        },
      },
      {
        path: 'my',
        title: 'My Visual Keys',
        component: ViewMyNftsComponent,
        data: {
          description:
            'Access your personal Visual Key NFT gallery. Manage, track, and showcase your owned NFTs. Connect your crypto wallet to view your exclusive collection of visual Ethereum addresses as digital art.',
        },
      },
      {
        path: 'all',
        title: 'All Visual Keys',
        component: ViewAllNftsComponent,
        data: {
          description:
            'Browse the entire Visual Key NFT collection. Discover all minted NFTs, explore rarity rankings, and find inspiration in the world of visual blockchain art.',
        },
      },
      {
        path: 'find-rare',
        title: 'Find Rare Visual Keys',
        loadComponent: () => import('./pages/nft/find-rare/find-rare.component').then(m => m.FindRareComponent),
        data: {
          reuseRoute: true,
          description:
            'Find and discover rare Visual Key NFTs with high rarity scores. Use advanced search tools to identify valuable and unique Ethereum address-based NFTs for your collection.',
        },
      },
      {
        path: 'about',
        title: 'About Visual Keys',
        loadComponent: () => import('./pages/nft/about-nft/about-nft.component').then(m => m.AboutNftComponent),
        data: {
          description:
            'Learn about Visual Key NFTs — an innovative project transforming Ethereum addresses into on-chain generative art. Discover the technology, rarity mechanics, and the vision behind the VisualKey NFT ecosystem.',
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
        'Access powerful Ethereum and blockchain tools with VisualKey. Generate vanity wallet addresses, utilize developer utilities, and enhance your Web3 experience. Perfect for crypto enthusiasts and blockchain developers seeking advanced features.',
    },
    children: [
      {
        path: 'vanity-address-generator',
        title: 'Ethereum Vanity Address Generator',
        loadComponent: () =>
          import('./pages/tools/vanity-address-generator/vanity-address-generator.component').then(
            m => m.VanityAddressGeneratorComponent,
          ),
        data: {
          description:
            'Generate custom Ethereum vanity wallet addresses securely in your browser with our high-performance WebAssembly tool. Personalize your Ethereum address for branding, identity, or privacy — no third-party servers, 100% client-side.',
        },
      },
    ],
  },
  {
    path: 'terms-of-service',
    title: 'Terms of Service',
    loadComponent: () =>
      import('./pages/terms-of-service/terms-of-service.component').then(m => m.TermsOfServiceComponent),
    data: {
      description:
        'Read the official Terms of Service for VisualKey. Understand your rights, responsibilities, and the rules for using our Ethereum wallet generator, NFT platform, and blockchain tools.',
    },
  },
  {
    path: 'privacy-policy',
    title: 'Privacy Policy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
    data: {
      description:
        'Review the VisualKey Privacy Policy to understand how your data is collected, used, and protected. Learn about your privacy rights and our commitment to data security on the VisualKey platform.',
    },
  },
  {
    path: 'source-code',
    title: 'Source Code',
    loadComponent: () => import('./pages/source-code/source-code.component').then(m => m.SourceCodeComponent),
    data: {
      description:
        'Access the open-source codebase of VisualKey, including smart contracts and frontend application, on GitHub. Verify, audit, or contribute to the VisualKey project and help shape the future of blockchain art and wallet security.',
    },
  },
  {
    path: 'contact',
    title: 'Contact Us',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent),
    data: {
      description:
        "Contact the VisualKey team for support, feedback, or partnership inquiries. Reach out via our contact form or find our direct contact details. We're here to help you with all things VisualKey.",
    },
  },
  {
    path: 'admin',
    title: 'VisualKey Admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    data: {
      description:
        'Admin dashboard for managing the platform. Restricted access for authorized administrators to oversee project operations and user management.',
    },
  },
];
