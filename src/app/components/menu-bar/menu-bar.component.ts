import { Component, computed } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { Button } from 'primeng/button';
import { ThemeService } from '../../services/theme.service';
import { faMoon } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { WalletService } from '../../services/wallet.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-bar',
  imports: [Menubar, Button, FaIconComponent, RouterLink],
  templateUrl: './menu-bar.component.html',
})
export class MenuBarComponent {
  readonly menuItems: MenuItem[] = [
    {
      label: 'Token',
      items: [
        {
          label: 'Acquire',
          routerLink: ['/token/acquire'],
        },
        {
          label: 'Burn',
          routerLink: ['/token/burn'],
        },
        {
          label: 'About',
          routerLink: ['/token/about'],
        },
      ],
    },
    {
      label: 'NFT',
      items: [
        {
          label: 'My NFTs',
          routerLink: ['/nft/my'],
        },
        {
          label: 'All NFTs',
          routerLink: ['/nft/all'],
        },
        {
          label: 'Find Rare',
          routerLink: ['/nft/find-rare'],
        },
        {
          label: 'About',
          routerLink: ['/nft/about'],
        },
      ],
    },
  ];

  readonly icons = {
    faMoon,
  };

  readonly accountFormatted = computed(() => {
    const account = this.wallet.accountAddress();

    if (account === undefined) {
      return undefined;
    }

    return `${account.slice(0, 6)}...${account.slice(-4)}`;
  });

  constructor(
    public theme: ThemeService,
    public wallet: WalletService,
  ) {}
}
