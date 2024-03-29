import { isDevMode, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BitSetComponent } from './components/bit-set/bit-set.component';
import { EthInfoComponent } from './components/eth-info/eth-info.component';
import { PanelModule } from 'primeng/panel';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CardModule } from 'primeng/card';
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { EthAddrGeneratorComponent } from './pages/eth-addr-generator/eth-addr-generator.component';
import { EthAddrHistoryComponent } from './components/eth-addr-history/eth-addr-history.component';
import { BitSetControllerComponent } from './components/bit-set-controller/bit-set-controller.component';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { LoadBitSetDialogComponent } from './components/load-bit-set-dialog/load-bit-set-dialog.component';
import { CheckboxModule } from 'primeng/checkbox';
import { AgGridModule } from 'ag-grid-angular';
import { DropdownModule } from 'primeng/dropdown';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { LongPressDirective } from './directives/long-press.directive';
import { TooltipModule } from 'primeng/tooltip';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';
import { environment } from '../environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NftDialogComponent } from './components/nft/nft-dialog/nft-dialog.component';
import { HttpClientModule } from '@angular/common/http';
import { NftListComponent } from './components/nft/nft-list/nft-list.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';

@NgModule({
  declarations: [
    AppComponent,
    BitSetComponent,
    EthInfoComponent,
    EthAddrGeneratorComponent,
    EthAddrHistoryComponent,
    BitSetControllerComponent,
    LoadBitSetDialogComponent,
    NftDialogComponent,
    LongPressDirective,
    NftListComponent,
  ],
  imports: [
    NgxGoogleAnalyticsModule.forRoot(environment.gaMeasurementId),
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    PanelModule,
    CardModule,
    MenubarModule,
    TableModule,
    DialogModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    CheckboxModule,
    AgGridModule,
    DropdownModule,
    FontAwesomeModule,
    RippleModule,
    SelectButtonModule,
    TooltipModule,
    ProgressBarModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [MessageService],
  bootstrap: [AppComponent],
})
export class AppModule {}
