import { Routes } from '@angular/router';
import { EthAddrGeneratorComponent } from './pages/eth-addr-generator/eth-addr-generator.component';
import { MintNftComponent } from './pages/nft/mint-nft/mint-nft.component';
import { NftComponent } from './pages/nft/nft.component';
import { ViewMyNftsComponent } from './pages/nft/view-my-nfts/view-my-nfts.component';
import { TokenComponent } from './pages/token/token.component';
import { ViewAllNftsComponent } from './pages/nft/view-all-nfts/view-all-nfts.component';
import { AcquireTokenComponent } from './pages/token/acquire-token/acquire-token.component';
import { BurnTokenComponent } from './pages/token/burn-token/burn-token.component';

export const routes: Routes = [
  {
    path: '',
    title: 'A Visual Ethereum Wallet Generator, Balance Checker & NFT Ecosystem',
    component: EthAddrGeneratorComponent,
    data: { reuseRoute: true },
  },
  {
    path: 'token',
    title: 'VKEY Token',
    component: TokenComponent,
    children: [
      {
        path: 'acquire',
        title: 'Get VKEY Tokens',
        component: AcquireTokenComponent,
      },
      {
        path: 'burn',
        title: 'Burn VKEY Tokens',
        component: BurnTokenComponent,
      },
      {
        path: 'about',
        title: 'About VKEY',
        loadComponent: () => import('./pages/token/about-token/about-token.component').then(m => m.AboutTokenComponent),
      },
    ],
  },
  {
    path: 'nft',
    component: NftComponent,
    title: 'Visual Key NFT',
    children: [
      { path: 'mint/:id', title: 'Mint Visual Key NFT', component: MintNftComponent },
      {
        path: 'view/:id',
        title: route => `Visual Key ${route.params['id']}`,
        loadComponent: () => import('./pages/nft/view-nft/view-nft.component').then(m => m.ViewNftComponent),
      },
      { path: 'my', title: 'My Visual Keys', component: ViewMyNftsComponent },
      { path: 'all', title: 'All Visual Keys', component: ViewAllNftsComponent },
      {
        path: 'find-rare',
        title: 'Find Rare Visual Keys',
        data: { reuseRoute: true },
        loadComponent: () => import('./pages/nft/find-rare/find-rare.component').then(m => m.FindRareComponent),
      },
      {
        path: 'about',
        title: 'About Visual Keys',
        loadComponent: () => import('./pages/nft/about-nft/about-nft.component').then(m => m.AboutNftComponent),
      },
    ],
  },
  {
    path: 'admin',
    title: 'VisualKey Admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
  },
];
