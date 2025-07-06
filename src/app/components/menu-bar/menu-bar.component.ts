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
          label: 'Get',
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
          label: 'Find Rare NFTs',
          routerLink: ['/nft/find-rare'],
        },
        {
          label: 'My NFTs',
          routerLink: ['/nft/my'],
        },
        {
          label: 'All NFTs',
          routerLink: ['/nft/all'],
        },
        {
          label: 'About',
          routerLink: ['/nft/about'],
        },
      ],
    },
    {
      label: 'More',
      items: [
        {
          label: 'Source Code',
          routerLink: ['/source-code'],
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
