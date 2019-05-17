import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injectable, ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AngularDraggableModule } from 'angular2-draggable';
import { LogComponent } from './log/log.component';
import { ConfComponent } from './conf/conf.component';
import { RulesComponent } from './rules/rules.component';

// @Injectable()
// class GlobalErrorHandler implements ErrorHandler {
//   constructor() { }
//   handleError(error) {
//     console.error(error)
//     // alert(error.stack)
//   }
// }

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    ConfComponent,
    LogComponent,
    ConfComponent,
    RulesComponent,
  ],
  imports: [
    FormsModule,
    BrowserModule,
    NgSelectModule,
    AngularDraggableModule
  ],
  providers: [
    // {
    //   provide: ErrorHandler,
    //   useClass: GlobalErrorHandler
    // }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }