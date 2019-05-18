import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RulesComponent } from './rules.component';
import { FormsModule } from '@angular/forms';
import { sleep, MockIpcRenderer } from 'app/darksocks.testdata';
declare var global: any;
describe('RulesComponent', () => {
  let component: RulesComponent;
  let fixture: ComponentFixture<RulesComponent>;
  global.ipcRenderer = new MockIpcRenderer()
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RulesComponent],
      imports: [FormsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.dimissDelay = 10
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save', async () => {
    global.ipcRenderer.fail = false
    component.rules = "!save"
    fixture.debugElement.nativeElement.querySelector(".btn-info").click()
    fixture.detectChanges();
    expect(component.rules).toEqual("!save")
    await sleep(50)
    expect(component.message).toEqual("")
    //
    global.ipcRenderer.fail = true
    fixture.debugElement.nativeElement.querySelector(".btn-info").click()
    fixture.detectChanges();
    expect(component.message).toBe("mock error")
    //
    global.ipcRenderer.fail = false
  });
});
