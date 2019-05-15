import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LogComponent } from './log.component';
import { MockIpcRenderer, sleep } from '../darksocks.testdata';
declare var global: any;

describe('LogComponent', () => {
  let component: LogComponent;
  let fixture: ComponentFixture<LogComponent>;
  global.ipcRenderer = new MockIpcRenderer()
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LogComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should start', async () => {
    global.ipcRenderer.startDarkSocks()
    await sleep(150)
    global.ipcRenderer.stopDarkSocks()
    await sleep(150)
  });
});
