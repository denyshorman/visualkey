import { Component, HostListener, OnInit } from '@angular/core';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
  selector: 'app-root',
  template: '<app-eth-addr-generator></app-eth-addr-generator>',
  styleUrls: [],
})
export class AppComponent implements OnInit {
  constructor(private gaService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.gaService.event('display_mode_standalone');
    }
  }

  @HostListener('window:appinstalled')
  onAppInstalled() {
    this.gaService.event('app_installed');
  }
}
