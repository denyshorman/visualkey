import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-nft-page',
  imports: [RouterOutlet],
  host: {
    class: 'contents',
  },
  template: `<router-outlet />`,
})
export class NftComponent {}
