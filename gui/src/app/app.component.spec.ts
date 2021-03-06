import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { } from "jasmine"
import { NavComponent } from './nav/nav.component';
import { ConfComponent } from './conf/conf.component';
import { LogComponent } from './log/log.component';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { AngularDraggableModule } from 'angular2-draggable';
import { MockIpcRenderer } from './darksocks.testdata';
import { RulesComponent } from './rules/rules.component';
declare var global: any;
describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  beforeEach(async(() => {
    global.ipcRenderer = new MockIpcRenderer()
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        NavComponent,
        ConfComponent,
        LogComponent,
        RulesComponent,
      ],
      imports: [
        FormsModule,
        BrowserModule,
        NgSelectModule,
        AngularDraggableModule
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should close app', async(() => {
    fixture.debugElement.nativeElement.querySelector(".app-tool-close").click()
  }));

  it('should switch', async(() => {
    component.doNavSwitch({ key: "log" })
  }));
});
