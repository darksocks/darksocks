import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfComponent } from './conf.component';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { AngularDraggableModule } from 'angular2-draggable';
import { MockIpcRenderer, sleep } from '../darksocks.testdata';
declare var global: any;

describe('ConfComponent', () => {
  let component: ConfComponent;
  let fixture: ComponentFixture<ConfComponent>;
  global.ipcRenderer = new MockIpcRenderer()
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ConfComponent],
      imports: [
        FormsModule,
        BrowserModule,
        NgSelectModule,
        AngularDraggableModule
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfComponent);
    component = fixture.componentInstance;
    component.dimissDelay = 100;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save success', async () => {
    global.ipcRenderer.fail = false
    fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
    fixture.detectChanges();
    expect(component.message).toBe("saved");
    await sleep(150)
    expect(component.message).toBe("");
  });

  it('should save success showlog', async () => {
    global.ipcRenderer.fail = false
    fixture.debugElement.nativeElement.querySelector("input[type='checkbox']").click()
    fixture.detectChanges();
    fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
    fixture.detectChanges();
    expect(component.message).toBe("saved");
    await sleep(150)
    expect(component.message).toBe("");
  });


  // it('should save fail', async () => {
  //   global.ipcRenderer.fail = true
  //   fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
  //   fixture.detectChanges();
  //   expect(component.message).not.toBe("saved");
  //   await sleep(150)
  //   expect(component.message).toBe("");
  // });

  // it('should load web not exist fail', async () => {
  //   global.ipcRenderer.fail = true
  //   global.ipcRenderer.notWeb = true
  //   component.reload();
  //   expect(component.conf.web != null).toBe(true)
  // });
});
