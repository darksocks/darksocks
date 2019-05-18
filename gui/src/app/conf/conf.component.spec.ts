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
    //add enable
    component.server.enable = true
    component.server.name = "name1"
    component.server.addr = "addr"
    component.server.username = "username"
    component.server.password = "password"
    fixture.detectChanges()
    fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
    fixture.detectChanges();
    expect(component.message).toBe("saved");
    //add disabled
    component.server.enable = false
    component.server.name = "name2"
    component.server.addr = "addr"
    component.server.username = "username"
    component.server.password = "password"
    fixture.detectChanges()
    fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
    fixture.detectChanges();
    expect(component.message).toBe("saved");
    //add enabled again
    component.server.enable = true
    component.server.name = "name3"
    component.server.addr = "addr"
    component.server.username = "username"
    component.server.password = "password"
    fixture.detectChanges()
    fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
    fixture.detectChanges();
    expect(component.message).toBe("saved");
    //save error
    {
      component.message = ""
      component.server.enable = true
      component.server.name = "name4"
      component.server.addr = ""
      component.server.username = ""
      component.server.password = ""
      fixture.detectChanges()
      fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
      fixture.detectChanges();
      expect(component.message).toBe("");
      //
      component.message = ""
      component.server.enable = true
      component.server.name = ""
      component.server.addr = "addr"
      component.server.username = ""
      component.server.password = ""
      fixture.detectChanges()
      fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
      fixture.detectChanges();
      expect(component.message).toBe("");
      //
      component.message = ""
      component.server.enable = true
      component.server.name = ""
      component.server.addr = ""
      component.server.username = "username"
      component.server.password = ""
      fixture.detectChanges()
      fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
      fixture.detectChanges();
      expect(component.message).toBe("");
      //
      component.message = ""
      component.server.enable = true
      component.server.name = ""
      component.server.addr = ""
      component.server.username = ""
      component.server.password = "password"
      fixture.detectChanges()
      fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
      fixture.detectChanges();
      console.log(component.message)
      expect(component.message).toBe("");
      //
      //clear
      component.server.enable = false
      component.server.name = ""
      component.server.addr = ""
      component.server.username = ""
      component.server.password = ""
    }
    await sleep(150)
    //enable
    fixture.debugElement.nativeElement.querySelectorAll(".app-server-list .app-server-enable input")[0].click()
    fixture.detectChanges()
    expect(component.conf.servers[0].enable).toEqual(true)
    fixture.debugElement.nativeElement.querySelectorAll(".app-server-list .app-server-enable input")[1].click()
    fixture.detectChanges()
    expect(component.conf.servers[1].enable).toEqual(true)
    fixture.debugElement.nativeElement.querySelectorAll(".app-server-list .app-server-enable input")[1].click()
    fixture.detectChanges()
    expect(component.conf.servers[1].enable).toEqual(false)
    //remove
    fixture.debugElement.nativeElement.querySelectorAll(".app-server-list .app-server-remove")[0].click()
    fixture.detectChanges()
    //save log
    component.conf.log = "10"
    fixture.detectChanges()
    fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
    fixture.detectChanges();
    expect(component.message).toBe("saved");
    //
    await sleep(150)
    expect(component.message).toBe("");
    //save fail
    global.ipcRenderer.fail = true
    fixture.debugElement.nativeElement.querySelector(".app-conf-save .btn-info").click()
    fixture.detectChanges();
    expect(component.message).toBe("save fail by mock error");
    //
    global.ipcRenderer.fail = false
  });

  it('should reload success', async () => {
    component.conf = {};
    global.ipcRenderer.emit("status")
    global.ipcRenderer.emit("change-server")
    fixture.detectChanges()
    expect(component.conf.socks_addr != null).toEqual(true)
    component.reload()
  });

  it('should update gfwlist success', async () => {
    //
    await component.updateGfwList()
    expect(component.message).toBe("Update GFW list success");
    //
    component.message = ""
    component.ugfw.nativeElement.innerHTML = "updating"
    await component.updateGfwList()
    expect(component.message).toBe("");
    component.ugfw.nativeElement.innerHTML = "UpdateGfwList"
    //
    global.ipcRenderer.fail = true
    await component.updateGfwList()
    expect(component.message).toBe("mock error");
    //
    global.ipcRenderer.fail = false
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
