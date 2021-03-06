import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NavComponent } from './nav.component';
import { MockIpcRenderer, sleep } from '../darksocks.testdata';
declare var global: any;

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  global.ipcRenderer = new MockIpcRenderer()
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NavComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start', async () => {
    fixture.debugElement.nativeElement.querySelector(".nav-status-action").click()
    expect(component.status).toEqual("Pending")
    fixture.debugElement.nativeElement.querySelector(".nav-status-action").click()
    await sleep(150)
    expect(component.status).toEqual("Running")
    fixture.debugElement.nativeElement.querySelector(".nav-status-action").click()
    await sleep(150)
    expect(component.status).toEqual("Stopped")
  });

  it('should switch', async () => {
    let items = fixture.debugElement.nativeElement.querySelectorAll(".nav-item")
    for (let i = 0; i < items.length && i < 4; i++) {
      items[i].click()
      switch (i) {
        case 0:
          expect(component.activated).toBe("conf")
          break
        case 1:
          expect(component.activated).toBe("rules")
          break
        case 2:
          expect(component.activated).toBe("log")
          break
      }
    }
  });
});
