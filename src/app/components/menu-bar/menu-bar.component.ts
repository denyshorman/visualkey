import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { LogoButtonComponent } from './buttons/logo-button.component';
import { ThemeButtonComponent } from './buttons/theme-button.component';
import { NetworkSwitchButtonComponent } from './buttons/network-switch-button.component';
import { ConnectButtonComponent } from './buttons/connect-button.component';

@Component({
  selector: 'app-menu-bar',
  imports: [Menubar, LogoButtonComponent, ThemeButtonComponent, NetworkSwitchButtonComponent, ConnectButtonComponent],
  template: `
    <p-menubar [model]="menuItems">
      <ng-template #start>
        <app-menu-logo-button />
      </ng-template>
      <ng-template #end>
        <div class="flex gap-1">
          <app-menu-theme-button />
          <app-menu-network-switch-button />
          <app-menu-connect-button />
        </div>
      </ng-template>
    </p-menubar>
  `,
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
          label: 'Vanity Address Generator',
          routerLink: ['/tools/vanity-address-generator'],
        },
        {
          separator: true,
        },
        {
          label: 'Terms of Service',
          routerLink: ['/terms-of-service'],
        },
        {
          label: 'Privacy Policy',
          routerLink: ['/privacy-policy'],
        },
        {
          label: 'Source Code',
          routerLink: ['/source-code'],
        },
        {
          label: 'Contact',
          routerLink: ['/contact'],
        },
      ],
    },
  ];
}
