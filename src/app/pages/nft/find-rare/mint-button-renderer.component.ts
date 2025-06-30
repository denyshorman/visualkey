import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Button } from 'primeng/button';
import { GridRow } from './find-rare.component';

@Component({
  selector: 'app-mint-button-renderer',
  standalone: true,
  imports: [Button],
  template: `
    <p-button
      label="Mint"
      size="small"
      [outlined]="true"
      severity="secondary"
      (click)="mint()"
      styleClass="h-6"
    ></p-button>
  `,
})
export class MintButtonRendererComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams<GridRow>;

  constructor(private router: Router) {}

  agInit(params: ICellRendererParams<GridRow>): void {
    this.params = params;
  }

  refresh(): boolean {
    return false;
  }

  mint(): void {
    const row = this.params.data;
    if (row) {
      sessionStorage.setItem('mintNftPrivateKey', row.privateKeyHex);
      this.router.navigate(['/nft/mint', row.addressHex]);
    }
  }
}
